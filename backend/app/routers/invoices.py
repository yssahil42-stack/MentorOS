from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta
import random
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import Response as RawResponse
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..ownership import require_owned_project

router = APIRouter(prefix="/invoices", tags=["invoices"])


def generate_simple_pdf(title: str, lines: List[str]) -> bytes:
    """Generates a standard compliant single-page PDF with no external dependencies."""
    content = "BT\n/F1 14 Tf\n50 740 Td\n"
    clean_title = title.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    content += f"({clean_title}) Tj\nET\n"
    
    y = 700
    for line in lines:
        escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        content += f"BT\n/F1 10 Tf\n50 {y} Td\n({escaped}) Tj\nET\n"
        y -= 18
        if y < 50:
            break

    stream_bytes = content.encode("latin-1", errors="replace")
    stream_len = len(stream_bytes)

    # Construct xref accurately
    obj1 = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    obj2 = b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    obj3 = b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
    obj4_header = f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode("ascii")
    obj4 = obj4_header + stream_bytes + b"\nendstream\nendobj\n"
    obj5 = b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"

    offsets = [0]
    offsets.append(len(b"%PDF-1.4\n"))
    offsets.append(offsets[-1] + len(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"))
    offsets.append(offsets[-1] + len(obj2))
    offsets.append(offsets[-1] + len(obj3))
    offsets.append(offsets[-1] + len(obj4))

    xref_offset = offsets[-1] + len(obj5)
    xref = f"xref\n0 6\n0000000000 65535 f \n"
    for off in offsets[1:]:
        xref += f"{off:010d} 00000 n \n"
    xref += f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"

    return obj1 + obj2 + obj3 + obj4 + obj5 + xref.encode("ascii")


def calculate_due_date(issue_date_str: str, terms: str) -> str:
    try:
        dt = datetime.fromisoformat(issue_date_str.split("T")[0])
    except Exception:
        dt = datetime.utcnow()
    
    if terms == "net_15":
        dt += timedelta(days=15)
    elif terms == "net_30":
        dt += timedelta(days=30)
    elif terms == "net_45":
        dt += timedelta(days=45)
    
    return dt.strftime("%Y-%m-%d")


def serialize_invoice(invoice: models.Invoice) -> schemas.InvoiceOut:
    project_title = invoice.project.title if invoice.project else None
    line_items_out = [
        schemas.InvoiceLineItemOut(
            id=li.id,
            invoice_id=li.invoice_id,
            description=li.description,
            quantity=li.quantity,
            unit_price=li.unit_price,
            total=li.total,
            sort_order=li.sort_order,
            source_type=li.source_type,
            source_id=li.source_id,
        )
        for li in (invoice.line_items or [])
    ]
    return schemas.InvoiceOut(
        id=invoice.id,
        user_id=invoice.user_id,
        role=invoice.role,
        project_id=invoice.project_id,
        invoice_number=invoice.invoice_number,
        status=invoice.status,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        payment_terms=invoice.payment_terms,
        subtotal=invoice.subtotal,
        tax_rate=invoice.tax_rate,
        tax_amount=invoice.tax_amount,
        total=invoice.total,
        currency=invoice.currency,
        notes=invoice.notes,
        paid_at=invoice.paid_at,
        sent_at=invoice.sent_at,
        client_name=invoice.client_name,
        client_email=invoice.client_email,
        client_address=invoice.client_address,
        project_title=project_title,
        line_items=line_items_out,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=schemas.InvoiceStatsOut)
def get_invoice_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoices = db.query(models.Invoice).filter(models.Invoice.user_id == current_user.id).all()
    total_invoices = len(invoices)
    total_revenue = sum(inv.total for inv in invoices if inv.status == "paid")
    outstanding = sum(inv.total for inv in invoices if inv.status in ("sent", "overdue"))
    
    now_str = datetime.utcnow().strftime("%Y-%m-%d")
    overdue_count = 0
    for inv in invoices:
        if inv.status == "overdue":
            overdue_count += 1
        elif inv.status == "sent" and inv.due_date and inv.due_date < now_str:
            overdue_count += 1

    paid_invoices = [inv for inv in invoices if inv.status == "paid" and inv.paid_at and inv.created_at]
    if paid_invoices:
        days_list = [(inv.paid_at - inv.created_at).total_seconds() / 86400.0 for inv in paid_invoices]
        avg_payment_days = round(sum(days_list) / len(days_list), 1)
    else:
        avg_payment_days = 0.0

    return schemas.InvoiceStatsOut(
        total_invoices=total_invoices,
        total_revenue=round(total_revenue, 2),
        outstanding_amount=round(outstanding, 2),
        overdue_count=overdue_count,
        avg_payment_days=avg_payment_days,
    )


@router.get("", response_model=List[schemas.InvoiceOut])
def get_invoices(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Invoice).filter(models.Invoice.user_id == current_user.id)
    if status:
        query = query.filter(models.Invoice.status == status)
    if project_id:
        query = query.filter(models.Invoice.project_id == project_id)

    invoices = query.order_by(models.Invoice.created_at.desc()).all()
    return [serialize_invoice(inv) for inv in invoices]


@router.get("/{invoice_id}", response_model=schemas.InvoiceOut)
def get_invoice(
    invoice_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id,
        models.Invoice.user_id == current_user.id,
    ).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return serialize_invoice(invoice)


@router.post("", response_model=schemas.InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_in: schemas.InvoiceCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if invoice_in.project_id:
        require_owned_project(db, invoice_in.project_id, current_user.id)

    issue_date = invoice_in.issue_date or datetime.utcnow().strftime("%Y-%m-%d")
    terms = invoice_in.payment_terms or "net_30"
    due_date = invoice_in.due_date or calculate_due_date(issue_date, terms)

    invoice_number = invoice_in.invoice_number
    if not invoice_number:
        count = db.query(models.Invoice).filter(models.Invoice.user_id == current_user.id).count()
        year = datetime.utcnow().strftime("%Y")
        invoice_number = f"INV-{year}-{count + 1:04d}"

    # Calculate totals
    subtotal = sum(item.quantity * item.unit_price for item in invoice_in.line_items)
    tax_rate = invoice_in.tax_rate or 0.0
    tax_amount = round(subtotal * (tax_rate / 100.0), 2)
    total = round(subtotal + tax_amount, 2)

    invoice = models.Invoice(
        user_id=current_user.id,
        project_id=invoice_in.project_id,
        role="freelancer",
        invoice_number=invoice_number,
        status="draft",
        issue_date=issue_date,
        due_date=due_date,
        payment_terms=terms,
        subtotal=round(subtotal, 2),
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total=total,
        currency=invoice_in.currency or "USD",
        notes=invoice_in.notes,
        client_name=invoice_in.client_name,
        client_email=invoice_in.client_email,
        client_address=invoice_in.client_address,
    )
    db.add(invoice)
    db.flush()

    for idx, item in enumerate(invoice_in.line_items):
        item_total = round(item.quantity * item.unit_price, 2)
        line = models.InvoiceLineItem(
            invoice_id=invoice.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item_total,
            sort_order=item.sort_order if item.sort_order is not None else idx,
            source_type=item.source_type,
            source_id=item.source_id,
        )
        db.add(line)

    db.commit()
    db.refresh(invoice)
    return serialize_invoice(invoice)


@router.patch("/{invoice_id}", response_model=schemas.InvoiceOut)
def update_invoice(
    invoice_id: int,
    invoice_in: schemas.InvoiceUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id,
        models.Invoice.user_id == current_user.id,
    ).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    update_data = invoice_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)

    # Recalculate tax and total if tax_rate changed
    if "tax_rate" in update_data:
        tax_rate = invoice.tax_rate or 0.0
        invoice.tax_amount = round(invoice.subtotal * (tax_rate / 100.0), 2)
        invoice.total = round(invoice.subtotal + invoice.tax_amount, 2)

    db.commit()
    db.refresh(invoice)
    return serialize_invoice(invoice)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id,
        models.Invoice.user_id == current_user.id,
    ).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    db.delete(invoice)
    db.commit()
    return None


@router.post("/generate")
def generate_invoice_preview(
    req: schemas.GenerateInvoiceFromProjectRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owned_project(db, req.project_id, current_user.id)
    project = db.query(models.Project).filter(
        models.Project.id == req.project_id,
        models.Project.user_id == current_user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    line_items: List[Dict[str, Any]] = []
    source_milestones: List[int] = []
    source_tasks: List[int] = []

    if req.include_completed_milestones:
        for m in project.milestones:
            if m.status == "completed":
                source_milestones.append(m.id)
                line_items.append({
                    "description": f"Milestone: {m.title}",
                    "quantity": 1.0,
                    "unit_price": 500.0,
                    "total": 500.0,
                    "sort_order": len(line_items),
                    "source_type": "milestone",
                    "source_id": m.id,
                })

    if req.include_completed_tasks:
        for t in project.tasks:
            if t.status == "completed":
                source_tasks.append(t.id)
                hours = round((t.actual_minutes or t.estimated_minutes or 60) / 60.0, 2)
                rate = 75.0
                line_items.append({
                    "description": f"Task: {t.title}",
                    "quantity": hours,
                    "unit_price": rate,
                    "total": round(hours * rate, 2),
                    "sort_order": len(line_items),
                    "source_type": "task",
                    "source_id": t.id,
                })

    if not line_items:
        line_items.append({
            "description": f"Services for {project.title}",
            "quantity": 1.0,
            "unit_price": 1000.0,
            "total": 1000.0,
            "sort_order": 0,
            "source_type": "custom",
            "source_id": None,
        })

    subtotal = sum(item["total"] for item in line_items)
    tax_rate = req.tax_rate or 0.0
    tax_amount = round(subtotal * (tax_rate / 100.0), 2)
    total = round(subtotal + tax_amount, 2)

    issue_date = datetime.utcnow().strftime("%Y-%m-%d")
    terms = req.payment_terms or "net_30"
    due_date = calculate_due_date(issue_date, terms)

    count = db.query(models.Invoice).filter(models.Invoice.user_id == current_user.id).count()
    year = datetime.utcnow().strftime("%Y")
    preview_number = f"INV-{year}-{count + 1:04d}"

    invoice_preview = {
        "user_id": current_user.id,
        "project_id": project.id,
        "role": "freelancer",
        "invoice_number": preview_number,
        "status": "draft",
        "issue_date": issue_date,
        "due_date": due_date,
        "payment_terms": terms,
        "subtotal": round(subtotal, 2),
        "tax_rate": tax_rate,
        "tax_amount": tax_amount,
        "total": total,
        "currency": req.currency or "USD",
        "notes": req.notes or f"Generated for {project.title}",
        "client_name": project.title.split("-")[0].strip() if "-" in project.title else project.title,
        "client_email": "client@example.com",
        "project_title": project.title,
    }

    return {
        "invoice": invoice_preview,
        "line_items": line_items,
        "source_milestones": source_milestones,
        "source_tasks": source_tasks,
    }


@router.post("/{invoice_id}/send", response_model=schemas.InvoiceOut)
def send_invoice(
    invoice_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id,
        models.Invoice.user_id == current_user.id,
    ).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    invoice.status = "sent"
    invoice.sent_at = datetime.utcnow()
    db.commit()
    db.refresh(invoice)
    return serialize_invoice(invoice)


@router.post("/{invoice_id}/mark-paid", response_model=schemas.InvoiceOut)
def mark_invoice_paid(
    invoice_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id,
        models.Invoice.user_id == current_user.id,
    ).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    invoice.status = "paid"
    invoice.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(invoice)
    return serialize_invoice(invoice)


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id,
        models.Invoice.user_id == current_user.id,
    ).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    project_title = invoice.project.title if invoice.project else "Freelance Services"
    lines = [
        f"INVOICE #: {invoice.invoice_number}",
        f"Status: {invoice.status.upper()} | Payment Terms: {invoice.payment_terms}",
        f"Issue Date: {invoice.issue_date} | Due Date: {invoice.due_date}",
        "----------------------------------------------------------------",
        f"Billed To: {invoice.client_name or 'Client'}",
        f"Project: {project_title}",
        "----------------------------------------------------------------",
        "Line Items:",
    ]

    for item in invoice.line_items:
        lines.append(
            f" - {item.description}: {item.quantity} x ${item.unit_price:.2f} = ${item.total:.2f}"
        )

    lines.extend([
        "----------------------------------------------------------------",
        f"Subtotal: ${invoice.subtotal:.2f}",
        f"Tax ({invoice.tax_rate}%): ${invoice.tax_amount:.2f}",
        f"Total Due: ${invoice.total:.2f} {invoice.currency}",
        "----------------------------------------------------------------",
        f"Notes: {invoice.notes or 'Thank you for your business!'}",
    ])

    pdf_bytes = generate_simple_pdf(f"MentorOS Invoice {invoice.invoice_number}", lines)

    return RawResponse(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="invoice-{invoice.invoice_number}.pdf"',
        },
    )
