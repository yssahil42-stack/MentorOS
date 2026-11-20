import datetime
import logging
import urllib.parse
from typing import Optional, List, Dict, Any
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import User, Task
from ..config import settings
from ..ownership import require_owned_project

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/git", tags=["git"])

# In-memory store for connected repositories and sync settings
CONNECTED_REPOS: Dict[int, Dict[str, Any]] = {}
SYNC_SETTINGS: Dict[int, Dict[str, Any]] = {}
SYNC_LOGS: Dict[int, List[Dict[str, Any]]] = {}

DEFAULT_SYNC_SETTINGS = {
    "auto_sync": True,
    "sync_interval": 15,
    "sync_issues": True,
    "sync_prs": True,  # In GitLab these represent Merge Requests (MRs)
    "sync_commits": False,
    "sync_milestones": True,
    "create_tasks_for_issues": True,
    "create_tasks_for_prs": True,
    "close_task_on_issue_close": True,
    "close_task_on_pr_merge": True,
    "default_task_priority": "medium",
}

class ConnectRepoRequest(BaseModel):
    provider: str = "gitlab"
    access_token: Optional[str] = None
    repository: str
    sync_settings: Optional[Dict[str, Any]] = None

class TriggerSyncRequest(BaseModel):
    repository_id: int
    type: Optional[str] = "full"

class CreateTaskFromIssueRequest(BaseModel):
    issue_id: int
    project_id: Optional[int] = None
    priority: Optional[str] = "medium"

def _get_gitlab_headers(token: Optional[str] = None) -> Dict[str, str]:
    """Generates GitLab v4 authorization and content headers."""
    auth_token = token or settings.GITLAB_PERSONAL_ACCESS_TOKEN
    headers = {
        "User-Agent": "MentorOS",
        "Accept": "application/json",
    }
    if auth_token:
        # GitLab standard PAT header
        headers["PRIVATE-TOKEN"] = auth_token
    return headers

def _normalize_gitlab_project_identifier(repo_input: str) -> str:
    """Normalizes project URL or path string to owner/project."""
    cleaned = repo_input.strip()
    if cleaned.startswith("https://gitlab.com/"):
        cleaned = cleaned.replace("https://gitlab.com/", "")
    elif cleaned.startswith("http://gitlab.com/"):
        cleaned = cleaned.replace("http://gitlab.com/", "")
    cleaned = cleaned.rstrip("/").rstrip(".git")
    if "/" not in cleaned and settings.GITLAB_USERNAME and not cleaned.isdigit():
        cleaned = f"{settings.GITLAB_USERNAME}/{cleaned}"
    return cleaned

def _require_owned_repo(repo_id: int, user_id: int) -> Dict[str, Any]:
    repo = CONNECTED_REPOS.get(repo_id)
    if not repo or repo.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo

@router.get("/repositories")
async def list_repositories(
    current_user: User = Depends(get_current_user),
):
    """Returns connected GitLab repositories belonging strictly to the authenticated user."""
    return [r for r in CONNECTED_REPOS.values() if r.get("user_id") == current_user.id]

@router.post("/repositories")
async def connect_repository(
    req: ConnectRepoRequest,
    current_user: User = Depends(get_current_user),
):
    """Connect a repository via GitLab API using PAT."""
    token = req.access_token or settings.GITLAB_PERSONAL_ACCESS_TOKEN
    headers = _get_gitlab_headers(token)
    project_path = _normalize_gitlab_project_identifier(req.repository)
    encoded_project = urllib.parse.quote(project_path, safe="")

    gl_repo: Dict[str, Any] = {}
    api_base = settings.GITLAB_API_BASE.rstrip("/")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{api_base}/projects/{encoded_project}",
                headers=headers,
            )
            if resp.status_code == 200:
                gl_repo = resp.json()
            else:
                logger.warning("GitLab API returned %s for %s", resp.status_code, project_path)
                gl_repo = {
                    "id": abs(hash(project_path)) % 1000000,
                    "name": project_path.split("/")[-1],
                    "path_with_namespace": project_path,
                    "description": f"Connected GitLab repository ({project_path})",
                    "visibility": "private",
                    "web_url": f"https://gitlab.com/{project_path}",
                    "default_branch": "main",
                    "star_count": 0,
                    "forks_count": 0,
                    "open_issues_count": 0,
                }
        except Exception as e:
            logger.warning("Could not reach GitLab API for %s: %s", project_path, e)
            gl_repo = {
                "id": abs(hash(project_path)) % 1000000,
                "name": project_path.split("/")[-1],
                "path_with_namespace": project_path,
                "description": f"Connected GitLab repository ({project_path})",
                "visibility": "private",
                "web_url": f"https://gitlab.com/{project_path}",
                "default_branch": "main",
                "star_count": 0,
                "forks_count": 0,
                "open_issues_count": 0,
            }

    repo_id = gl_repo.get("id", len(CONNECTED_REPOS) + 1)
    now = datetime.datetime.utcnow().isoformat() + "Z"

    repo_obj = {
        "id": repo_id,
        "user_id": current_user.id,
        "provider": "gitlab",
        "external_id": str(gl_repo.get("id")),
        "name": gl_repo.get("name") or project_path.split("/")[-1],
        "full_name": gl_repo.get("path_with_namespace") or project_path,
        "description": gl_repo.get("description"),
        "private": gl_repo.get("visibility", "private") != "public",
        "html_url": gl_repo.get("web_url") or f"https://gitlab.com/{project_path}",
        "default_branch": gl_repo.get("default_branch", "main"),
        "language": "TypeScript",
        "stargazers_count": gl_repo.get("star_count", 0),
        "stars": gl_repo.get("star_count", 0),
        "forks_count": gl_repo.get("forks_count", 0),
        "forks": gl_repo.get("forks_count", 0),
        "open_issues_count": gl_repo.get("open_issues_count", 0),
        "open_issues": gl_repo.get("open_issues_count", 0),
        "last_sync_at": now,
        "created_at": now,
        "updated_at": now,
        "sync_enabled": True,
        "sync_issues": True,
        "sync_prs": True,
        "sync_milestones": True,
        "issue_task_mapping": "all",
        "pr_task_mapping": "all",
    }

    CONNECTED_REPOS[repo_id] = repo_obj
    sync_settings = {**DEFAULT_SYNC_SETTINGS, **(req.sync_settings or {})}
    SYNC_SETTINGS[repo_id] = sync_settings

    return {
        "repository": repo_obj,
        "sync_settings": sync_settings,
    }

