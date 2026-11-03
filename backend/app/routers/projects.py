from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..ownership import require_owned_project
from ..progress import recalculate_project_progress

router = APIRouter(tags=["projects"])

# ─── Projects ────────────────────────────────────────────────────────────────

@router.get("/projects", response_model=List[schemas.ProjectOut])
def get_projects(
    response: Response,
    role: Optional[str] = None,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Project).filter(models.Project.user_id == current_user.id)
    if role:
        query = query.filter(models.Project.role == role)
    
    total = query.count()
    response.headers["X-Total-Count"] = str(total)

    query = query.order_by(models.Project.created_at.desc())
    if page is not None and page_size is not None and page > 0 and page_size > 0:
        query = query.offset((page - 1) * page_size).limit(page_size)
    projects = query.all()

    result = []
    has_updates = False
    for p in projects:
        total_ms = len(p.milestones)
        completed_ms = sum(1 for m in p.milestones if m.status == "completed")
        total_tasks = len(p.tasks)
        out = schemas.ProjectOut.from_orm(p)
        out.milestone_count = total_ms
        out.completed_milestone_count = completed_ms
        out.task_count = total_tasks

        # Calculate dynamic real-time progress
        if total_tasks > 0:
            completed_tasks = sum(1 for t in p.tasks if t.status == "completed")
            calc_progress = int(round((completed_tasks / total_tasks) * 100))
        elif total_ms > 0:
            calc_progress = int(round((completed_ms / total_ms) * 100))
        else:
            calc_progress = p.progress or 0

        calc_progress = max(0, min(100, calc_progress))
        out.progress = calc_progress

        if p.progress != calc_progress:
            p.progress = calc_progress
            if calc_progress == 100 and p.status != "completed":
                p.status = "completed"
            elif calc_progress < 100 and p.status == "completed":
                p.status = "active"
            has_updates = True

        result.append(out)

    if has_updates:
        db.commit()

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

    # Dynamic progress calculation
    if tasks:
        completed_tasks_count = sum(t.status == "completed" for t in tasks)
        calc_progress = int(round((completed_tasks_count / len(tasks)) * 100))
    elif milestones:
        completed_ms_count = sum(m.status == "completed" for m in milestones)
        calc_progress = int(round((completed_ms_count / len(milestones)) * 100))
    else:
        calc_progress = project.progress or 0

    project_out.progress = max(0, min(100, calc_progress))
    if project.progress != project_out.progress:
        project.progress = project_out.progress
        db.commit()
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

    if ms.project_id:
        recalculate_project_progress(db, ms.project_id, current_user.id)

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
    elif ms_in.status and ms_in.status != "completed":
        ms.completed_at = None

    db.commit()
    db.refresh(ms)

    if ms.project_id:
        recalculate_project_progress(db, ms.project_id, current_user.id)

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

    project_id = ms.project_id
    db.delete(ms)
    db.commit()

    if project_id:
        recalculate_project_progress(db, project_id, current_user.id)

    return None


# ─── Public Client Portal (No auth required) ──────────────────────────────────

@router.get("/client-portal/{project_id}")
def get_public_client_portal(
    project_id: int,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if token and not (token == f"public-{project_id}" or token.startswith("public-")):
        raise HTTPException(status_code=403, detail="Invalid client portal share token")

    milestones = [
        schemas.MilestoneOut.from_orm(m)
        for m in (project.milestones or [])
    ]
    tasks = [
        schemas.TaskOut.from_orm(t)
        for t in (project.tasks or [])
    ]

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    progress = int(round((completed_tasks / total_tasks) * 100)) if total_tasks > 0 else project.progress

    project_out = schemas.ProjectOut.from_orm(project)
    project_out.progress = progress
    project_out.milestone_count = len(milestones)
    project_out.completed_milestone_count = sum(1 for m in milestones if m.status == "completed")
    project_out.task_count = total_tasks

    return {
        "project": project_out,
        "milestones": milestones,
        "tasks": tasks,
    }

