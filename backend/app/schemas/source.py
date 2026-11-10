from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.models.enums import SourceType, PermissionLevel

class SourceIngestRequest(BaseModel):
    name: str
    type: SourceType
    raw_text: str
    permission_tag: PermissionLevel = PermissionLevel.INTERNAL
    metadata: Optional[Dict[str, Any]] = None

class SourceItemResponse(BaseModel):
    id: str
    project_id: str
    type: SourceType
    name: str
    raw_text: str
    permission_tag: PermissionLevel
    metadata_json: Dict[str, Any]
    created_at: datetime
    created_by: Optional[str]

    class Config:
        from_attributes = True
