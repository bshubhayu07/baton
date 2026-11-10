import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import UserRole, SourceType, PermissionLevel
from app.models.project import Project
from app.models.source import SourceItem
from app.models.user import User
from app.schemas.source import SourceIngestRequest, SourceItemResponse
from app.services.auth import get_current_user, require_roles
from app.services.ingestion import ingest_source_document

router = APIRouter(prefix="/projects/{project_id}/sources", tags=["Sources"])

@router.get("", response_model=List[SourceItemResponse])
def list_project_sources(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sources = db.query(SourceItem).filter(SourceItem.project_id == project_id).all()
    return sources

@router.post("", response_model=SourceItemResponse)
def ingest_text_source(
    project_id: str,
    payload: SourceIngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD, UserRole.OUTGOING_EMPLOYEE))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    source = ingest_source_document(
        db=db,
        project_id=project_id,
        source_type=payload.type,
        name=payload.name,
        raw_text=payload.raw_text,
        permission_tag=payload.permission_tag,
        metadata=payload.metadata or {},
        user=current_user
    )
    return source

@router.post("/upload", response_model=SourceItemResponse)
async def upload_file_source(
    project_id: str,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    source_type: SourceType = Form(SourceType.MEETING_NOTES),
    permission_tag: PermissionLevel = Form(PermissionLevel.INTERNAL),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD, UserRole.OUTGOING_EMPLOYEE))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    content_bytes = await file.read()
    filename = file.filename or "uploaded_document"
    doc_name = name or filename

    # Basic text decoding with fallback
    try:
        raw_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raw_text = content_bytes.decode("latin-1", errors="replace")

    source = ingest_source_document(
        db=db,
        project_id=project_id,
        source_type=source_type,
        name=doc_name,
        raw_text=raw_text,
        permission_tag=permission_tag,
        metadata={"filename": filename, "size_bytes": len(content_bytes)},
        user=current_user
    )
    return source

@router.get("/{source_id}", response_model=SourceItemResponse)
def get_source_item(
    project_id: str,
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(SourceItem).filter(SourceItem.id == source_id, SourceItem.project_id == project_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source item not found")
    return source
