import json
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ValidationInfo, field_validator

WorkspaceRole = Literal["student", "freelancer", "developer", "job_seeker"]
TaskPriority = Literal["low", "medium", "high", "urgent"]


class InputModel(BaseModel):
    @field_validator("*", mode="before")
    @classmethod
    def trim_input_strings(cls, value: Any, info: ValidationInfo) -> Any:
        if isinstance(value, str) and info.field_name not in {"password", "content"}:
            return value.strip()
        return value

    @field_validator("*")
    @classmethod
    def validate_iso_dates(cls, value: Any, info: ValidationInfo) -> Any:
        if isinstance(value, str) and info.field_name.endswith(("_date", "_at")):
            try:
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError as exc:
                raise ValueError("Date fields must use ISO 8601 format.") from exc
        return value

# ─── Auth / User ─────────────────────────────────────────────────────────────

class UserRegister(InputModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=72)
    full_name: str = Field(min_length=1, max_length=255)
    role: WorkspaceRole = "developer"
    profile_data: Optional[Dict[str, Any]] = Field(default=None, max_length=100)

    @field_validator("full_name")
    @classmethod
    def full_name_is_not_blank(cls, full_name: str) -> str:
        if not full_name:
            raise ValueError("Full name must not be blank.")
        return full_name

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, email: Any) -> Any:
        return email.strip().lower() if isinstance(email, str) else email

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes.")
        return password

    @field_validator("profile_data")
    @classmethod
    def profile_data_is_bounded(cls, profile_data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if profile_data is not None and len(json.dumps(profile_data)) > 20_000:
            raise ValueError("Profile data is too large.")
        return profile_data

class UserLogin(InputModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, email: Any) -> Any:
        return email.strip().lower() if isinstance(email, str) else email

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes.")
        return password

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    onboarding_completed: bool = False
    onboarding_complete: bool = False
    profile_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class OnboardingUpdate(InputModel):
    profile_data: Optional[Dict[str, Any]] = Field(default=None, max_length=100)
    onboarding_data: Optional[Dict[str, Any]] = Field(default=None, max_length=100)

    @field_validator("profile_data", "onboarding_data")
    @classmethod
    def onboarding_data_is_bounded(cls, data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if data is not None and len(json.dumps(data)) > 20_000:
            raise ValueError("Onboarding data is too large.")
        return data

# ─── Tasks ───────────────────────────────────────────────────────────────────

class TaskCreate(InputModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    project_id: Optional[int] = Field(default=None, ge=1)
    priority: TaskPriority = "medium"
    due_date: Optional[str] = Field(default=None, max_length=50)
    estimated_minutes: Optional[int] = Field(default=60, ge=0, le=1440)
    role: Optional[WorkspaceRole] = None

class TaskUpdate(InputModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    status: Optional[Literal["todo", "in_progress", "completed", "archived"]] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[str] = Field(default=None, max_length=50)
    estimated_minutes: Optional[int] = Field(default=None, ge=0, le=1440)
    actual_minutes: Optional[int] = Field(default=None, ge=0, le=100_000)
    project_id: Optional[int] = Field(default=None, ge=1)

class TaskOut(BaseModel):
    id: int
    user_id: int
    role: str
    project_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    project_title: Optional[str] = None

    class Config:
        from_attributes = True

# ─── Projects & Milestones ───────────────────────────────────────────────────

class MilestoneCreate(InputModel):
    project_id: Optional[int] = Field(default=None, ge=1)
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    target_date: Optional[str] = Field(default=None, max_length=50)
    role: Optional[WorkspaceRole] = None

class MilestoneUpdate(InputModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    status: Optional[Literal["pending", "in_progress", "completed"]] = None
    target_date: Optional[str] = Field(default=None, max_length=50)

class MilestoneOut(BaseModel):
    id: int
    project_id: Optional[int] = None
    user_id: int
    role: str
    title: str
    description: Optional[str] = None
    status: str
    target_date: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectCreate(InputModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    priority: TaskPriority = "medium"
    target_date: Optional[str] = Field(default=None, max_length=50)
    role: Optional[WorkspaceRole] = None

class ProjectUpdate(InputModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    status: Optional[Literal["planning", "active", "completed", "on_hold"]] = None
    priority: Optional[TaskPriority] = None
    target_date: Optional[str] = Field(default=None, max_length=50)
    progress: Optional[int] = Field(default=None, ge=0, le=100)

class ProjectOut(BaseModel):
    id: int
    user_id: int
    role: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    target_date: Optional[str] = None
    progress: int
    milestone_count: Optional[int] = 0
    completed_milestone_count: Optional[int] = 0
    task_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectDetailOut(ProjectOut):
    milestones: List[MilestoneOut]
    tasks: List[TaskOut]

# ─── Calendar Events ─────────────────────────────────────────────────────────

class CalendarEventCreate(InputModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    start_at: str = Field(min_length=1, max_length=50)
    end_at: str = Field(min_length=1, max_length=50)
    all_day: Optional[bool] = False
    event_type: Optional[str] = Field(default="build_block", max_length=50)
    task_id: Optional[int] = Field(default=None, ge=1)
    project_id: Optional[int] = Field(default=None, ge=1)
    role: Optional[WorkspaceRole] = None

class CalendarEventUpdate(InputModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    start_at: Optional[str] = Field(default=None, min_length=1, max_length=50)
    end_at: Optional[str] = Field(default=None, min_length=1, max_length=50)
    all_day: Optional[bool] = None
    event_type: Optional[str] = Field(default=None, max_length=50)

class CalendarEventOut(BaseModel):
    id: int
    user_id: int
    role: str
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    start_at: str
    end_at: str
    all_day: bool
    event_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ─── Notes ───────────────────────────────────────────────────────────────────

class NoteCreate(InputModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1, max_length=50_000)
    project_id: Optional[int] = Field(default=None, ge=1)
    is_pinned: Optional[bool] = False
    role: Optional[WorkspaceRole] = None

class NoteUpdate(InputModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    content: Optional[str] = Field(default=None, min_length=1, max_length=50_000)
    is_pinned: Optional[bool] = None

class NoteOut(BaseModel):
    id: int
    user_id: int
    role: str
    project_id: Optional[int] = None
    title: str
    content: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ─── AI Proposals ────────────────────────────────────────────────────────────

class AIProposalRequest(InputModel):
    request_text: str = Field(min_length=1, max_length=4000)
    context_type: Optional[str] = Field(default=None, max_length=50)
    role: Optional[WorkspaceRole] = "developer"

    @field_validator("request_text")
    @classmethod
    def request_text_is_not_blank(cls, request_text: str) -> str:
        normalized = request_text.strip()
        if not normalized:
            raise ValueError("Request text must not be blank.")
        return normalized

class AIProposalItemOut(BaseModel):
    id: int
    proposal_id: int
    item_type: str
    payload: Dict[str, Any]
    approved: bool
    persisted_record_id: Optional[int] = None

    class Config:
        from_attributes = True

class AIProposalOut(BaseModel):
    id: int
    user_id: int
    role: str
    request_text: str
    summary: str
    status: str
    items: List[AIProposalItemOut]
    created_at: datetime

    class Config:
        from_attributes = True

class AIProposalItemOverride(InputModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)

class AIApproveRequest(InputModel):
    approved_item_ids: List[int] = Field(min_length=1, max_length=500)
    item_overrides: Optional[Dict[int, AIProposalItemOverride]] = Field(default=None, max_length=500)

    @field_validator("approved_item_ids")
    @classmethod
    def approved_ids_are_unique_and_positive(cls, ids: List[int]) -> List[int]:
        if any(item_id < 1 for item_id in ids) or len(ids) != len(set(ids)):
            raise ValueError("Approved item IDs must be unique positive integers.")
        return ids

class AIApprovalResult(BaseModel):
    created_tasks: List[TaskOut]
    created_projects: List[ProjectOut]
    created_milestones: List[MilestoneOut]
    created_events: List[CalendarEventOut]
    created_notes: List[NoteOut]
