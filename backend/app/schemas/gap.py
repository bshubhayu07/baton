from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class GapQuestionResponse(BaseModel):
    id: str
    project_id: str
    claim_id: Optional[str] = None
    question: str
    category: str
    context: Optional[str] = None
    suggested_answers: List[str] = []
    answer_text: Optional[str] = None
    status: str
    answered_by_user_id: Optional[str] = None
    answered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GapAnswerRequest(BaseModel):
    answer_text: str
