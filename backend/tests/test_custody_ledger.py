from app.services.custody_ledger import append_custody_entry, verify_project_ledger, GENESIS_HASH
from app.models.custody import CustodyLedger

def test_custody_ledger_append_and_verify(db_session, test_setup):
    proj_id = test_setup["project"].id
    admin_id = test_setup["admin"].id

    # Append block 1
    e1 = append_custody_entry(
        db=db_session,
        project_id=proj_id,
        action="CREATED",
        actor_user_id=admin_id,
        actor_role="ORG_ADMIN",
        details={"info": "Project room established"}
    )
    assert e1.prev_hash == GENESIS_HASH
    assert len(e1.entry_hash) == 64

    # Append block 2
    e2 = append_custody_entry(
        db=db_session,
        project_id=proj_id,
        claim_id="claim-abc",
        action="APPROVED",
        actor_user_id=admin_id,
        actor_role="TEAM_LEAD",
        details={"status": "APPROVED", "title": "Stripe Elements"}
    )
    assert e2.prev_hash == e1.entry_hash
    assert len(e2.entry_hash) == 64

    # Verify integrity
    report = verify_project_ledger(db_session, proj_id)
    assert report["valid"] is True
    assert report["total_entries"] == 2
    assert report["chain_head"] == e2.entry_hash

def test_custody_ledger_detects_tampering(db_session, test_setup):
    proj_id = test_setup["project"].id
    lead_id = test_setup["lead"].id

    # Append 3 blocks
    for i in range(3):
        append_custody_entry(
            db=db_session,
            project_id=proj_id,
            action=f"ACTION_{i}",
            actor_user_id=lead_id,
            actor_role="TEAM_LEAD",
            details={"step": i}
        )

    # Initial chain is valid
    assert verify_project_ledger(db_session, proj_id)["valid"] is True

    # Tamper with block 1's details
    tampered_entry = db_session.query(CustodyLedger).filter(CustodyLedger.action == "ACTION_1").first()
    tampered_entry.details_json = {"step": 9999, "MALICIOUS": "FORGERY"}
    db_session.commit()

    # Re-verify: must fail!
    tamper_report = verify_project_ledger(db_session, proj_id)
    assert tamper_report["valid"] is False
    assert tamper_report["broken_index"] == 1
    assert "Tampered content" in tamper_report["reason"]
