import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class GapQuestion(Base):
    __tablename__ = "gap_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    claim_id = Column(String, ForeignKey("claims.id"), nullable=True)
    question = Column(Text, nullable=False)
    category = Column(String, nullable=False, default="GENERAL")
    context = Column(Text, nullable=True)
    suggested_answers = Column(JSON, default=list)
    answer_text = Column(Text, nullable=True)
    status = Column(String, default="OPEN")  # OPEN, ANSWERED, CONVERTED_TO_CLAIM
    answered_by_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    answered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="gap_questions")
