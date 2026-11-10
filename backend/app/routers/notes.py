from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..ownership import require_owned_project

router = APIRouter(prefix="/notes", tags=["notes"])

@router.get("", response_model=List[schemas.NoteOut])
def get_notes(
    project_id: Optional[int] = None,
    role: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Note).filter(models.Note.user_id == current_user.id)
    target_role = role or current_user.role
    query = query.filter(models.Note.role == target_role)
    if project_id:
        query = query.filter(models.Note.project_id == project_id)
    return query.order_by(models.Note.is_pinned.desc(), models.Note.created_at.desc()).all()

@router.post("", response_model=schemas.NoteOut)
def create_note(
    note_in: schemas.NoteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_role = note_in.role or current_user.role
    if note_in.project_id:
        require_owned_project(db, note_in.project_id, current_user.id, role=target_role)
    note = models.Note(
        user_id=current_user.id,
        role=target_role,
        project_id=note_in.project_id,
        title=note_in.title,
        content=note_in.content,
        is_pinned=note_in.is_pinned or False,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.patch("/{note_id}", response_model=schemas.NoteOut)
def update_note(
    note_id: int,
    note_in: schemas.NoteUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == current_user.id,
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    update_data = note_in.dict(exclude_unset=True)
    target_role = update_data.get("role", note.role)
    if "project_id" in update_data and update_data["project_id"] is not None:
        require_owned_project(db, note_in.project_id, current_user.id, role=target_role)
    for field, val in update_data.items():
        setattr(note, field, val)

    db.commit()
    db.refresh(note)
    return note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == current_user.id,
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return None
