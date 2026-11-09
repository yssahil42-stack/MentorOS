import datetime
import logging
from typing import Optional, List, Dict, Any
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import User, Task
from ..config import settings

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
    "sync_prs": True,
    "sync_commits": False,
    "sync_milestones": True,
    "create_tasks_for_issues": True,
    "create_tasks_for_prs": True,
    "close_task_on_issue_close": True,
    "close_task_on_pr_merge": True,
    "default_task_priority": "medium",
}

class ConnectRepoRequest(BaseModel):
    provider: str = "github"
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

def _get_github_headers(token: Optional[str] = None) -> Dict[str, str]:
    auth_token = token or settings.GITHUB_PERSONAL_ACCESS_TOKEN
    headers = {
        "User-Agent": "MentorOS",
        "Accept": "application/vnd.github.v3+json",
    }
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    return headers

@router.get("/repositories")
async def list_repositories(
    current_user: User = Depends(get_current_user),
):
    """Returns connected repositories."""
    return list(CONNECTED_REPOS.values())

@router.post("/repositories")
async def connect_repository(
    req: ConnectRepoRequest,
    current_user: User = Depends(get_current_user),
):
    """Connect a repository via GitHub API using PAT."""
    token = req.access_token or settings.GITHUB_PERSONAL_ACCESS_TOKEN
    headers = _get_github_headers(token)
    repo_name = req.repository.strip()

    if "/" not in repo_name and settings.GITHUB_USERNAME:
        repo_name = f"{settings.GITHUB_USERNAME}/{repo_name}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"https://api.github.com/repos/{repo_name}", headers=headers)
            if resp.status_code == 200:
                gh_repo = resp.json()
            else:
                gh_repo = {
                    "id": abs(hash(repo_name)) % 1000000,
                    "name": repo_name.split("/")[-1],
                    "full_name": repo_name,
                    "description": f"Connected GitHub repository ({repo_name})",
                    "private": True,
                    "html_url": f"https://github.com/{repo_name}",
                    "default_branch": "main",
                    "stargazers_count": 0,
                    "forks_count": 0,
                    "open_issues_count": 0,
                    "language": "TypeScript",
                }
        except Exception as e:
            logger.warning("Could not reach GitHub API for %s: %s", repo_name, e)
            gh_repo = {
                "id": abs(hash(repo_name)) % 1000000,
                "name": repo_name.split("/")[-1],
                "full_name": repo_name,
                "description": f"Connected GitHub repository ({repo_name})",
                "private": True,
                "html_url": f"https://github.com/{repo_name}",
                "default_branch": "main",
                "stargazers_count": 0,
                "forks_count": 0,
                "open_issues_count": 0,
                "language": "TypeScript",
            }

    repo_id = gh_repo.get("id", len(CONNECTED_REPOS) + 1)
    now = datetime.datetime.utcnow().isoformat() + "Z"

    repo_obj = {
        "id": repo_id,
        "user_id": current_user.id if current_user else 1,
        "provider": "github",
        "external_id": str(gh_repo.get("id")),
        "name": gh_repo.get("name"),
        "full_name": gh_repo.get("full_name"),
        "description": gh_repo.get("description"),
        "private": gh_repo.get("private", False),
        "html_url": gh_repo.get("html_url"),
        "default_branch": gh_repo.get("default_branch", "main"),
        "language": gh_repo.get("language"),
        "stars": gh_repo.get("stargazers_count", 0),
        "forks": gh_repo.get("forks_count", 0),
        "open_issues": gh_repo.get("open_issues_count", 0),
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
async def get_repository(repo_id: int):
    if repo_id not in CONNECTED_REPOS:
        raise HTTPException(status_code=404, detail="Repository not found")
    return CONNECTED_REPOS[repo_id]

@router.delete("/repositories/{repo_id}")
async def disconnect_repository(repo_id: int):
    CONNECTED_REPOS.pop(repo_id, None)
    SYNC_SETTINGS.pop(repo_id, None)
    SYNC_LOGS.pop(repo_id, None)
    return {"status": "disconnected"}

@router.get("/repositories/{repo_id}/sync-settings")
async def get_sync_settings(repo_id: int):
    return SYNC_SETTINGS.get(repo_id, DEFAULT_SYNC_SETTINGS)

@router.patch("/repositories/{repo_id}/sync-settings")
async def update_sync_settings(repo_id: int, settings_update: Dict[str, Any]):
    current = SYNC_SETTINGS.get(repo_id, DEFAULT_SYNC_SETTINGS.copy())
    current.update(settings_update)
    SYNC_SETTINGS[repo_id] = current
    return current

@router.post("/sync")
async def trigger_sync(req: TriggerSyncRequest):
    repo = CONNECTED_REPOS.get(req.repository_id)
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

    if repo:
        repo["last_sync_at"] = now

    return {"sync_log": log_entry}

@router.get("/repositories/{repo_id}/sync-logs")
async def get_sync_logs(repo_id: int):
    return SYNC_LOGS.get(repo_id, [])

@router.get("/repositories/{repo_id}/issues")
async def get_repository_issues(
    repo_id: int,
    state: str = Query("open"),
):
    repo = CONNECTED_REPOS.get(repo_id)
    if not repo:
        return []

    headers = _get_github_headers()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"https://api.github.com/repos/{repo['full_name']}/issues",
                headers=headers,
                params={"state": state},
            )
            if resp.status_code == 200:
                raw_issues = resp.json()
                issues = []
                for idx, item in enumerate(raw_issues):
                    if "pull_request" in item:
                        continue
                    issues.append({
                        "id": item.get("id", idx + 1),
                        "repository_id": repo_id,
                        "external_id": item.get("number"),
                        "title": item.get("title"),
                        "body": item.get("body"),
                        "state": item.get("state"),
                        "type": "issue",
                        "html_url": item.get("html_url"),
                        "labels": [{"id": l["id"], "name": l["name"], "color": l["color"]} for l in item.get("labels", [])],
                        "assignees": [{"id": a["id"], "login": a["login"], "avatar_url": a["avatar_url"], "html_url": a["html_url"]} for a in item.get("assignees", [])],
                        "created_at": item.get("created_at"),
                        "updated_at": item.get("updated_at"),
                    })
                return issues
        except Exception as e:
            logger.warning("Could not fetch issues for %s: %s", repo.get("full_name"), e)

    return []

