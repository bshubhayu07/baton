import os
import json
from pathlib import Path
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models.enums import UserRole, SourceType, PermissionLevel
from app.models.user import Organization, User
from app.models.project import Project, ProjectMember
from app.services.auth import hash_password
from app.services.ingestion import ingest_source_document
from app.services.extraction import run_project_reconstruction

SEED_DIR = Path(__file__).resolve().parent.parent.parent / "seed"
if not SEED_DIR.exists():
    SEED_DIR = Path("/seed")

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_demo_data(db: Session = None, force_recreate: bool = False):
    close_db_at_end = False
    if db is None:
        init_db()
        db = SessionLocal()
        close_db_at_end = True

    try:
        # Check if already seeded
        existing_org = db.query(Organization).filter(Organization.name == "Nexus Global").first()
        if existing_org and not force_recreate:
            return {"status": "already_seeded", "org_id": existing_org.id}

        if existing_org and force_recreate:
            db.delete(existing_org)
            db.commit()

        # 1. Organization
        org = Organization(name="Nexus Global")
        db.add(org)
        db.commit()
        db.refresh(org)

        # 2. Users (all 4 demo roles)
        default_pwd_hash = hash_password("password123")
        users = [
            User(
                org_id=org.id,
                email="admin@baton.local",
                full_name="Elena Vance (Org Admin)",
                role=UserRole.ORG_ADMIN,
                hashed_password=default_pwd_hash
            ),
            User(
                org_id=org.id,
                email="lead@baton.local",
                full_name="Dave Chen (Team Lead)",
                role=UserRole.TEAM_LEAD,
                hashed_password=default_pwd_hash
            ),
            User(
                org_id=org.id,
                email="leaver@baton.local",
                full_name="Alex Mercer (Outgoing Senior Staff Engineer)",
                role=UserRole.OUTGOING_EMPLOYEE,
                hashed_password=default_pwd_hash
            ),
            User(
                org_id=org.id,
                email="successor@baton.local",
                full_name="Jordan Taylor (Incoming Senior Staff Engineer)",
                role=UserRole.INCOMING_EMPLOYEE,
                hashed_password=default_pwd_hash
            ),
        ]
        db.add_all(users)
        db.commit()

        user_map = {u.email: u for u in users}

        # 3. Project Room
        project = Project(
            org_id=org.id,
            name="Payments V2 Core Migration",
            description="Mission-critical migration of card processing gateway to Stripe Elements with multi-region failover, idempotency clustering, and PCI SAQ-A certification.",
            created_by=user_map["lead@baton.local"].id,
            status="ACTIVE"
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        # 4. Project Memberships
        for email, u in user_map.items():
            pm = ProjectMember(
                project_id=project.id,
                user_id=u.id,
                role=u.role
            )
            db.add(pm)
        db.commit()

        # 5. Load and Ingest Seed Sources
        # GitHub export
        gh_path = SEED_DIR / "github_export.json"
        if gh_path.exists():
            gh_raw = gh_path.read_text(encoding="utf-8")
        else:
            gh_raw = "We decided to store idempotency keys in Redis with DynamoDB as durable fallback rather than PostgreSQL to avoid connection pool exhaustion during peak flash sales.\nAlex Mercer is code owner for /services/webhook-ingest and the dead-letter-queue retry worker in k8s/payments-worker.yaml.\nTarget cutover date for production traffic switchover is scheduled for December 15, 2026 as per release sprint milestone."

        ingest_source_document(
            db=db,
            project_id=project.id,
            source_type=SourceType.GITHUB,
            name="GitHub: payments-v2-core (commits & PR #142)",
            raw_text=gh_raw,
            permission_tag=PermissionLevel.INTERNAL,
            metadata={"repo": "nexus-corp/payments-v2-core", "branch": "main"},
            user=user_map["leaver@baton.local"]
        )

        # Slack export
        slack_path = SEED_DIR / "slack_export.json"
        if slack_path.exists():
            slack_raw = slack_path.read_text(encoding="utf-8")
        else:
            slack_raw = "Stripe Payment Elements gives us in-app custom branding and iframe isolation for PCI SAQ-A eligibility, whereas Hosted Checkout forces a domain redirect that dropped conversion by 4.2% in EU testing.\nDave Chen confirmed on Slack: We are pushing the production cutover date back to January 10, 2027 to allow QA team time for penetration testing.\n[RESTRICTED HR NOTICE] Contractor invoice approval for Alex Mercer at rate of $165.00/hour, base compensation tier $195,000/yr. Account contact: alex.mercer.billing@nexuscorp.internal."

        ingest_source_document(
            db=db,
            project_id=project.id,
            source_type=SourceType.SLACK,
            name="Slack: #payments-migration-arch threads",
            raw_text=slack_raw,
            permission_tag=PermissionLevel.INTERNAL,
            metadata={"channel": "#payments-migration-arch"},
            user=user_map["lead@baton.local"]
        )

        # Meeting notes
        meeting_path = SEED_DIR / "architecture_meeting_notes.md"
        if meeting_path.exists():
            meeting_raw = meeting_path.read_text(encoding="utf-8")
        else:
            meeting_raw = "Payments-v2 service is strictly dependent on the Core Banking V3 gRPC service deployment for merchant account ledger balance settlement.\nLoad testing revealed a gradual memory leak in the webhook worker container when processing batches exceeding 15,000 requests/minute, requiring nightly container restarts."

        ingest_source_document(
            db=db,
            project_id=project.id,
            source_type=SourceType.MEETING_NOTES,
            name="Architecture Review & Risk Sync (Oct 28)",
            raw_text=meeting_raw,
            permission_tag=PermissionLevel.INTERNAL,
            metadata={"attendees": ["Dave Chen", "Alex Mercer", "Jordan Taylor"]},
            user=user_map["lead@baton.local"]
        )

        # Task board CSV
        task_path = SEED_DIR / "task_board.csv"
        if task_path.exists():
            task_raw = task_path.read_text(encoding="utf-8")
        else:
            task_raw = "ticket_id,title,assignee,status,priority\nPAY-101,Idempotency Store,Alex Mercer,DONE,HIGH\nPAY-105,Disaster Recovery Runbook,UNASSIGNED,TODO,CRITICAL"

        ingest_source_document(
            db=db,
            project_id=project.id,
            source_type=SourceType.TASK_BOARD,
            name="Linear Sprint Board (PAY-101 - PAY-106)",
            raw_text=task_raw,
            permission_tag=PermissionLevel.INTERNAL,
            metadata={"board": "Payments V2 Migration Sprint 42"},
            user=user_map["lead@baton.local"]
        )

        # 6. Execute AI Reconstruction
        reconstruction_res = run_project_reconstruction(
            db=db,
            project_id=project.id,
            user=user_map["lead@baton.local"]
        )

        return {
            "status": "success",
            "org_id": org.id,
            "project_id": project.id,
            "reconstruction": reconstruction_res
        }
    finally:
        if close_db_at_end:
            db.close()
