import json
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.custody import CustodyLedger

GENESIS_HASH = "0" * 64

def compute_entry_hash(
    prev_hash: str,
    project_id: str,
    claim_id: Optional[str],
    action: str,
    actor_user_id: str,
    actor_role: str,
    timestamp: str,
    details_json: Dict[str, Any]
) -> str:
    canonical_details = json.dumps(details_json or {}, sort_keys=True, separators=(',', ':'))
    payload = f"{prev_hash}|{project_id}|{claim_id or ''}|{action}|{actor_user_id}|{actor_role}|{timestamp}|{canonical_details}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def append_custody_entry(
    db: Session,
    project_id: str,
    action: str,
    actor_user_id: str,
    actor_role: str,
    claim_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    timestamp: Optional[str] = None
) -> CustodyLedger:
    """
    Appends a new cryptographically chained entry to the project custody ledger.
    """
    if timestamp is None:
        timestamp = datetime.utcnow().isoformat() + "Z"

    # Get the latest entry for this project to get its entry_hash
    last_entry = (
        db.query(CustodyLedger)
        .filter(CustodyLedger.project_id == project_id)
        .order_by(CustodyLedger.created_at.desc(), CustodyLedger.id.desc())
        .first()
    )

    prev_hash = last_entry.entry_hash if last_entry else GENESIS_HASH
    details_data = details or {}
    entry_hash = compute_entry_hash(
        prev_hash=prev_hash,
        project_id=project_id,
        claim_id=claim_id,
        action=action,
        actor_user_id=actor_user_id,
        actor_role=actor_role,
        timestamp=timestamp,
        details_json=details_data
    )

    entry = CustodyLedger(
        project_id=project_id,
        claim_id=claim_id,
        action=action,
        actor_user_id=actor_user_id,
        actor_role=actor_role,
        timestamp=timestamp,
        details_json=details_data,
        prev_hash=prev_hash,
        entry_hash=entry_hash
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def verify_project_ledger(db: Session, project_id: str) -> Dict[str, Any]:
    """
    Traverses the custody chain from start to end, verifying each entry's hash
    and linking to the previous entry's hash.
    """
    entries: List[CustodyLedger] = (
        db.query(CustodyLedger)
        .filter(CustodyLedger.project_id == project_id)
        .order_by(CustodyLedger.created_at.asc(), CustodyLedger.id.asc())
        .all()
    )

    if not entries:
        return {
            "valid": True,
            "total_entries": 0,
            "chain_head": None,
            "message": "Empty ledger. Genesis state is valid."
        }

    expected_prev = GENESIS_HASH

    for idx, entry in enumerate(entries):
        # 1. Verify prev_hash matches
        if entry.prev_hash != expected_prev:
            return {
                "valid": False,
                "broken_index": idx,
                "entry_id": entry.id,
                "reason": f"Hash chain break at entry {idx}: expected prev_hash {expected_prev}, found {entry.prev_hash}"
            }

        # 2. Recalculate entry_hash
        recalculated_hash = compute_entry_hash(
            prev_hash=entry.prev_hash,
            project_id=entry.project_id,
            claim_id=entry.claim_id,
            action=entry.action,
            actor_user_id=entry.actor_user_id,
            actor_role=entry.actor_role,
            timestamp=entry.timestamp,
            details_json=entry.details_json
        )

        if recalculated_hash != entry.entry_hash:
            return {
                "valid": False,
                "broken_index": idx,
                "entry_id": entry.id,
                "reason": f"Tampered content at entry {idx}: computed hash {recalculated_hash} does not match stored hash {entry.entry_hash}"
            }

        expected_prev = entry.entry_hash

    return {
        "valid": True,
        "total_entries": len(entries),
        "chain_head": entries[-1].entry_hash,
        "message": f"All {len(entries)} custody ledger blocks verified. Integrity intact."
    }
