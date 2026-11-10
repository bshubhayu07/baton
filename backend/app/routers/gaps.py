from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import UserRole, SourceType, ClaimCategory, ClaimState, ClaimStatus, PermissionLevel
from app.models.gap_question import GapQuestion
from app.models.claim import Claim, ClaimSpan, ClaimVersion
from app.models.user import User
from app.schemas.gap import GapQuestionResponse, GapAnswerRequest
from app.services.auth import get_current_user, require_roles
from app.services.ingestion import ingest_source_document
from app.services.custody_ledger import append_custody_entry
from app.services.audit import record_audit_log

router = APIRouter(tags=["Gap Questions & Exit Interview"])

@router.get("/projects/{project_id}/gaps", response_model=List[GapQuestionResponse])
def list_gap_questions(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    questions = db.query(GapQuestion).filter(GapQuestion.project_id == project_id).order_by(GapQuestion.created_at.asc()).all()
    return questions

@router.post("/gaps/{gap_id}/answer", response_model=GapQuestionResponse)
def answer_gap_question(
    gap_id: str,
    payload: GapAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.OUTGOING_EMPLOYEE, UserRole.TEAM_LEAD, UserRole.ORG_ADMIN))
):
    gap = db.query(GapQuestion).filter(GapQuestion.id == gap_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap question not found")

    answer_clean = payload.answer_text.strip()
    if not answer_clean:
        raise HTTPException(status_code=400, detail="Answer text cannot be blank")

    gap.answer_text = answer_clean
    gap.status = "CONVERTED_TO_CLAIM"
    gap.answered_by_user_id = current_user.id
    gap.answered_at = datetime.utcnow()
    db.commit()

    # 1. Ingest answer as an authoritative Exit Interview Source Item
    interview_source = ingest_source_document(
        db=db,
        project_id=gap.project_id,
        source_type=SourceType.EXIT_INTERVIEW,
        name=f"Exit Interview Statement: {gap.question[:45]}...",
        raw_text=f"Q: {gap.question}\nA: {answer_clean}",
        permission_tag=PermissionLevel.INTERNAL,
        metadata={"gap_id": gap.id, "answered_by": current_user.full_name, "role": current_user.role.value},
        user=current_user
    )

    # 2. Create newly evidence-linked claim directly backed by the verbatim answer!
    new_claim = Claim(
        project_id=gap.project_id,
        category=ClaimCategory.REASONING if "decision" in gap.question.lower() else ClaimCategory.DECISION,
        title=f"Exit Interview Clarification: {gap.category.replace('_', ' ').title()}",
        text=answer_clean,
        state=ClaimState.VERIFIED,  # Human leaver verified!
        permission_level=PermissionLevel.INTERNAL,
        status=ClaimStatus.APPROVED,
        confidence_score=1.00,
        created_by_role=current_user.role.value
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    # 3. Create verbatim supporting span
    quote_in_src = answer_clean
    full_text = interview_source.raw_text
    start_idx = full_text.find(quote_in_src)
    end_idx = start_idx + len(quote_in_src) if start_idx != -1 else len(full_text)

    span = ClaimSpan(
        claim_id=new_claim.id,
        source_item_id=interview_source.id,
        quote=quote_in_src,
        start_offset=max(0, start_idx),
        end_offset=end_idx,
        verified=True
    )
    db.add(span)

    # Add version
    v1 = ClaimVersion(
        claim_id=new_claim.id,
        version_number=1,
        title=new_claim.title,
        text=new_claim.text,
        state=new_claim.state,
        status=new_claim.status,
        changed_by_user_id=current_user.id,
        change_reason=f"Generated from Leaver Exit Interview response to gap question: {gap.question[:40]}..."
    )
    db.add(v1)
    db.commit()

    # 4. Record to Custody Ledger
    append_custody_entry(
        db=db,
        project_id=gap.project_id,
        claim_id=new_claim.id,
        action="GAP_ANSWERED",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value,
        details={
            "gap_id": gap.id,
            "question": gap.question,
            "created_claim_id": new_claim.id,
            "answer_preview": answer_clean[:100]
        }
    )

    record_audit_log(
        db=db,
        action="ANSWER_GAP",
        resource_type="gap_question",
        resource_id=gap.id,
        user=current_user,
        project_id=gap.project_id,
        details={"question": gap.question, "claim_id": new_claim.id}
    )

    return gap