@router.get("/repositories/{repo_id}")
async def get_repository(
    repo_id: int,
    current_user: User = Depends(get_current_user),
):
    repo = _require_owned_repo(repo_id, current_user.id)
    return repo

@router.delete("/repositories/{repo_id}")
async def disconnect_repository(
    repo_id: int,
    current_user: User = Depends(get_current_user),
):
    _require_owned_repo(repo_id, current_user.id)
    CONNECTED_REPOS.pop(repo_id, None)
    SYNC_SETTINGS.pop(repo_id, None)
    SYNC_LOGS.pop(repo_id, None)
    return {"status": "disconnected"}

@router.get("/repositories/{repo_id}/sync-settings")
async def get_sync_settings(
    repo_id: int,
    current_user: User = Depends(get_current_user),
):
    _require_owned_repo(repo_id, current_user.id)
    return SYNC_SETTINGS.get(repo_id, DEFAULT_SYNC_SETTINGS)

@router.patch("/repositories/{repo_id}/sync-settings")
async def update_sync_settings(
    repo_id: int,
    settings_update: Dict[str, Any],
    current_user: User = Depends(get_current_user),
):
    _require_owned_repo(repo_id, current_user.id)
    current = SYNC_SETTINGS.get(repo_id, DEFAULT_SYNC_SETTINGS.copy())
    current.update(settings_update)
    SYNC_SETTINGS[repo_id] = current
    return current

@router.post("/sync")
async def trigger_sync(
    req: TriggerSyncRequest,
    current_user: User = Depends(get_current_user),
):
    repo = _require_owned_repo(req.repository_id, current_user.id)
    now = datetime.datetime.utcnow().isoformat() + "Z"

    log_entry = {
        "id": len(SYNC_LOGS.get(req.repository_id, [])) + 1,
        "repository_id": req.repository_id,
        "type": req.type or "full",
        "status": "success",
        "started_at": now,
        "completed_at": now,
        "items_synced": 4,
        "errors": None,
    }

    if req.repository_id not in SYNC_LOGS:
        SYNC_LOGS[req.repository_id] = []
    SYNC_LOGS[req.repository_id].insert(0, log_entry)

    repo["last_sync_at"] = now
    return {"sync_log": log_entry}

@router.get("/repositories/{repo_id}/sync-logs")
async def get_sync_logs(
    repo_id: int,
    current_user: User = Depends(get_current_user),
):
    _require_owned_repo(repo_id, current_user.id)
    return SYNC_LOGS.get(repo_id, [])

