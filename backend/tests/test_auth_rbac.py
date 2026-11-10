from app.services.auth import hash_password, verify_password, create_access_token
from app.models.enums import UserRole, PermissionLevel, strictest_permission
from app.services.redaction import is_role_permitted

def test_password_hashing():
    pwd = "SecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert ":" in hashed
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation():
    token = create_access_token({"sub": "user-123", "role": "TEAM_LEAD"})
    assert isinstance(token, str)
    assert len(token) > 20

def test_rbac_clearance_boundaries():
    # Admin can access all levels
    assert is_role_permitted(UserRole.ORG_ADMIN, PermissionLevel.RESTRICTED) is True
    assert is_role_permitted(UserRole.ORG_ADMIN, PermissionLevel.CONFIDENTIAL) is True
    assert is_role_permitted(UserRole.ORG_ADMIN, PermissionLevel.INTERNAL) is True
    assert is_role_permitted(UserRole.ORG_ADMIN, PermissionLevel.PUBLIC) is True

    # Team Lead can access up to CONFIDENTIAL
    assert is_role_permitted(UserRole.TEAM_LEAD, PermissionLevel.CONFIDENTIAL) is True
    assert is_role_permitted(UserRole.TEAM_LEAD, PermissionLevel.INTERNAL) is True
    assert is_role_permitted(UserRole.TEAM_LEAD, PermissionLevel.RESTRICTED) is False

    # Incoming Employee can only access up to INTERNAL
    assert is_role_permitted(UserRole.INCOMING_EMPLOYEE, PermissionLevel.PUBLIC) is True
    assert is_role_permitted(UserRole.INCOMING_EMPLOYEE, PermissionLevel.INTERNAL) is True
    assert is_role_permitted(UserRole.INCOMING_EMPLOYEE, PermissionLevel.CONFIDENTIAL) is False
    assert is_role_permitted(UserRole.INCOMING_EMPLOYEE, PermissionLevel.RESTRICTED) is False

def test_permission_inheritance_strictest():
    levels = [PermissionLevel.PUBLIC, PermissionLevel.INTERNAL, PermissionLevel.CONFIDENTIAL]
    assert strictest_permission(levels) == PermissionLevel.CONFIDENTIAL

    levels_with_restricted = [PermissionLevel.PUBLIC, PermissionLevel.RESTRICTED, PermissionLevel.INTERNAL]
    assert strictest_permission(levels_with_restricted) == PermissionLevel.RESTRICTED

    assert strictest_permission([]) == PermissionLevel.RESTRICTED  # Default deny
