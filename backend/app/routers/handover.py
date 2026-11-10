from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import UserRole, ClaimCategory, ClaimState, ClaimStatus
from app.models.project import Project
from app.models.claim import Claim
from app.models.custody import CustodyLedger
from app.models.user import User
from app.schemas.handover import HandoverPacketResponse, HandoverAcknowledgeRequest
from app.services.auth import get_current_user, require_roles
from app.services.redaction import filter_and_redact_claims_for_role
from app.services.custody_ledger import append_custody_entry
from app.services.audit import record_audit_log

router = APIRouter(prefix="/projects/{project_id}/handover", tags=["Successor Handover"])

@router.get("", response_model=HandoverPacketResponse)
def get_project_handover_packet(
    project_id: str,
    target_role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # If target_role is requested (e.g. lead previewing what incoming employee sees), check role clearance
    eval_role = current_user.role
    if target_role:
        if current_user.role in [UserRole.ORG_ADMIN, UserRole.TEAM_LEAD]:
            eval_role = target_role

    claims = db.query(Claim).filter(Claim.project_id == project_id).all()

    # Redact and filter claims based on the target role
    redacted_claims = filter_and_redact_claims_for_role(claims, eval_role)

    # Group by category
    decisions = [c for c in redacted_claims if c["category"] in ["DECISION", "REASONING"]]
    ownership = [c for c in redacted_claims if c["category"] == "OWNERSHIP"]
    dependencies = [c for c in redacted_claims if c["category"] == "DEPENDENCY"]
    risks = [c for c in redacted_claims if c["category"] == "RISK"]
    unresolved = [c for c in redacted_claims if c["category"] == "UNRESOLVED_ISSUE"]

    # Retrieve prior acknowledgments from custody ledger
    acks_entries = (
        db.query(CustodyLedger)
        .filter(CustodyLedger.project_id == project_id, CustodyLedger.action == "HANDOVER_ACKNOWLEDGED")
        .order_by(CustodyLedger.created_at.desc())
        .all()
    )
    acks = []
    for a in acks_entries:
        actor = db.query(User).filter(User.id == a.actor_user_id).first()
        acks.append({
            "id": a.id,
            "actor_name": actor.full_name if actor else "Unknown",
            "actor_role": a.actor_role,
            "timestamp": a.timestamp,
            "entry_hash": a.entry_hash,
            "notes": a.details_json.get("notes", "")
        })

    record_audit_log(
        db=db,
        action="EXPORT_HANDOVER",
        resource_type="handover_packet",
        resource_id=project_id,
        user=current_user,
        project_id=project_id,
        details={"target_role": eval_role.value, "is_redacted": eval_role == UserRole.INCOMING_EMPLOYEE}
    )

    return {
        "project_id": project.id,
        "project_name": project.name,
        "generated_for_role": eval_role.value,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "is_redacted": eval_role == UserRole.INCOMING_EMPLOYEE,
        "decisions": decisions,
        "dependencies": dependencies,
        "risks": risks,
        "unresolved_issues": unresolved,
        "ownership": ownership,
        "acknowledgments": acks
    }

@router.post("/acknowledge")
def acknowledge_handover_packet(
    project_id: str,
    payload: HandoverAcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INCOMING_EMPLOYEE, UserRole.TEAM_LEAD, UserRole.ORG_ADMIN))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Append to Custody Ledger
    entry = append_custody_entry(
        db=db,
        project_id=project_id,
        claim_id=None,
        action="HANDOVER_ACKNOWLEDGED",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        details={
            "notes": payload.notes,
            "acknowledged_by": current_user.full_name,
            "project_name": project.name
        }
    )

    record_audit_log(
        db=db,
        action="ACKNOWLEDGE_HANDOVER",
        resource_type="project",
        resource_id=project_id,
        user=current_user,
        project_id=project_id,
        details={"entry_hash": entry.entry_hash, "notes": payload.notes}
    )

    return {
        "status": "success",
        "message": "Handover packet formally acknowledged and cryptographically stamped in the custody ledger.",
        "entry_hash": entry.entry_hash,
        "timestamp": entry.timestamp
    }
