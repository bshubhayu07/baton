from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.enums import (
    ClaimCategory,
    ClaimState,
    ClaimStatus,
    PermissionLevel,
    strictest_permission,
    UserRole
)
from app.models.source import SourceItem
from app.models.claim import Claim, ClaimSpan, ClaimVersion
from app.models.conflict import Conflict
from app.models.gap_question import GapQuestion
from app.services.llm_provider import get_llm_provider
from app.services.span_verifier import verify_quote_in_source
from app.services.custody_ledger import append_custody_entry
from app.services.audit import record_audit_log
from app.models.user import User

def run_project_reconstruction(
    db: Session,
    project_id: str,
    user: Optional[User] = None
) -> Dict[str, Any]:
    """
    Executes AI reconstruction across all project sources:
    1. Retrieves ingested sources
    2. Runs LLM extraction for decisions, reasoning, ownership, dependencies, risks, unresolved issues
    3. Runs verbatim span verification on every claim quote
    4. Enforces permission inheritance (strictest of underlying sources)
    5. Detects conflicts and records them
    6. Identifies gaps and auto-generates targeted questions for the leaver
    7. Appends every creation to the tamper-evident custody ledger
    """
    sources = db.query(SourceItem).filter(SourceItem.project_id == project_id).all()
    if not sources:
        return {"claims_created": 0, "conflicts_created": 0, "gap_questions_created": 0}

    sources_dict = [
        {
            "id": s.id,
            "type": s.type.value if hasattr(s.type, "value") else str(s.type),
            "name": s.name,
            "raw_text": s.raw_text,
            "permission_tag": s.permission_tag.value if hasattr(s.permission_tag, "value") else str(s.permission_tag)
        }
        for s in sources
    ]

    llm = get_llm_provider()
    extraction_output = llm.extract_claims(sources_dict)

    extracted_claims = extraction_output.get("claims", [])
    extracted_conflicts = extraction_output.get("conflicts", [])

    created_claims = []
    created_conflicts = []

    actor_id = user.id if user else "SYSTEM_AI_EXTRACTOR"
    actor_role = user.role.value if user and user.role else "SYSTEM"

    # Map sources by ID for quick quote verification
    source_obj_map = {s.id: s for s in sources}

    for claim_data in extracted_claims:
        category_str = claim_data.get("category", "DECISION")
        try:
            category = ClaimCategory(category_str)
        except ValueError:
            category = ClaimCategory.DECISION

        quote = claim_data.get("quote", "").strip()
        source_id = claim_data.get("source_id")
        initial_state = claim_data.get("state", "INFERRED")

        # Determine supporting source and permission level
        supporting_sources: List[PermissionLevel] = []
        is_verified = False
        start_offset = 0
        end_offset = 0
        failure_reason = None

        if source_id and source_id in source_obj_map and quote:
            src = source_obj_map[source_id]
            supporting_sources.append(src.permission_tag)
            # Verify quote in source text
            is_verified, start_offset, end_offset, failure_reason = verify_quote_in_source(quote, src.raw_text)

        # Inherit strictest permission level of underlying sources (default to INTERNAL or RESTRICTED)
        permission_level = strictest_permission(supporting_sources) if supporting_sources else PermissionLevel.INTERNAL

        # Determine claim state
        if not quote or not is_verified:
            # If evidence doesn't exist or failed verification, mark MISSING
            state = ClaimState.MISSING
            confidence = 0.50
        elif initial_state == "CONFLICTING":
            state = ClaimState.CONFLICTING
            confidence = claim_data.get("confidence_score", 0.80)
        else:
            state = ClaimState.INFERRED
            confidence = claim_data.get("confidence_score", 0.90)

        claim = Claim(
            project_id=project_id,
            category=category,
            title=claim_data.get("title", "Untitled Claim"),
            text=claim_data.get("text", ""),
            state=state,
            permission_level=permission_level,
            status=ClaimStatus.DRAFT,
            confidence_score=confidence,
            created_by_role="AI_RECONSTRUCTION"
        )
        db.add(claim)
        db.commit()
        db.refresh(claim)

        # Add initial version
        v1 = ClaimVersion(
            claim_id=claim.id,
            version_number=1,
            title=claim.title,
            text=claim.text,
            state=claim.state,
            status=claim.status,
            changed_by_user_id=actor_id if user else None,
            change_reason="Extracted via AI Reconstruction"
        )
        db.add(v1)

        # Add claim span if quote exists
        if source_id and quote:
            span = ClaimSpan(
                claim_id=claim.id,
                source_item_id=source_id,
                quote=quote,
                start_offset=start_offset,
                end_offset=end_offset,
                verified=is_verified,
                verification_failure_reason=failure_reason
            )
            db.add(span)

        db.commit()
        created_claims.append(claim)

        # Log into custody ledger
        append_custody_entry(
            db=db,
            project_id=project_id,
            claim_id=claim.id,
            action="EXTRACTED",
            actor_user_id=actor_id,
            actor_role=actor_role,
            details={
                "title": claim.title,
                "category": category.value,
                "state": state.value,
                "permission": permission_level.value,
                "span_verified": is_verified
            }
        )

    # Process conflicts
    for conflict_data in extracted_conflicts:
        # Find corresponding claims if possible
        c1 = next((c for c in created_claims if conflict_data.get("source_a_quote") in (c.text or "") or (c.spans and conflict_data.get("source_a_quote") in c.spans[0].quote)), None)
        c2 = next((c for c in created_claims if conflict_data.get("source_b_quote") in (c.text or "") or (c.spans and conflict_data.get("source_b_quote") in c.spans[0].quote)), None)

        conflict_obj = Conflict(
            project_id=project_id,
            claim_id_1=c1.id if c1 else (created_claims[0].id if created_claims else "UNKNOWN"),
            claim_id_2=c2.id if c2 else (created_claims[1].id if len(created_claims) > 1 else None),
            description=conflict_data.get("description", "Contradiction detected across sources"),
            source_a_quote=conflict_data.get("source_a_quote"),
            source_b_quote=conflict_data.get("source_b_quote"),
            status="UNRESOLVED"
        )
        db.add(conflict_obj)
        created_conflicts.append(conflict_obj)

    db.commit()

    # Generate gap questions from MISSING or CONFLICTING items
    missing_or_conflicting = [
        {"id": c.id, "title": c.title, "state": c.state.value}
        for c in created_claims
        if c.state in [ClaimState.MISSING, ClaimState.CONFLICTING]
    ]

    gap_questions_data = llm.generate_gap_questions(missing_or_conflicting, extracted_conflicts)
    created_questions = []

    for gq in gap_questions_data:
        q_obj = GapQuestion(
            project_id=project_id,
            question=gq.get("question"),
            category=gq.get("category", "GENERAL"),
            context=gq.get("context"),
            suggested_answers=gq.get("suggested_answers", []),
            status="OPEN"
        )
        db.add(q_obj)
        created_questions.append(q_obj)

    db.commit()

    if user:
        record_audit_log(
            db=db,
            action="RUN_RECONSTRUCTION",
            resource_type="project",
            resource_id=project_id,
            user=user,
            project_id=project_id,
            details={
                "claims_created": len(created_claims),
                "conflicts_created": len(created_conflicts),
                "gap_questions": len(created_questions)
            }
        )

    return {
        "claims_created": len(created_claims),
        "conflicts_created": len(created_conflicts),
        "gap_questions_created": len(created_questions),
        "claims": [c.id for c in created_claims]
    }
