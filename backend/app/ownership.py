from fastapi import HTTPException
from sqlalchemy.orm import Session

from . import models


def require_owned_project(db: Session, project_id: int | None, user_id: int) -> None:
    if project_id is None:
        return
    owned_project = db.query(models.Project.id).filter(
        models.Project.id == project_id,
        models.Project.user_id == user_id,
    ).first()
    if owned_project is None:
        raise HTTPException(status_code=404, detail="Project not found")


def require_owned_task(db: Session, task_id: int | None, user_id: int) -> None:
    if task_id is None:
        return
    owned_task = db.query(models.Task.id).filter(
        models.Task.id == task_id,
        models.Task.user_id == user_id,
    ).first()
    if owned_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
