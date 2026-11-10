from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.auth import UserResponse
from app.services.auth import get_current_user, require_roles
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin & Audit"])

class RoleUpdateRequest(BaseModel):
    role: UserRole

@router.get("/audit-logs")
def get_audit_logs(
    project_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD))
):
    query = db.query(AuditLog)
    if project_id:
        query = query.filter(AuditLog.project_id == project_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    res = []
    for l in logs:
        u = db.query(User).filter(User.id == l.user_id).first() if l.user_id else None
        res.append({
            "id": l.id,
            "action": l.action,
            "user_name": u.full_name if u else "System",
            "user_email": u.email if u else "system@baton.local",
            "user_role": l.user_role,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details_json,
            "created_at": l.created_at
        })
    return res

@router.get("/users", response_model=List[UserResponse])
def list_organization_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN))
):
    users = db.query(User).filter(User.org_id == current_user.org_id).all()
    return users

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    payload: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN))
):
    u = db.query(User).filter(User.id == user_id, User.org_id == current_user.org_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.role = payload.role
    db.commit()
    db.refresh(u)
    return u
