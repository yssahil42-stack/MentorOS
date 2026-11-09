from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from . import models


def require_owned_project(
    db: Session,
    project_id: Optional[int],
    user_id: int,
    role: Optional[str] = None,
) -> Optional[models.Project]:
    if project_id is None:
        return None
    owned_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == user_id,
    ).first()
    if owned_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if role and owned_project.role and owned_project.role != role:
        raise HTTPException(
            status_code=400,
            detail=f"Project role mismatch: project is '{owned_project.role}', but expected '{role}'",
        )
    return owned_project


def require_owned_task(
    db: Session,
    task_id: Optional[int],
    user_id: int,
    role: Optional[str] = None,
) -> Optional[models.Task]:
    if task_id is None:
        return None
    owned_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == user_id,
    ).first()
    if owned_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if role and owned_task.role and owned_task.role != role:
        raise HTTPException(
            status_code=400,
            detail=f"Task role mismatch: task is '{owned_task.role}', but expected '{role}'",
        )
    return owned_task
