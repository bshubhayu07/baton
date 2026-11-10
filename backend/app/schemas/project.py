from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.enums import UserRole

class ProjectMemberResponse(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: str
    role: UserRole
    created_at: datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    org_id: str
    name: str
    description: Optional[str]
    status: str
    created_by: Optional[str]
    created_at: datetime
    member_count: Optional[int] = 0
    sources_count: Optional[int] = 0
    claims_count: Optional[int] = 0
    verified_claims_count: Optional[int] = 0
    open_gaps_count: Optional[int] = 0
    unresolved_conflicts_count: Optional[int] = 0

    class Config:
        from_attributes = True

class MemberAddRequest(BaseModel):
    email: str
    role: UserRole