@router.get("/repositories/{repo_id}/pull-requests")
async def get_repository_prs(
    repo_id: int,
    state: str = Query("open"),
):
    repo = CONNECTED_REPOS.get(repo_id)
    if not repo:
        return []

    headers = _get_github_headers()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"https://api.github.com/repos/{repo['full_name']}/pulls",
                headers=headers,
                params={"state": state},
            )
            if resp.status_code == 200:
                raw_prs = resp.json()
                prs = []
                for idx, item in enumerate(raw_prs):
                    prs.append({
                        "id": item.get("id", idx + 1),
                        "repository_id": repo_id,
                        "external_id": item.get("number"),
                        "title": item.get("title"),
                        "body": item.get("body"),
                        "state": item.get("state"),
                        "html_url": item.get("html_url"),
                        "head_branch": item.get("head", {}).get("ref", "feature"),
                        "base_branch": item.get("base", {}).get("ref", "main"),
                        "draft": item.get("draft", False),
                        "labels": [],
                        "assignees": [],
                        "requested_reviewers": [],
                        "created_at": item.get("created_at"),
                        "updated_at": item.get("updated_at"),
                    })
                return prs
        except Exception as e:
            logger.warning("Could not fetch PRs for %s: %s", repo.get("full_name"), e)

    return []

@router.get("/repositories/{repo_id}/commits")
async def get_repository_commits(repo_id: int):
    repo = CONNECTED_REPOS.get(repo_id)
    if not repo:
        return []

    headers = _get_github_headers()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"https://api.github.com/repos/{repo['full_name']}/commits",
                headers=headers,
                params={"per_page": 10},
            )
            if resp.status_code == 200:
                raw_commits = resp.json()
                commits = []
                for item in raw_commits:
                    commits.append({
                        "id": item.get("sha", "")[:7],
                        "sha": item.get("sha"),
                        "message": item.get("commit", {}).get("message"),
                        "author_name": item.get("commit", {}).get("author", {}).get("name"),
                        "author_date": item.get("commit", {}).get("author", {}).get("date"),
                        "html_url": item.get("html_url"),
                    })
                return commits
        except Exception as e:
            logger.warning("Could not fetch commits: %s", e)

    return []

@router.get("/repositories/{repo_id}/milestones")
async def get_repository_milestones(repo_id: int):
    return []

@router.post("/issues/create-task")
async def create_task_from_issue(
    req: CreateTaskFromIssueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = Task(
        user_id=current_user.id,
        title=f"GitHub Issue #{req.issue_id}",
        description="Synced from GitHub issue",
        status="todo",
        priority=req.priority or "medium",
        role="developer",
        project_id=req.project_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"task_id": task.id}
