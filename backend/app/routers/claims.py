from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import UserRole, ClaimState, ClaimStatus, ClaimCategory, PermissionLevel
from app.models.claim import Claim, ClaimSpan, ClaimVersion
from app.models.source import SourceItem
from app.models.user import User
from app.schemas.claim import ClaimResponse, ClaimSpanResponse, ClaimUpdate, ClaimCreate
from app.services.auth import get_current_user, require_roles
from app.services.extraction import run_project_reconstruction
from app.services.span_verifier import verify_quote_in_source
from app.services.custody_ledger import append_custody_entry
from app.services.redaction import filter_and_redact_claims_for_role, is_role_permitted
from app.services.audit import record_audit_log

router = APIRouter(tags=["Claims"])

@router.get("/projects/{project_id}/claims", response_model=List[ClaimResponse])
def list_project_claims(
    project_id: str,
    category: Optional[ClaimCategory] = None,
    state: Optional[ClaimState] = None,
    status: Optional[ClaimStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Claim).filter(Claim.project_id == project_id)
    if category is not None and not hasattr(category, "default"):
        query = query.filter(Claim.category == category)
    if state is not None and not hasattr(state, "default"):
        query = query.filter(Claim.state == state)
    if status is not None and not hasattr(status, "default"):
        query = query.filter(Claim.status == status)

    claims = query.order_by(Claim.created_at.asc()).all()

    # Apply role-based filtering: hide claims above user's permission boundary
    visible_claims = [c for c in claims if is_role_permitted(current_user.role, c.permission_level)]

    results = []
    for c in visible_claims:
        spans_res = []
        for s in c.spans:
            src = db.query(SourceItem).filter(SourceItem.id == s.source_item_id).first()
            spans_res.append({
                "id": s.id,
                "claim_id": s.claim_id,
                "source_item_id": s.source_item_id,
                "source_name": src.name if src else "Unknown Source",
                "source_type": src.type.value if src and hasattr(src.type, "value") else (str(src.type) if src else "unknown"),
                "quote": s.quote,
                "start_offset": s.start_offset,
                "end_offset": s.end_offset,
                "verified": s.verified,
                "verification_failure_reason": s.verification_failure_reason
            })

        results.append({
            "id": c.id,
            "project_id": c.project_id,
            "category": c.category,
            "title": c.title,
            "text": c.text,
            "state": c.state,
            "permission_level": c.permission_level,
            "status": c.status,
            "confidence_score": c.confidence_score,
            "created_by_role": c.created_by_role,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "spans": spans_res
        })
    return results

@router.post("/projects/{project_id}/claims/reconstruct")
def trigger_ai_reconstruction(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD, UserRole.OUTGOING_EMPLOYEE))
):
    result = run_project_reconstruction(db=db, project_id=project_id, user=current_user)
    return {
        "status": "success",
        "message": f"Extracted {result['claims_created']} claims, {result['conflicts_created']} conflicts, {result['gap_questions_created']} gap questions with verbatim span verification.",
        "data": result
    }

