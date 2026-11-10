from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import ClaimState
from app.models.claim import Claim
from app.models.source import SourceItem
from app.models.conflict import Conflict
from app.models.user import User
from app.services.auth import get_current_user
from app.services.redaction import is_role_permitted

router = APIRouter(prefix="/projects/{project_id}/graph", tags=["Evidence Graph"])

STATE_COLORS = {
    ClaimState.VERIFIED: "#10B981",    # Emerald
    ClaimState.INFERRED: "#38BDF8",    # Electric Cyan
    ClaimState.CONFLICTING: "#F59E0B", # Amber
    ClaimState.MISSING: "#EF4444",     # Crimson
}

@router.get("")
def get_evidence_graph(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns graph nodes and edges optimized for React Flow rendering.
    Enforces role-based permission boundaries.
    """
    claims = db.query(Claim).filter(Claim.project_id == project_id).all()
    sources = db.query(SourceItem).filter(SourceItem.project_id == project_id).all()
    conflicts = db.query(Conflict).filter(Conflict.project_id == project_id).all()

    # Filter claims user has clearance for
    visible_claims = [c for c in claims if is_role_permitted(current_user.role, c.permission_level)]
    claim_id_set = {c.id for c in visible_claims}

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

    # 1. Source Nodes (arranged in left column)
    source_map = {}
    for idx, s in enumerate(sources):
        source_map[s.id] = s
        nodes.append({
            "id": f"source_{s.id}",
            "type": "sourceNode",
            "position": {"x": 50, "y": 80 + idx * 160},
            "data": {
                "id": s.id,
                "name": s.name,
                "type": s.type.value if hasattr(s.type, "value") else str(s.type),
                "permission_tag": s.permission_tag.value if hasattr(s.permission_tag, "value") else str(s.permission_tag),
                "raw_text": s.raw_text[:200] + "...",
                "full_raw_text": s.raw_text,
                "node_type": "SOURCE"
            }
        })

    # 2. Claim Nodes (arranged in middle and right columns)
    col_x = {"DECISION": 480, "REASONING": 480, "OWNERSHIP": 900, "DEPENDENCY": 900, "RISK": 900, "UNRESOLVED_ISSUE": 900}
    y_counters = {"DECISION": 60, "REASONING": 280, "OWNERSHIP": 60, "DEPENDENCY": 240, "RISK": 420, "UNRESOLVED_ISSUE": 600}

    for c in visible_claims:
        cat = c.category.value if hasattr(c.category, "value") else str(c.category)
        x_pos = col_x.get(cat, 500)
        y_pos = y_counters.get(cat, 100)
        y_counters[cat] = y_pos + 160

        # Primary supporting span
        first_span = c.spans[0] if c.spans else None
        source_id = first_span.source_item_id if first_span else None
        quote = first_span.quote if first_span else ""
        source_name = source_map.get(source_id).name if (source_id and source_id in source_map) else "No Source"

        color = STATE_COLORS.get(c.state, "#94A3B8")

        nodes.append({
            "id": f"claim_{c.id}",
            "type": "claimNode",
            "position": {"x": x_pos, "y": y_pos},
            "data": {
                "id": c.id,
                "title": c.title,
                "text": c.text,
                "category": cat,
                "state": c.state.value if hasattr(c.state, "value") else str(c.state),
                "status": c.status.value if hasattr(c.status, "value") else str(c.status),
                "confidence": c.confidence_score,
                "permission_level": c.permission_level.value if hasattr(c.permission_level, "value") else str(c.permission_level),
                "quote": quote,
                "start_offset": first_span.start_offset if first_span else 0,
                "end_offset": first_span.end_offset if first_span else 0,
                "source_id": source_id,
                "source_name": source_name,
                "verified": first_span.verified if first_span else False,
                "color": color,
                "node_type": "CLAIM"
            }
        })

        # Create edge from source to claim
        if source_id and f"source_{source_id}" in [n["id"] for n in nodes]:
            edges.append({
                "id": f"edge_src_{source_id}_claim_{c.id}",
                "source": f"source_{source_id}",
                "target": f"claim_{c.id}",
                "label": "verbatim quote",
                "animated": c.state == ClaimState.INFERRED,
                "style": {"stroke": "#00F0FF", "strokeWidth": 1.5, "opacity": 0.8}
            })

    # 3. Conflict Edges
    for idx, cf in enumerate(conflicts):
        if cf.claim_id_1 in claim_id_set and cf.claim_id_2 and cf.claim_id_2 in claim_id_set:
            edges.append({
                "id": f"edge_conflict_{cf.id}",
                "source": f"claim_{cf.claim_id_1}",
                "target": f"claim_{cf.claim_id_2}",
                "label": "contradicts",
                "animated": True,
                "style": {"stroke": "#F59E0B", "strokeWidth": 2.5, "strokeDasharray": "5,5"}
            })

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": len(nodes),
            "claims": len(visible_claims),
            "sources": len(sources),
            "edges": len(edges)
        }
    }
