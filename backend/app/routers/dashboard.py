from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _in_next_week(value: Optional[str], today: date) -> bool:
    parsed = _date(value)
    return parsed is not None and today <= parsed <= today + timedelta(days=7)


@router.get("/summary")
def get_dashboard_summary(
    role: Optional[schemas.WorkspaceRole] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    active_role = role or current_user.role
    today = datetime.utcnow().date()

    tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.id,
        models.Task.role == active_role,
    ).order_by(models.Task.created_at.desc()).all()
    open_tasks = [task for task in tasks if task.status not in ("completed", "archived")]
    overdue_tasks = [
        task for task in open_tasks
        if (due := _date(task.due_date)) is not None and due < today
    ]

    projects = db.query(models.Project).filter(
        models.Project.user_id == current_user.id,
        models.Project.role == active_role,
    ).all()
    active_projects = [project for project in projects if project.status in ("active", "planning")]

    events = db.query(models.CalendarEvent).filter(
        models.CalendarEvent.user_id == current_user.id,
        models.CalendarEvent.role == active_role,
    ).all()
    upcoming_events = [
        event for event in events
        if (event_date := _date(event.start_at)) is not None and event_date >= today
    ]

    milestones = db.query(models.Milestone).filter(
        models.Milestone.user_id == current_user.id,
        models.Milestone.role == active_role,
    ).all()
    milestones_this_week = [
        milestone for milestone in milestones
        if milestone.status != "completed" and _in_next_week(milestone.target_date, today)
    ]

    task_deadlines = [
        (due, task.title)
        for task in open_tasks
        if (due := _date(task.due_date)) is not None and due >= today
    ]
    event_deadlines = [
        (event_date, event.title)
        for event in upcoming_events
        if (event_date := _date(event.start_at)) is not None
    ]
    deadlines = sorted(task_deadlines + event_deadlines, key=lambda item: item[0])
    next_deadline = deadlines[0] if deadlines else None
    next_interview = next(
        (
            event for event in sorted(upcoming_events, key=lambda item: item.start_at)
            if event.event_type == "interview"
        ),
        None,
    )
    next_exam = next(
        (
            event for event in sorted(upcoming_events, key=lambda item: item.start_at)
            if event.event_type == "exam"
        ),
        None,
    )
    current_milestone = next(
        (milestone for milestone in milestones if milestone.status == "in_progress"),
        None,
    )
    if current_milestone is None:
        dated_milestones = [
            milestone for milestone in milestones
            if _date(milestone.target_date) is not None
        ]
        current_milestone = min(
            dated_milestones,
            key=lambda milestone: _date(milestone.target_date) or date.max,
            default=None,
        )

    if active_role == "developer":
        role_summary = {
            "active_build_projects": len(active_projects),
            "open_implementation_tasks": len(open_tasks),
            "milestones_this_week": len(milestones_this_week),
            "current_milestone_title": current_milestone.title if current_milestone else None,
            "target_date": current_milestone.target_date if current_milestone else None,
        }
        suggestion_text = (
            f"You have {len(open_tasks)} open tasks across {len(active_projects)} active projects."
        )
        prompt_starter = "Break down my next development milestone into tasks"
        context_type = "milestone_breakdown"
    elif active_role == "student":
        recent_work = [
            task for task in tasks
            if task.updated_at and task.updated_at.date() >= today - timedelta(days=7)
        ]
        study_hours = round(
            sum(task.actual_minutes or 0 for task in recent_work) / 60,
            1,
        )
        role_summary = {
            "upcoming_exams": sum(event.event_type == "exam" for event in upcoming_events),
            "due_assignments": sum(
                task.status not in ("completed", "archived")
                and _in_next_week(task.due_date, today)
                for task in tasks
            ),
            "study_hours_this_week": study_hours,
            "active_academic_projects": len(active_projects),
            "next_deadline_title": next_deadline[1] if next_deadline else None,
            "next_deadline_date": next_deadline[0].isoformat() if next_deadline else None,
        }
        suggestion_text = (
            f"You have {role_summary['due_assignments']} assignments due this week."
        )
        prompt_starter = "Create a study plan for my upcoming assignments and exams"
        context_type = "exam_prep"
    elif active_role == "freelancer":
        profile = current_user.profile_data if isinstance(current_user.profile_data, dict) else {}
        available_hours = profile.get("work_hours_available", 0)
        if type(available_hours) is not int or not 0 <= available_hours <= 168:
            available_hours = 0
        role_summary = {
            "deliverables_due_this_week": sum(
                _in_next_week(task.due_date, today) for task in open_tasks
            ),
            "active_engagements": len(active_projects),
            "work_hours_available": available_hours,
            "next_delivery_title": next_deadline[1] if next_deadline else None,
            "next_delivery_date": next_deadline[0].isoformat() if next_deadline else None,
        }
        suggestion_text = (
            f"You have {role_summary['deliverables_due_this_week']} deliverables due this week."
        )
        prompt_starter = "Draft a client progress update for my active projects"
        context_type = "client_update"
    else:
        role_summary = {
            "applications_pending": 0,
            "interviews_upcoming": sum(
                event.event_type == "interview" for event in upcoming_events
            ),
            "portfolio_tasks_remaining": len(open_tasks),
            "next_interview_title": next_interview.title if next_interview else None,
            "next_interview_date": _date(next_interview.start_at).isoformat()
            if next_interview else None,
        }
        suggestion_text = (
            f"You have {role_summary['interviews_upcoming']} upcoming interviews."
        )
        prompt_starter = "Prepare for my next interview"
        context_type = "interview_prep"

    todays_tasks_out = []
    for task in open_tasks[:5]:
        item = schemas.TaskOut.from_orm(task)
        item.project_title = task.project.title if task.project else None
        todays_tasks_out.append(item)

    # ─── Daily Standup & Focus Brief Compilation ──────────────────────────
    yesterday = today - timedelta(days=1)
    completed_tasks = [t for t in tasks if t.status == "completed"]
    yesterday_completed = [
        t for t in completed_tasks
        if t.completed_at and t.completed_at.date() == yesterday
    ]
    recent_completed = yesterday_completed if yesterday_completed else completed_tasks[:4]

    today_events = [
        e for e in events
        if (ed := _date(e.start_at)) is not None and ed == today
    ]
    tasks_due_today = [
        t for t in open_tasks
        if (due := _date(t.due_date)) is not None and due == today
    ]

    uncompleted_ms = [m for m in milestones if m.status != "completed"]
    dated_ms = [m for m in uncompleted_ms if _date(m.target_date) is not None]
    dated_ms.sort(key=lambda m: _date(m.target_date) or date.max)

    next_ms_target = None
    if current_milestone and current_milestone.status != "completed":
        next_ms_target = current_milestone
    elif dated_ms:
        next_ms_target = dated_ms[0]
    elif uncompleted_ms:
        next_ms_target = uncompleted_ms[0]

    next_ms_payload = None
    if next_ms_target:
        days_rem = None
        if target_d := _date(next_ms_target.target_date):
            days_rem = (target_d - today).days
        next_ms_payload = {
            "id": next_ms_target.id,
            "title": next_ms_target.title,
            "project_id": next_ms_target.project_id,
            "project_title": next_ms_target.project.title if next_ms_target.project else None,
            "target_date": next_ms_target.target_date,
            "status": next_ms_target.status,
            "days_remaining": days_rem,
        }

    daily_standup = {
        "yesterday_completed": [
            {
                "id": t.id,
                "title": t.title,
                "project_title": t.project.title if t.project else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                "is_yesterday": t.completed_at.date() == yesterday if t.completed_at else False,
            }
            for t in recent_completed
        ],
        "today_scheduled": [
            {
                "id": e.id,
                "title": e.title,
                "start_at": e.start_at,
                "end_at": e.end_at,
                "event_type": e.event_type,
                "project_title": e.project.title if getattr(e, "project", None) else None,
            }
            for e in sorted(today_events, key=lambda ev: ev.start_at or "")[:5]
        ],
        "tasks_due_today": [
            {
                "id": t.id,
                "title": t.title,
                "project_title": t.project.title if t.project else None,
                "priority": t.priority,
            }
            for t in tasks_due_today[:5]
        ],
        "next_milestone": next_ms_payload,
        "date_today": today.isoformat(),
        "date_yesterday": yesterday.isoformat(),
    }

    return {
        "role": active_role,
        "active_projects": len(active_projects),
        "open_tasks": len(open_tasks),
        "overdue_tasks": len(overdue_tasks),
        "upcoming_events": len(upcoming_events),
        "todays_tasks": todays_tasks_out,
        "role_summary": role_summary,
        "daily_standup": daily_standup,
        "ai_suggestion": {
            "id": f"suggestion-{active_role}",
            "text": suggestion_text,
            "prompt_starter": prompt_starter,
            "context_type": context_type,
        },
        "recent_activity": [],
    }
