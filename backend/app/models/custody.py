import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class CustodyLedger(Base):
    __tablename__ = "custody_ledger"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    claim_id = Column(String, ForeignKey("claims.id"), nullable=True)
    action = Column(String, nullable=False)
    actor_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    actor_role = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)  # ISO string for reproducible hashing
    details_json = Column(JSON, default=dict)
    prev_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="custody_entries")
