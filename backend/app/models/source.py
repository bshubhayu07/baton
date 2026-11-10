import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.database import Base, VectorType
from app.models.enums import SourceType, PermissionLevel

def generate_uuid() -> str:
    return str(uuid.uuid4())

class SourceItem(Base):
    __tablename__ = "source_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    type = Column(SQLEnum(SourceType), nullable=False)
    name = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)
    permission_tag = Column(SQLEnum(PermissionLevel), nullable=False, default=PermissionLevel.INTERNAL)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="sources")
    chunks = relationship("SourceChunk", back_populates="source_item", cascade="all, delete-orphan")
    claim_spans = relationship("ClaimSpan", back_populates="source_item", cascade="all, delete-orphan")

class SourceChunk(Base):
    __tablename__ = "source_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    source_item_id = Column(String, ForeignKey("source_items.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding_vector = Column(VectorType, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    source_item = relationship("SourceItem", back_populates="chunks")
