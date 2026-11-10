from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.enums import ClaimCategory, ClaimState, ClaimStatus, PermissionLevel

class ClaimSpanResponse(BaseModel):
    id: str
    claim_id: str
    source_item_id: str
    source_name: Optional[str] = None
    source_type: Optional[str] = None
    quote: str
    start_offset: int
    end_offset: int
    verified: bool
    verification_failure_reason: Optional[str] = None

    class Config:
        from_attributes = True

class ClaimResponse(BaseModel):
    id: str
    project_id: str
    category: ClaimCategory
    title: str
    text: str
    state: ClaimState
    permission_level: PermissionLevel
    status: ClaimStatus
    confidence_score: float
    created_by_role: str
    created_at: datetime
    updated_at: datetime
    spans: List[ClaimSpanResponse] = []

    class Config:
        from_attributes = True

class ClaimUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    status: Optional[ClaimStatus] = None
    state: Optional[ClaimState] = None
    reason: Optional[str] = None

class ClaimCreate(BaseModel):
    category: ClaimCategory
    title: str
    text: str
    quote: Optional[str] = None
    source_item_id: Optional[str] = None
    permission_level: Optional[PermissionLevel] = PermissionLevel.INTERNAL

class ConflictResponse(BaseModel):
    id: str
    project_id: str
    claim_id_1: str
    claim_id_2: Optional[str] = None
    description: str
    source_a_quote: Optional[str] = None
    source_b_quote: Optional[str] = None
    status: str
    resolved_by_user_id: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConflictResolveRequest(BaseModel):
    resolution_notes: str
    preferred_claim_id: Optional[str] = None
