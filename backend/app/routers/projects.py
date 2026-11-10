from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import UserRole, ClaimState
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.models.source import SourceItem
from app.models.claim import Claim
from app.models.gap_question import GapQuestion
from app.models.conflict import Conflict
from app.schemas.project import ProjectCreate, ProjectResponse, MemberAddRequest, ProjectMemberResponse
from app.services.auth import get_current_user, require_roles
from app.services.audit import record_audit_log

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).filter(Project.org_id == current_user.org_id).all()
    results = []
    for p in projects:
        m_count = db.query(ProjectMember).filter(ProjectMember.project_id == p.id).count()
        s_count = db.query(SourceItem).filter(SourceItem.project_id == p.id).count()
        c_count = db.query(Claim).filter(Claim.project_id == p.id).count()
        v_count = db.query(Claim).filter(Claim.project_id == p.id, Claim.state == ClaimState.VERIFIED).count()
        g_count = db.query(GapQuestion).filter(GapQuestion.project_id == p.id, GapQuestion.status == "OPEN").count()
        cf_count = db.query(Conflict).filter(Conflict.project_id == p.id, Conflict.status == "UNRESOLVED").count()

        p_dict = {
            "id": p.id,
            "org_id": p.org_id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "created_by": p.created_by,
            "created_at": p.created_at,
            "member_count": m_count,
            "sources_count": s_count,
            "claims_count": c_count,
            "verified_claims_count": v_count,
            "open_gaps_count": g_count,
            "unresolved_conflicts_count": cf_count
        }
        results.append(p_dict)
    return results

@router.post("", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD))
):
    project = Project(
        org_id=current_user.org_id,
        name=payload.name,
        description=payload.description,
        created_by=current_user.id,
        status="ACTIVE"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Automatically add creator as member
    member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=current_user.role
    )
    db.add(member)
    db.commit()

    record_audit_log(
        db=db,
        action="CREATE_PROJECT",
        resource_type="project",
        resource_id=project.id,
        user=current_user,
        project_id=project.id,
        details={"name": project.name}
    )

    return {
        "id": project.id,
        "org_id": project.org_id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "created_by": project.created_by,
        "created_at": project.created_at,
        "member_count": 1,
        "sources_count": 0,
        "claims_count": 0,
        "verified_claims_count": 0,
        "open_gaps_count": 0,
        "unresolved_conflicts_count": 0
    }

@router.get("/{id}", response_model=ProjectResponse)
def get_project_detail(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Project).filter(Project.id == id, Project.org_id == current_user.org_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    m_count = db.query(ProjectMember).filter(ProjectMember.project_id == p.id).count()
    s_count = db.query(SourceItem).filter(SourceItem.project_id == p.id).count()
    c_count = db.query(Claim).filter(Claim.project_id == p.id).count()
    v_count = db.query(Claim).filter(Claim.project_id == p.id, Claim.state == ClaimState.VERIFIED).count()
    g_count = db.query(GapQuestion).filter(GapQuestion.project_id == p.id, GapQuestion.status == "OPEN").count()
    cf_count = db.query(Conflict).filter(Conflict.project_id == p.id, Conflict.status == "UNRESOLVED").count()

    return {
        "id": p.id,
        "org_id": p.org_id,
        "name": p.name,
        "description": p.description,
        "status": p.status,
        "created_by": p.created_by,
        "created_at": p.created_at,
        "member_count": m_count,
        "sources_count": s_count,
        "claims_count": c_count,
        "verified_claims_count": v_count,
        "open_gaps_count": g_count,
        "unresolved_conflicts_count": cf_count
    }

@router.get("/{id}/members", response_model=List[ProjectMemberResponse])
def get_project_members(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    members = db.query(ProjectMember).filter(ProjectMember.project_id == id).all()
    res = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            res.append({
                "id": m.id,
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": m.role,
                "created_at": m.created_at
            })
    return res

@router.post("/{id}/members", response_model=ProjectMemberResponse)
def add_project_member(
    id: str,
    payload: MemberAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.TEAM_LEAD))
):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found with that email")

    # Check if already member
    existing = db.query(ProjectMember).filter(ProjectMember.project_id == id, ProjectMember.user_id == target_user.id).first()
    if existing:
        existing.role = payload.role
        db.commit()
        return {
            "id": existing.id,
            "user_id": target_user.id,
            "email": target_user.email,
            "full_name": target_user.full_name,
            "role": existing.role,
            "created_at": existing.created_at
        }

    member = ProjectMember(
        project_id=id,
        user_id=target_user.id,
        role=payload.role
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    record_audit_log(
        db=db,
        action="ADD_MEMBER",
        resource_type="project_member",
        resource_id=member.id,
        user=current_user,
        project_id=id,
        details={"user_email": target_user.email, "role": payload.role.value}
    )

    return {
        "id": member.id,
        "user_id": target_user.id,
        "email": target_user.email,
        "full_name": target_user.full_name,
        "role": member.role,
        "created_at": member.created_at
    }
