import re
from typing import Optional, List, Dict, Any
from app.models.enums import PermissionLevel, PERMISSION_HIERARCHY, UserRole

# Maximum allowed permission level per role
ROLE_MAX_PERMISSION: Dict[UserRole, PermissionLevel] = {
    UserRole.ORG_ADMIN: PermissionLevel.RESTRICTED,
    UserRole.TEAM_LEAD: PermissionLevel.CONFIDENTIAL,
    UserRole.OUTGOING_EMPLOYEE: PermissionLevel.CONFIDENTIAL,
    UserRole.INCOMING_EMPLOYEE: PermissionLevel.INTERNAL,
}

# Regex patterns for sensitive tokens, credentials, PII and compensation
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
JWT_PATTERN = re.compile(r'\beyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b')
API_KEY_PATTERNS = [
    re.compile(r'\b(?:sk_live_|sk_test_|ghp_|gho_|xoxb-|xoxp-|AKIA)[a-zA-Z0-9_]{16,}\b'),
    re.compile(r'\bBearer\s+[a-zA-Z0-9_\-\.]{20,}\b', re.IGNORECASE),
    re.compile(r'\b(?:api[_-]?key|secret|token)[\s:=]+["\']?([a-zA-Z0-9_\-]{20,})["\']?', re.IGNORECASE),
]
COMPENSATION_PATTERN = re.compile(
    r'(?:\$|USD\s*)\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s*(?:k|K|/yr|/year|/hr|/hour|/mo|/month|base|salary|bonus|equity))?',
    re.IGNORECASE
)
SSN_OR_ID_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')

def is_role_permitted(user_role: UserRole, item_permission: PermissionLevel) -> bool:
    """
    Checks if a given user role has sufficient permission to view an item.
    Enforces Default Deny.
    """
    max_level = ROLE_MAX_PERMISSION.get(user_role)
    if not max_level:
        return False  # Default Deny

    user_rank = PERMISSION_HIERARCHY.get(max_level, 0)
    item_rank = PERMISSION_HIERARCHY.get(item_permission, 999)
    return user_rank >= item_rank

def redact_text_content(text: str, mask_secrets: bool = True, mask_compensation: bool = True) -> str:
    """
    Sanitizes text by masking PII, credentials, tokens, and compensation numbers.
    """
    if not text:
        return ""

    sanitized = text

    # Redact JWT tokens
    sanitized = JWT_PATTERN.sub("[REDACTED_JWT_TOKEN]", sanitized)

    # Redact known API key formats
    for pat in API_KEY_PATTERNS:
        sanitized = pat.sub("[REDACTED_API_KEY]", sanitized)

    # Redact compensation / salary details
    if mask_compensation:
        sanitized = COMPENSATION_PATTERN.sub("[REDACTED_CONFIDENTIAL_COMPENSATION]", sanitized)

    # Redact emails
    sanitized = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", sanitized)

    # Redact SSN / national IDs
    sanitized = SSN_OR_ID_PATTERN.sub("[REDACTED_IDENTIFIER]", sanitized)

    return sanitized

def filter_and_redact_claims_for_role(claims: List[Any], user_role: UserRole) -> List[Dict[str, Any]]:
    """
    Filters out claims above the user's permission boundary, and runs the redaction
    engine on all allowed claims to scrub accidental secrets or PII.
    """
    result = []
    for claim in claims:
        # Check permission level
        perm = getattr(claim, "permission_level", PermissionLevel.RESTRICTED)
        if not is_role_permitted(user_role, perm):
            continue  # Exclude strictly

        # If incoming employee, mask compensation and secrets aggressively
        mask_comp = (user_role == UserRole.INCOMING_EMPLOYEE)

        claim_dict = {
            "id": claim.id,
            "project_id": claim.project_id,
            "category": claim.category.value if hasattr(claim.category, "value") else str(claim.category),
            "title": redact_text_content(claim.title, mask_compensation=mask_comp),
            "text": redact_text_content(claim.text, mask_compensation=mask_comp),
            "state": claim.state.value if hasattr(claim.state, "value") else str(claim.state),
            "status": claim.status.value if hasattr(claim.status, "value") else str(claim.status),
            "permission_level": perm.value if hasattr(perm, "value") else str(perm),
            "confidence_score": claim.confidence_score,
            "spans": [],
        }

        # Format spans if present
        if hasattr(claim, "spans"):
            for span in claim.spans:
                claim_dict["spans"].append({
                    "id": span.id,
                    "source_item_id": span.source_item_id,
                    "quote": redact_text_content(span.quote, mask_compensation=mask_comp),
                    "start_offset": span.start_offset,
                    "end_offset": span.end_offset,
                    "verified": span.verified,
                })

        result.append(claim_dict)
    return result
