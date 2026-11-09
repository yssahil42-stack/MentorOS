from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..ownership import require_owned_project, require_owned_task

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/events", response_model=List[schemas.CalendarEventOut])
def get_events(
    start: Optional[str] = None,
    end: Optional[str] = None,
    role: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.CalendarEvent).filter(models.CalendarEvent.user_id == current_user.id)
    if role:
        query = query.filter(models.CalendarEvent.role == role)
    return query.order_by(models.CalendarEvent.start_at.asc()).all()

@router.post("/events", response_model=schemas.CalendarEventOut)
def create_event(
    event_in: schemas.CalendarEventCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_role = event_in.role or current_user.role
    if event_in.project_id:
        require_owned_project(db, event_in.project_id, current_user.id, role=target_role)
    if event_in.task_id:
        require_owned_task(db, event_in.task_id, current_user.id, role=target_role)
    ev = models.CalendarEvent(
        user_id=current_user.id,
        role=target_role,
        title=event_in.title,
        description=event_in.description,
        start_at=event_in.start_at,
        end_at=event_in.end_at,
        all_day=event_in.all_day or False,
        event_type=event_in.event_type or "build_block",
        project_id=event_in.project_id,
        task_id=event_in.task_id,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev

@router.patch("/events/{event_id}", response_model=schemas.CalendarEventOut)
def update_event(
    event_id: int,
    event_in: schemas.CalendarEventUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ev = db.query(models.CalendarEvent).filter(
        models.CalendarEvent.id == event_id,
        models.CalendarEvent.user_id == current_user.id,
    ).first()

    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = event_in.dict(exclude_unset=True)
    target_role = update_data.get("role", ev.role)
    if "project_id" in update_data and update_data["project_id"] is not None:
        require_owned_project(db, event_in.project_id, current_user.id, role=target_role)
    if "task_id" in update_data and update_data["task_id"] is not None:
        require_owned_task(db, event_in.task_id, current_user.id, role=target_role)
    for field, val in update_data.items():
        setattr(ev, field, val)

    db.commit()
    db.refresh(ev)
    return ev

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ev = db.query(models.CalendarEvent).filter(
        models.CalendarEvent.id == event_id,
        models.CalendarEvent.user_id == current_user.id,
    ).first()

    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(ev)
    db.commit()
    return None
