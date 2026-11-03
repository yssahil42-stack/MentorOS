from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..ownership import require_owned_project

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[schemas.TaskOut])
def get_tasks(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    role: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Task).filter(models.Task.user_id == current_user.id)
    if role:
        query = query.filter(models.Task.role == role)
    if status:
        query = query.filter(models.Task.status == status)
    if project_id:
        query = query.filter(models.Task.project_id == project_id)

    tasks = query.order_by(models.Task.created_at.desc()).all()

    # Populate project_title
    res = []
    for t in tasks:
        p_title = t.project.title if t.project else None
        data = schemas.TaskOut.from_orm(t)
        data.project_title = p_title
        res.append(data)
    return res

@router.post("", response_model=schemas.TaskOut)
def create_task(
    task_in: schemas.TaskCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owned_project(db, task_in.project_id, current_user.id)
    task = models.Task(
        user_id=current_user.id,
        role=task_in.role or current_user.role,
        project_id=task_in.project_id,
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority or "medium",
        due_date=task_in.due_date,
        estimated_minutes=task_in.estimated_minutes or 60,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    out = schemas.TaskOut.from_orm(task)
    out.project_title = task.project.title if task.project else None
    return out

@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_in.dict(exclude_unset=True)
    if "project_id" in update_data:
        require_owned_project(db, task_in.project_id, current_user.id)
    for field, val in update_data.items():
        setattr(task, field, val)

    if task_in.status == "completed":
        task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(task)

    out = schemas.TaskOut.from_orm(task)
    out.project_title = task.project.title if task.project else None
    return out

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None
