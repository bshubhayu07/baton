from app.routers.auth import list_demo_users
from app.routers.projects import list_projects, get_project_detail
from app.routers.claims import list_project_claims
from app.routers.graph import get_evidence_graph
from app.routers.ledger import verify_ledger_chain
from app.routers.handover import get_project_handover_packet
from app.models.enums import UserRole
from app.seed_data import seed_demo_data

def test_routes_with_db(db_session):
    # Seed demo into test session
    seed_demo_data(db=db_session, force_recreate=True)

    # 1. Test Demo Users
    demo_users = list_demo_users(db=db_session)
    assert len(demo_users) == 4
    lead_user = next(u for u in demo_users if "lead" in u["email"])
    assert lead_user["role"] == "TEAM_LEAD"

    # Fetch user model
    from app.models.user import User
    lead_model = db_session.query(User).filter(User.email == "lead@baton.local").first()
    successor_model = db_session.query(User).filter(User.email == "successor@baton.local").first()

    # 2. Test List Projects
    projects = list_projects(db=db_session, current_user=lead_model)
    assert len(projects) > 0
    project_id = projects[0]["id"]
    assert projects[0]["name"] == "Payments V2 Core Migration"

    # 3. Test Project Detail
    detail = get_project_detail(id=project_id, db=db_session, current_user=lead_model)
    assert detail["name"] == "Payments V2 Core Migration"
    assert detail["claims_count"] >= 5

    # 4. Test Claims
    claims = list_project_claims(project_id=project_id, db=db_session, current_user=lead_model)
    assert len(claims) >= 5
    # Verify claims have spans with verbatim quote
    assert any(len(c["spans"]) > 0 for c in claims)

    # 5. Test Graph Nodes and Edges
    graph = get_evidence_graph(project_id=project_id, db=db_session, current_user=lead_model)
    assert len(graph["nodes"]) > 0
    assert len(graph["edges"]) > 0
    assert graph["stats"]["claims"] >= 5

    # 6. Test Custody Ledger Verify
    verify_res = verify_ledger_chain(project_id=project_id, db=db_session, current_user=lead_model)
    assert verify_res["valid"] is True
    assert verify_res["total_entries"] >= 5

    # 7. Test Handover Packet for Successor (Verifying redaction)
    handover = get_project_handover_packet(
        project_id=project_id,
        target_role=None,
        db=db_session,
        current_user=successor_model
    )
    assert handover["generated_for_role"] == "INCOMING_EMPLOYEE"
    assert handover["is_redacted"] is True
    assert len(handover["decisions"]) > 0

    # Ensure no compensation leaked into successor handover
    all_handover_text = " ".join([d["text"] for d in handover["decisions"]] + [r["text"] for r in handover["risks"]])
    assert "$195,000" not in all_handover_text
    assert "$165.00" not in all_handover_text
