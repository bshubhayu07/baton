from app.models.enums import UserRole, PermissionLevel, ClaimCategory, ClaimState, ClaimStatus
from app.services.redaction import redact_text_content, filter_and_redact_claims_for_role

class MockClaim:
    def __init__(self, id, title, text, category, permission_level, state=ClaimState.VERIFIED):
        self.id = id
        self.project_id = "proj-1"
        self.title = title
        self.text = text
        self.category = category
        self.permission_level = permission_level
        self.state = state
        self.status = ClaimStatus.APPROVED
        self.confidence_score = 0.95
        self.spans = []

def test_redact_text_secrets_and_pii():
    raw_sample = (
        "Send logs to support@company.com. "
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123xyz-test. "
        "Contractor billing at $165.00/hour, base salary $195,000/yr."
    )
    redacted = redact_text_content(raw_sample, mask_secrets=True, mask_compensation=True)

    assert "support@company.com" not in redacted
    assert "[REDACTED_EMAIL]" in redacted
    assert "eyJhbGciOi" not in redacted
    assert "[REDACTED_JWT_TOKEN]" in redacted
    assert "$165.00/hour" not in redacted
    assert "$195,000/yr" not in redacted
    assert "[REDACTED_CONFIDENTIAL_COMPENSATION]" in redacted

def test_incoming_employee_never_receives_restricted_or_confidential_claims():
    claims = [
        MockClaim("c1", "Public Architecture Overview", "Overview of API gateway", ClaimCategory.DECISION, PermissionLevel.PUBLIC),
        MockClaim("c2", "Internal Webhook Specs", "Worker retry queue configuration", ClaimCategory.DEPENDENCY, PermissionLevel.INTERNAL),
        MockClaim("c3", "Confidential Vendor Agreement", "Adyen discount volume pricing tier", ClaimCategory.DECISION, PermissionLevel.CONFIDENTIAL),
        MockClaim("c4", "Restricted HR Compensation", "Alex Mercer exit bonus and salary", ClaimCategory.RISK, PermissionLevel.RESTRICTED),
    ]

    # Successor view
    successor_view = filter_and_redact_claims_for_role(claims, UserRole.INCOMING_EMPLOYEE)

    visible_ids = [c["id"] for c in successor_view]
    assert "c1" in visible_ids
    assert "c2" in visible_ids
    # Crucial security invariants:
    assert "c3" not in visible_ids, "CONFIDENTIAL claim leaked to INCOMING_EMPLOYEE!"
    assert "c4" not in visible_ids, "RESTRICTED claim leaked to INCOMING_EMPLOYEE!"

def test_team_lead_can_view_confidential_but_not_restricted():
    claims = [
        MockClaim("c1", "Internal Specs", "Specs text", ClaimCategory.DECISION, PermissionLevel.INTERNAL),
        MockClaim("c2", "Confidential SLA", "Vendor SLA penalty clause", ClaimCategory.DECISION, PermissionLevel.CONFIDENTIAL),
        MockClaim("c3", "Restricted Executive Memo", "Board merger details", ClaimCategory.DECISION, PermissionLevel.RESTRICTED),
    ]

    lead_view = filter_and_redact_claims_for_role(claims, UserRole.TEAM_LEAD)
    visible_ids = [c["id"] for c in lead_view]

    assert "c1" in visible_ids
    assert "c2" in visible_ids
    assert "c3" not in visible_ids, "RESTRICTED claim leaked to TEAM_LEAD!"
