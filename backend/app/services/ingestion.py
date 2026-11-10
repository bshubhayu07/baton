import json
import csv
import io
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.source import SourceItem, SourceChunk
from app.models.enums import SourceType, PermissionLevel
from app.services.llm_provider import get_llm_provider
from app.services.audit import record_audit_log
from app.models.user import User

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Splits raw text into semantic chunks with overlapping boundaries."""
    if not text:
        return []
    
    # Split by paragraphs or double newlines where possible
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_len = 0

    for para in paragraphs:
        para_clean = para.strip()
        if not para_clean:
            continue
        if current_len + len(para_clean) > chunk_size and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [para_clean]
            current_len = len(para_clean)
        else:
            current_chunk.append(para_clean)
            current_len += len(para_clean)

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks if chunks else [text]

def ingest_source_document(
    db: Session,
    project_id: str,
    source_type: SourceType,
    name: str,
    raw_text: str,
    permission_tag: PermissionLevel = PermissionLevel.INTERNAL,
    metadata: Optional[Dict[str, Any]] = None,
    user: Optional[User] = None
) -> SourceItem:
    """
    Normalizes, chunks, embeds, and stores a source document.
    """
    llm = get_llm_provider()

    source = SourceItem(
        project_id=project_id,
        type=source_type,
        name=name,
        raw_text=raw_text,
        metadata_json=metadata or {},
        permission_tag=permission_tag,
        created_by=user.id if user else None
    )
    db.add(source)
    db.commit()
    db.refresh(source)

    # Chunk and generate embeddings
    chunks = chunk_text(raw_text)
    for idx, chunk_content in enumerate(chunks):
        vec = llm.get_embedding(chunk_content)
        chunk_obj = SourceChunk(
            source_item_id=source.id,
            chunk_index=idx,
            content=chunk_content,
            embedding_vector=vec
        )
        db.add(chunk_obj)

    db.commit()

    if user:
        record_audit_log(
            db=db,
            action="INGEST_SOURCE",
            resource_type="source_item",
            resource_id=source.id,
            user=user,
            project_id=project_id,
            details={"name": name, "type": source_type.value, "permission": permission_tag.value}
        )

    return source
