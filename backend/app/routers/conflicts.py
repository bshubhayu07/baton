from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import UserRole, ClaimState
from app.models.conflict import Conflict
from app.models.claim import Claim
from app.models.user import User
from app.schemas.claim import ConflictResponse, ConflictResolveRequest
from app.services.auth import get_current_user, require_roles
from app.services.custody_ledger import append_custody_entry

router = APIRouter(tags=["Conflicts"])

@router.get("/projects/{project_id}/conflicts", response_model=List[ConflictResponse])
def list_conflicts(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conflicts = db.query(Conflict).filter(Conflict.project_id == project_id).all()
    return conflicts

@router.post("/conflicts/{conflict_id}/resolve", response_model=ConflictResponse)
def resolve_conflict(
    conflict_id: str,
    payload: ConflictResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD, UserRole.OUTGOING_EMPLOYEE))
):
    cf = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not cf:
        raise HTTPException(status_code=404, detail="Conflict not found")

    cf.status = "RESOLVED"
    cf.resolved_by_user_id = current_user.id
    cf.resolution_notes = payload.resolution_notes

    # Update associated claims if specified
    if payload.preferred_claim_id:
        preferred = db.query(Claim).filter(Claim.id == payload.preferred_claim_id).first()
        if preferred:
            preferred.state = ClaimState.VERIFIED

        # The other claim can be updated
        other_id = cf.claim_id_2 if payload.preferred_claim_id == cf.claim_id_1 else cf.claim_id_1
        if other_id:
            other = db.query(Claim).filter(Claim.id == other_id).first()
            if other:
                other.text = f"[SUPERSEDED] {other.text} (Resolved in favor of claim {preferred.title if preferred else ''})"

    db.commit()
    db.refresh(cf)

    # Append to Custody Ledger
    append_custody_entry(
        db=db,
        project_id=cf.project_id,
        claim_id=cf.claim_id_1,
        action="CONFLICT_RESOLVED",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        details={
            "conflict_id": cf.id,
            "resolution_notes": cf.resolution_notes,
            "preferred_claim": payload.preferred_claim_id
        }
    )

    return cf
