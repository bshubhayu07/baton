from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class CustodyEntryResponse(BaseModel):
    id: str
    project_id: str
    claim_id: Optional[str] = None
    action: str
    actor_user_id: str
    actor_role: str
    timestamp: str
    details_json: Dict[str, Any]
    prev_hash: str
    entry_hash: str
    created_at: datetime

    class Config:
        from_attributes = True

class CustodyVerifyResponse(BaseModel):
    valid: bool
    total_entries: int
    chain_head: Optional[str] = None
    message: str
    broken_index: Optional[int] = None
    reason: Optional[str] = None
