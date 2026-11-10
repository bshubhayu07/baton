import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    claim_id_1 = Column(String, ForeignKey("claims.id"), nullable=False)
    claim_id_2 = Column(String, ForeignKey("claims.id"), nullable=True)
    description = Column(Text, nullable=False)
    source_a_quote = Column(Text, nullable=True)
    source_b_quote = Column(Text, nullable=True)
    status = Column(String, default="UNRESOLVED")  # UNRESOLVED, RESOLVED
    resolved_by_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="conflicts")
