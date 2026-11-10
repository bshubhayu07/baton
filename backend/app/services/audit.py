from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.user import User

def record_audit_log(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user: Optional[User] = None,
    project_id: Optional[str] = None,
    org_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """Records an audit log entry for compliance, security tracking and forensics."""
    user_id = user.id if user else None
    user_role = user.role.value if user and user.role else "ANONYMOUS"
    organization_id = org_id or (user.org_id if user else "DEFAULT_ORG")

    log_entry = AuditLog(
        org_id=organization_id,
        project_id=project_id,
        user_id=user_id,
        user_role=user_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        details_json=details or {}
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
