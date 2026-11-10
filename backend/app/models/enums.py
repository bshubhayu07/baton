from enum import Enum

class UserRole(str, Enum):
    OUTGOING_EMPLOYEE = "OUTGOING_EMPLOYEE"
    INCOMING_EMPLOYEE = "INCOMING_EMPLOYEE"
    TEAM_LEAD = "TEAM_LEAD"
    ORG_ADMIN = "ORG_ADMIN"

class PermissionLevel(str, Enum):
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"

# Order of strictness: RESTRICTED > CONFIDENTIAL > INTERNAL > PUBLIC
PERMISSION_HIERARCHY = {
    PermissionLevel.PUBLIC: 1,
    PermissionLevel.INTERNAL: 2,
    PermissionLevel.CONFIDENTIAL: 3,
    PermissionLevel.RESTRICTED: 4,
}

def strictest_permission(levels: list[PermissionLevel]) -> PermissionLevel:
    if not levels:
        return PermissionLevel.RESTRICTED  # Default deny
    return max(levels, key=lambda l: PERMISSION_HIERARCHY.get(l, 4))

class ClaimState(str, Enum):
    VERIFIED = "VERIFIED"
    INFERRED = "INFERRED"
    CONFLICTING = "CONFLICTING"
    MISSING = "MISSING"

class ClaimStatus(str, Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ClaimCategory(str, Enum):
    DECISION = "DECISION"
    REASONING = "REASONING"
    OWNERSHIP = "OWNERSHIP"
    DEPENDENCY = "DEPENDENCY"
    PROGRESS = "PROGRESS"
    RISK = "RISK"
    UNRESOLVED_ISSUE = "UNRESOLVED_ISSUE"

class SourceType(str, Enum):
    GITHUB = "github"
    SLACK = "slack"
    MEETING_NOTES = "meeting_notes"
    TASK_BOARD = "task_board"
    EXIT_INTERVIEW = "exit_interview"
