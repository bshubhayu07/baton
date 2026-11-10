from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class HandoverPacketResponse(BaseModel):
    project_id: str
    project_name: str
    generated_for_role: str
    generated_at: str
    is_redacted: bool
    decisions: List[Dict[str, Any]]
    dependencies: List[Dict[str, Any]]
    risks: List[Dict[str, Any]]
    unresolved_issues: List[Dict[str, Any]]
    ownership: List[Dict[str, Any]]
    acknowledgments: List[Dict[str, Any]]

class HandoverAcknowledgeRequest(BaseModel):
    notes: Optional[str] = "I acknowledge receipt and review of this verified handover packet."
