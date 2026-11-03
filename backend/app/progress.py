from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from . import models


def recalculate_project_progress(db: Session, project_id: Optional[int], user_id: int) -> None:
    """
    Recalculates milestone statuses and project completion percentage dynamically
    whenever tasks are created, updated (completed vs todo), or removed.
    """
    if not project_id:
        return

    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == user_id,
    ).first()
    if not project:
        return

    tasks: List[models.Task] = (
        db.query(models.Task)
        .filter(
            models.Task.project_id == project_id,
            models.Task.user_id == user_id,
        )
        .order_by(models.Task.created_at.asc(), models.Task.id.asc())
        .all()
    )

    milestones: List[models.Milestone] = (
        db.query(models.Milestone)
        .filter(
            models.Milestone.project_id == project_id,
            models.Milestone.user_id == user_id,
        )
        .order_by(models.Milestone.created_at.asc(), models.Milestone.id.asc())
        .all()
    )

    # 1. Dynamically sync milestones status with tasks if both exist
    if tasks and milestones:
        num_milestones = len(milestones)
        num_tasks = len(tasks)

        for m_idx, ms in enumerate(milestones):
            phase_num = m_idx + 1
            ms_title_lower = (ms.title or "").lower()

            # Associate tasks matching phase keywords in title/description or by ordered segmentation
            explicit_tasks = [
                t for t in tasks
                if (f"phase {phase_num}" in (t.description or "").lower()
                    or f"phase {phase_num}" in (t.title or "").lower()
                    or (ms_title_lower and ms_title_lower in (t.title or "").lower()))
            ]

            if explicit_tasks:
                associated_tasks = explicit_tasks
            else:
                # Segment chunk: e.g. 6 tasks across 3 milestones -> [0:2], [2:4], [4:6]
                chunk_size = max(1, (num_tasks + num_milestones - 1) // num_milestones)
                start_i = m_idx * chunk_size
                end_i = min(start_i + chunk_size, num_tasks)
                associated_tasks = tasks[start_i:end_i] if start_i < num_tasks else []

            if associated_tasks:
                comp_assoc = sum(1 for t in associated_tasks if t.status == "completed")
                if comp_assoc == len(associated_tasks):
                    if ms.status != "completed":
                        ms.status = "completed"
                        ms.completed_at = datetime.utcnow()
                elif comp_assoc > 0:
                    ms.status = "in_progress"
                    ms.completed_at = None
                else:
                    if ms.status == "completed":
                        ms.status = "pending"
                        ms.completed_at = None

    # 2. Recalculate Project Progress (0 - 100%)
    if tasks:
        completed_tasks = sum(1 for t in tasks if t.status == "completed")
        calc_progress = int(round((completed_tasks / len(tasks)) * 100))
        project.progress = max(0, min(100, calc_progress))
    elif milestones:
        completed_ms = sum(1 for m in milestones if m.status == "completed")
        calc_progress = int(round((completed_ms / len(milestones)) * 100))
        project.progress = max(0, min(100, calc_progress))
    else:
        project.progress = 0

    # 3. Auto-update project lifecycle status
    if project.progress == 100:
        if project.status != "completed":
            project.status = "completed"
    elif project.progress < 100 and project.status == "completed":
        project.status = "active"

    db.commit()
