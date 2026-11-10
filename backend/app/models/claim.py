import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Boolean, Integer, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import ClaimCategory, ClaimState, ClaimStatus, PermissionLevel

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    category = Column(SQLEnum(ClaimCategory), nullable=False)
    title = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    state = Column(SQLEnum(ClaimState), nullable=False, default=ClaimState.INFERRED)
    permission_level = Column(SQLEnum(PermissionLevel), nullable=False, default=PermissionLevel.INTERNAL)
    status = Column(SQLEnum(ClaimStatus), nullable=False, default=ClaimStatus.DRAFT)
    confidence_score = Column(Float, default=0.85)
    created_by_role = Column(String, default="SYSTEM_LLM")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="claims")
    spans = relationship("ClaimSpan", back_populates="claim", cascade="all, delete-orphan")
    versions = relationship("ClaimVersion", back_populates="claim", cascade="all, delete-orphan")

class ClaimSpan(Base):
    __tablename__ = "claim_spans"

    id = Column(String, primary_key=True, default=generate_uuid)
    claim_id = Column(String, ForeignKey("claims.id"), nullable=False)
    source_item_id = Column(String, ForeignKey("source_items.id"), nullable=False)
    quote = Column(Text, nullable=False)
    start_offset = Column(Integer, nullable=False, default=0)
    end_offset = Column(Integer, nullable=False, default=0)
    verified = Column(Boolean, nullable=False, default=False)
    verification_failure_reason = Column(String, nullable=True)

    claim = relationship("Claim", back_populates="spans")
    source_item = relationship("SourceItem", back_populates="claim_spans")

class ClaimVersion(Base):
    __tablename__ = "claim_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    claim_id = Column(String, ForeignKey("claims.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    state = Column(SQLEnum(ClaimState), nullable=False)
    status = Column(SQLEnum(ClaimStatus), nullable=False)
    changed_by_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    change_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    claim = relationship("Claim", back_populates="versions")