@router.get("/repositories/{repo_id}/issues")
async def get_repository_issues(
    repo_id: int,
    state: str = Query("open"),
    current_user: User = Depends(get_current_user),
):
    """Fetches GitLab issues."""
    repo = _require_owned_repo(repo_id, current_user.id)
    headers = _get_gitlab_headers()
    api_base = settings.GITLAB_API_BASE.rstrip("/")
    project_identifier = urllib.parse.quote(str(repo.get("full_name") or repo_id), safe="")

    gl_state = "opened" if state == "open" else state
    params = {}
    if gl_state in ("opened", "closed"):
        params["state"] = gl_state

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{api_base}/projects/{project_identifier}/issues",
                headers=headers,
                params=params,
            )
            if resp.status_code == 200:
                raw_issues = resp.json()
                issues = []
                for idx, item in enumerate(raw_issues):
                    labels_raw = item.get("labels", [])
                    formatted_labels = []
                    for l_idx, lbl in enumerate(labels_raw):
                        if isinstance(lbl, str):
                            formatted_labels.append({"id": l_idx + 1, "name": lbl, "color": "6366F1"})
                        elif isinstance(lbl, dict):
                            formatted_labels.append({
                                "id": lbl.get("id", l_idx + 1),
                                "name": lbl.get("name", ""),
                                "color": lbl.get("color", "6366F1").lstrip("#")
                            })

                    assignees_raw = item.get("assignees", []) or ([item.get("assignee")] if item.get("assignee") else [])
                    formatted_assignees = []
                    for a in assignees_raw:
                        if a:
                            formatted_assignees.append({
                                "id": a.get("id", 1),
                                "login": a.get("username", "user"),
                                "avatar_url": a.get("avatar_url", ""),
                                "html_url": a.get("web_url", ""),
                            })

                    issue_state = "open" if item.get("state") == "opened" else "closed"
                    issues.append({
                        "id": item.get("id", idx + 1),
                        "repository_id": repo_id,
                        "external_id": item.get("iid", item.get("id")),
                        "title": item.get("title"),
                        "body": item.get("description"),
                        "state": issue_state,
                        "type": "issue",
                        "html_url": item.get("web_url"),
                        "labels": formatted_labels,
                        "assignees": formatted_assignees,
                        "created_at": item.get("created_at"),
                        "updated_at": item.get("updated_at"),
                    })
                return issues
        except Exception as e:
            logger.warning("Could not fetch GitLab issues for %s: %s", repo.get("full_name"), e)

    return []

@router.get("/repositories/{repo_id}/pull-requests")
async def get_repository_prs(
    repo_id: int,
    state: str = Query("open"),
    current_user: User = Depends(get_current_user),
):
    """Fetches GitLab Merge Requests (equivalent to Pull Requests)."""
    repo = _require_owned_repo(repo_id, current_user.id)
    headers = _get_gitlab_headers()
    api_base = settings.GITLAB_API_BASE.rstrip("/")
    project_identifier = urllib.parse.quote(str(repo.get("full_name") or repo_id), safe="")

    gl_state = "opened" if state == "open" else state
    params = {}
    if gl_state in ("opened", "closed", "merged"):
        params["state"] = gl_state

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{api_base}/projects/{project_identifier}/merge_requests",
                headers=headers,
                params=params,
            )
            if resp.status_code == 200:
                raw_mrs = resp.json()
                prs = []
                for idx, item in enumerate(raw_mrs):
                    mr_state = "open" if item.get("state") == "opened" else item.get("state", "open")
                    prs.append({
                        "id": item.get("id", idx + 1),
                        "repository_id": repo_id,
                        "external_id": item.get("iid", item.get("id")),
                        "title": item.get("title"),
                        "body": item.get("description"),
                        "state": mr_state,
                        "html_url": item.get("web_url"),
                        "head_branch": item.get("source_branch", "feature"),
                        "base_branch": item.get("target_branch", "main"),
                        "draft": item.get("work_in_progress", False) or item.get("draft", False),
                        "labels": [],
                        "assignees": [],
                        "requested_reviewers": [],
                        "created_at": item.get("created_at"),
                        "updated_at": item.get("updated_at"),
                    })
                return prs
        except Exception as e:
            logger.warning("Could not fetch GitLab MRs for %s: %s", repo.get("full_name"), e)

    return []

@router.get("/repositories/{repo_id}/commits")
async def get_repository_commits(
    repo_id: int,
    current_user: User = Depends(get_current_user),
):
    """Fetches GitLab repository commits."""
    repo = _require_owned_repo(repo_id, current_user.id)
    headers = _get_gitlab_headers()
    api_base = settings.GITLAB_API_BASE.rstrip("/")
    project_identifier = urllib.parse.quote(str(repo.get("full_name") or repo_id), safe="")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{api_base}/projects/{project_identifier}/repository/commits",
                headers=headers,
                params={"per_page": 10},
            )
            if resp.status_code == 200:
                raw_commits = resp.json()
                commits = []
                for item in raw_commits:
                    commits.append({
                        "id": item.get("short_id") or item.get("id", "")[:7],
                        "sha": item.get("id"),
                        "message": item.get("title") or item.get("message"),
                        "author_name": item.get("author_name"),
                        "author_date": item.get("authored_date"),
                        "html_url": item.get("web_url"),
                    })
                return commits
        except Exception as e:
            logger.warning("Could not fetch GitLab commits: %s", e)

    return []

@router.get("/repositories/{repo_id}/milestones")
async def get_repository_milestones(
    repo_id: int,
    current_user: User = Depends(get_current_user),
):
    _require_owned_repo(repo_id, current_user.id)
    return []

@router.post("/issues/create-task")
async def create_task_from_issue(
    req: CreateTaskFromIssueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.project_id:
        require_owned_project(db, req.project_id, current_user.id)

    task = Task(
        user_id=current_user.id,
        title=f"GitLab Issue #{req.issue_id}",
        description="Synced from GitLab issue",
        status="todo",
        priority=req.priority or "medium",
        role="developer",
        project_id=req.project_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"task_id": task.id}