@router.get("/claims/{claim_id}", response_model=ClaimResponse)
def get_claim_detail(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Claim).filter(Claim.id == claim_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Claim not found")

    if not is_role_permitted(current_user.role, c.permission_level):
        raise HTTPException(status_code=403, detail="Access denied. Item permission exceeds role clearance level.")

    spans_res = []
    for s in c.spans:
        src = db.query(SourceItem).filter(SourceItem.id == s.source_item_id).first()
        spans_res.append({
            "id": s.id,
            "claim_id": s.claim_id,
            "source_item_id": s.source_item_id,
            "source_name": src.name if src else "Unknown",
            "source_type": src.type.value if src and hasattr(src.type, "value") else (str(src.type) if src else "unknown"),
            "quote": s.quote,
            "start_offset": s.start_offset,
            "end_offset": s.end_offset,
            "verified": s.verified,
            "verification_failure_reason": s.verification_failure_reason
        })

    return {
        "id": c.id,
        "project_id": c.project_id,
        "category": c.category,
        "title": c.title,
        "text": c.text,
        "state": c.state,
        "permission_level": c.permission_level,
        "status": c.status,
        "confidence_score": c.confidence_score,
        "created_by_role": c.created_by_role,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "spans": spans_res
    }

@router.put("/claims/{claim_id}", response_model=ClaimResponse)
def update_claim(
    claim_id: str,
    payload: ClaimUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD, UserRole.OUTGOING_EMPLOYEE))
):
    c = db.query(Claim).filter(Claim.id == claim_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_title = c.title
    old_text = c.text

    if payload.title is not None:
        c.title = payload.title
    if payload.text is not None:
        c.text = payload.text
    if payload.status is not None:
        c.status = payload.status
    if payload.state is not None:
        c.state = payload.state

    # Increment version
    version_count = db.query(ClaimVersion).filter(ClaimVersion.claim_id == c.id).count()
    new_v = ClaimVersion(
        claim_id=c.id,
        version_number=version_count + 1,
        title=c.title,
        text=c.text,
        state=c.state,
        status=c.status,
        changed_by_user_id=current_user.id,
        change_reason=payload.reason or "Manual edit"
    )
    db.add(new_v)
    db.commit()
    db.refresh(c)

    # Append to Custody Ledger
    append_custody_entry(
        db=db,
        project_id=c.project_id,
        claim_id=c.id,
        action="EDITED",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        details={
            "version": version_count + 1,
            "title": c.title,
            "change_reason": payload.reason or "Manual edit"
        }
    )

    return get_claim_detail(claim_id=claim_id, db=db, current_user=current_user)

@router.post("/claims/{claim_id}/approve", response_model=ClaimResponse)
def approve_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD, UserRole.OUTGOING_EMPLOYEE))
):
    c = db.query(Claim).filter(Claim.id == claim_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Has supporting verified span?
    has_verified_span = any(s.verified for s in c.spans)
    if has_verified_span:
        c.state = ClaimState.VERIFIED
    c.status = ClaimStatus.APPROVED

    version_count = db.query(ClaimVersion).filter(ClaimVersion.claim_id == c.id).count()
    new_v = ClaimVersion(
        claim_id=c.id,
        version_number=version_count + 1,
        title=c.title,
        text=c.text,
        state=c.state,
        status=c.status,
        changed_by_user_id=current_user.id,
        change_reason=f"Approved by {current_user.full_name} ({current_user.role.value})"
    )
    db.add(new_v)
    db.commit()
    db.refresh(c)

    # Append to Custody Ledger
    append_custody_entry(
        db=db,
        project_id=c.project_id,
        claim_id=c.id,
        action="APPROVED",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        details={
            "title": c.title,
            "new_state": c.state.value,
            "approver": current_user.full_name
        }
    )

    record_audit_log(
        db=db,
        action="APPROVE_CLAIM",
        resource_type="claim",
        resource_id=c.id,
        user=current_user,
        project_id=c.project_id,
        details={"title": c.title, "state": c.state.value}
    )

    return get_claim_detail(claim_id=claim_id, db=db, current_user=current_user)

@router.post("/claims/{claim_id}/reject", response_model=ClaimResponse)
def reject_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD))
):
    c = db.query(Claim).filter(Claim.id == claim_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Claim not found")

    c.status = ClaimStatus.REJECTED

    version_count = db.query(ClaimVersion).filter(ClaimVersion.claim_id == c.id).count()
    new_v = ClaimVersion(
        claim_id=c.id,
        version_number=version_count + 1,
        title=c.title,
        text=c.text,
        state=c.state,
        status=c.status,
        changed_by_user_id=current_user.id,
        change_reason=f"Rejected by {current_user.full_name} ({current_user.role.value})"
    )
    db.add(new_v)
    db.commit()
    db.refresh(c)

    # Append to Custody Ledger
    append_custody_entry(
        db=db,
        project_id=c.project_id,
        claim_id=c.id,
        action="REJECTED",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        details={
            "title": c.title,
            "reason": "Rejected by supervisor"
        }
    )

    return get_claim_detail(claim_id=claim_id, db=db, current_user=current_user)

@router.get("/claims/{claim_id}/versions")
def get_claim_versions(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    versions = db.query(ClaimVersion).filter(ClaimVersion.claim_id == claim_id).order_by(ClaimVersion.version_number.asc()).all()
    res = []
    for v in versions:
        u = db.query(User).filter(User.id == v.changed_by_user_id).first() if v.changed_by_user_id else None
        res.append({
            "version_number": v.version_number,
            "title": v.title,
            "text": v.text,
            "state": v.state,
            "status": v.status,
            "changed_by": u.full_name if u else "System",
            "change_reason": v.change_reason,
            "created_at": v.created_at
        })
    return res
