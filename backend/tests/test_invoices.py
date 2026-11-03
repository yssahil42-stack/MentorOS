import unittest
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import models
from backend.app.auth import create_access_token, get_password_hash
from backend.app.database import Base, get_db
from backend.app.main import app


class InvoiceTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.session_factory = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

        def override_get_db():
            db = self.session_factory()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def create_user(self, email: str, role: str = "freelancer") -> models.User:
        with self.session_factory() as db:
            user = models.User(
                email=email,
                hashed_password=get_password_hash("test-password-123"),
                full_name="Alex Freelancer",
                role=role,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user

    def create_project(self, user: models.User, title: str = "Client Web App") -> models.Project:
        with self.session_factory() as db:
            project = models.Project(
                user_id=user.id,
                role="freelancer",
                title=title,
                description="Freelance web app client project",
                status="active",
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            return project

    @staticmethod
    def auth_headers(user: models.User) -> dict[str, str]:
        token = create_access_token({"sub": str(user.id)})
        return {"Authorization": f"Bearer {token}"}

    def test_invoice_crud_lifecycle(self):
        user = self.create_user("freelancer1@test.com")
        project = self.create_project(user)
        headers = self.auth_headers(user)

        # 1. Create Invoice
        payload = {
            "project_id": project.id,
            "invoice_number": "INV-2026-0001",
            "issue_date": "2026-11-01",
            "payment_terms": "net_30",
            "tax_rate": 10.0,
            "currency": "USD",
            "notes": "Thank you for partnering with us.",
            "client_name": "Acme Corp",
            "client_email": "billing@acme.com",
            "line_items": [
                {
                    "description": "UI/UX Design Phase",
                    "quantity": 10,
                    "unit_price": 100.0,
                    "source_type": "custom",
                },
                {
                    "description": "Frontend Implementation",
                    "quantity": 20,
                    "unit_price": 100.0,
                    "source_type": "custom",
                },
            ],
        }

        resp = self.client.post("/api/v1/invoices", json=payload, headers=headers)
        self.assertEqual(resp.status_code, 201)
        created = resp.json()
        self.assertEqual(created["invoice_number"], "INV-2026-0001")
        self.assertEqual(created["subtotal"], 3000.0)
        self.assertEqual(created["tax_amount"], 300.0)
        self.assertEqual(created["total"], 3300.0)
        self.assertEqual(created["status"], "draft")
        self.assertEqual(len(created["line_items"]), 2)
        invoice_id = created["id"]

        # 2. Get Invoices List
        list_resp = self.client.get("/api/v1/invoices", headers=headers)
        self.assertEqual(list_resp.status_code, 200)
        invoices = list_resp.json()
        self.assertEqual(len(invoices), 1)
        self.assertEqual(invoices[0]["id"], invoice_id)

        # 3. Get Single Invoice
        get_resp = self.client.get(f"/api/v1/invoices/{invoice_id}", headers=headers)
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.json()["id"], invoice_id)

        # 4. Patch Invoice
        patch_resp = self.client.patch(
            f"/api/v1/invoices/{invoice_id}",
            json={"notes": "Updated terms.", "tax_rate": 5.0},
            headers=headers,
        )
        self.assertEqual(patch_resp.status_code, 200)
        updated = patch_resp.json()
        self.assertEqual(updated["notes"], "Updated terms.")
        self.assertEqual(updated["tax_amount"], 150.0)
        self.assertEqual(updated["total"], 3150.0)

        # 5. Send Invoice
        send_resp = self.client.post(f"/api/v1/invoices/{invoice_id}/send", headers=headers)
        self.assertEqual(send_resp.status_code, 200)
        self.assertEqual(send_resp.json()["status"], "sent")
        self.assertIsNotNone(send_resp.json()["sent_at"])

        # 6. Mark Paid
        paid_resp = self.client.post(f"/api/v1/invoices/{invoice_id}/mark-paid", headers=headers)
        self.assertEqual(paid_resp.status_code, 200)
        self.assertEqual(paid_resp.json()["status"], "paid")
        self.assertIsNotNone(paid_resp.json()["paid_at"])

        # 7. Stats
        stats_resp = self.client.get("/api/v1/invoices/stats", headers=headers)
        self.assertEqual(stats_resp.status_code, 200)
        stats = stats_resp.json()
        self.assertEqual(stats["total_invoices"], 1)
        self.assertEqual(stats["total_revenue"], 3150.0)

        # 8. Download PDF
        pdf_resp = self.client.get(f"/api/v1/invoices/{invoice_id}/pdf", headers=headers)
        self.assertEqual(pdf_resp.status_code, 200)
        self.assertEqual(pdf_resp.headers["content-type"], "application/pdf")
        self.assertTrue(pdf_resp.content.startswith(b"%PDF-1.4"))

        # 9. Delete Invoice
        del_resp = self.client.delete(f"/api/v1/invoices/{invoice_id}", headers=headers)
        self.assertEqual(del_resp.status_code, 204)

        # Confirm deleted
        get_again = self.client.get(f"/api/v1/invoices/{invoice_id}", headers=headers)
        self.assertEqual(get_again.status_code, 404)

    def test_invoice_generate_from_project_artifacts(self):
        user = self.create_user("generator@test.com")
        headers = self.auth_headers(user)

        with self.session_factory() as db:
            project = models.Project(
                user_id=user.id,
                role="freelancer",
                title="SaaS Redesign",
                status="active",
            )
            db.add(project)
            db.flush()

            milestone = models.Milestone(
                project_id=project.id,
                user_id=user.id,
                role="freelancer",
                title="Design System Deliverable",
                status="completed",
            )
            db.add(milestone)

            task = models.Task(
                project_id=project.id,
                user_id=user.id,
                role="freelancer",
                title="Responsive Navigation Component",
                status="completed",
                actual_minutes=120,
            )
            db.add(task)
            db.commit()
            project_id = project.id

        gen_payload = {
            "project_id": project_id,
            "include_completed_milestones": True,
            "include_completed_tasks": True,
            "tax_rate": 10.0,
        }
        resp = self.client.post("/api/v1/invoices/generate", json=gen_payload, headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertIn("invoice", data)
        self.assertIn("line_items", data)
        self.assertEqual(len(data["source_milestones"]), 1)
        self.assertEqual(len(data["source_tasks"]), 1)
        self.assertGreater(data["invoice"]["total"], 0)

    def test_invoice_cross_user_isolation(self):
        user_a = self.create_user("user_a@test.com")
        user_b = self.create_user("user_b@test.com")
        project_a = self.create_project(user_a)

        headers_a = self.auth_headers(user_a)
        headers_b = self.auth_headers(user_b)

        # User A creates an invoice
        create_resp = self.client.post(
            "/api/v1/invoices",
            json={
                "project_id": project_a.id,
                "line_items": [{"description": "Work", "quantity": 1, "unit_price": 500}],
            },
            headers=headers_a,
        )
        self.assertEqual(create_resp.status_code, 201)
        inv_id = create_resp.json()["id"]

        # User B cannot see User A's invoice in list
        b_list = self.client.get("/api/v1/invoices", headers=headers_b)
        self.assertEqual(len(b_list.json()), 0)

        # User B cannot get User A's invoice
        b_get = self.client.get(f"/api/v1/invoices/{inv_id}", headers=headers_b)
        self.assertEqual(b_get.status_code, 404)

        # User B cannot download PDF
        b_pdf = self.client.get(f"/api/v1/invoices/{inv_id}/pdf", headers=headers_b)
        self.assertEqual(b_pdf.status_code, 404)

        # User B cannot delete
        b_del = self.client.delete(f"/api/v1/invoices/{inv_id}", headers=headers_b)
        self.assertEqual(b_del.status_code, 404)


if __name__ == "__main__":
    unittest.main()
