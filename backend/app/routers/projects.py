from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..ownership import require_owned_project

router = APIRouter(tags=["projects"])

# ─── Projects ────────────────────────────────────────────────────────────────

@router.get("/projects", response_model=List[schemas.ProjectOut])
def get_projects(
    role: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Project).filter(models.Project.user_id == current_user.id)
    if role:
        query = query.filter(models.Project.role == role)
    projects = query.order_by(models.Project.created_at.desc()).all()

    result = []
    for p in projects:
        total_ms = len(p.milestones)
        completed_ms = sum(1 for m in p.milestones if m.status == "completed")
        total_tasks = len(p.tasks)
        out = schemas.ProjectOut.from_orm(p)
        out.milestone_count = total_ms
        out.completed_milestone_count = completed_ms
        out.task_count = total_tasks
        result.append(out)

    return result

@router.get("/projects/{project_id}", response_model=schemas.ProjectDetailOut)
def get_project(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = db.query(models.Milestone).filter(
        models.Milestone.project_id == project.id,
        models.Milestone.user_id == current_user.id,
    ).order_by(models.Milestone.created_at.asc()).all()
    tasks = db.query(models.Task).filter(
        models.Task.project_id == project.id,
        models.Task.user_id == current_user.id,
    ).order_by(models.Task.created_at.asc()).all()

    project_out = schemas.ProjectOut.from_orm(project)
    project_out.milestone_count = len(milestones)
    project_out.completed_milestone_count = sum(
        milestone.status == "completed" for milestone in milestones
    )
    project_out.task_count = len(tasks)
    task_outputs = [schemas.TaskOut.from_orm(task) for task in tasks]
    for task_output, task in zip(task_outputs, tasks):
        task_output.project_title = project.title

    return {
        **project_out.dict(),
        "milestones": milestones,
        "tasks": task_outputs,
    }

@router.post("/projects", response_model=schemas.ProjectOut)
def create_project(
    project_in: schemas.ProjectCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proj = models.Project(
        user_id=current_user.id,
        role=project_in.role or current_user.role,
        title=project_in.title,
        description=project_in.description,
        priority=project_in.priority or "medium",
        target_date=project_in.target_date,
        progress=0,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return schemas.ProjectOut.from_orm(proj)

@router.patch("/projects/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    project_in: schemas.ProjectUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proj = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id,
    ).first()

    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(proj, field, val)

    db.commit()
    db.refresh(proj)
    return schemas.ProjectOut.from_orm(proj)

@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proj = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id,
    ).first()

    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(proj)
    db.commit()
    return None

# ─── Milestones ─────────────────────────────────────────────────────────────

@router.get("/milestones", response_model=List[schemas.MilestoneOut])
def get_milestones(
    project_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Milestone).filter(models.Milestone.user_id == current_user.id)
    if project_id:
        query = query.filter(models.Milestone.project_id == project_id)
    return query.order_by(models.Milestone.created_at.asc()).all()

@router.post("/milestones", response_model=schemas.MilestoneOut)
def create_milestone(
    ms_in: schemas.MilestoneCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owned_project(db, ms_in.project_id, current_user.id)
    ms = models.Milestone(
        user_id=current_user.id,
        project_id=ms_in.project_id,
        role=ms_in.role or current_user.role,
        title=ms_in.title,
        description=ms_in.description,
        target_date=ms_in.target_date,
        status="pending",
    )
    db.add(ms)
    db.commit()
    db.refresh(ms)
    return ms

@router.patch("/milestones/{milestone_id}", response_model=schemas.MilestoneOut)
def update_milestone(
    milestone_id: int,
    ms_in: schemas.MilestoneUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ms = db.query(models.Milestone).filter(
        models.Milestone.id == milestone_id,
        models.Milestone.user_id == current_user.id,
    ).first()

    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")

    update_data = ms_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(ms, field, val)

    if ms_in.status == "completed":
        ms.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(ms)
    return ms

@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    milestone_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ms = db.query(models.Milestone).filter(
        models.Milestone.id == milestone_id,
        models.Milestone.user_id == current_user.id,
    ).first()

    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")

    db.delete(ms)
    db.commit()
    return None
