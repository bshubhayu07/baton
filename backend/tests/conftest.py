import os
import sys
import pytest
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import Base
from app.models.enums import UserRole, PermissionLevel
from app.models.user import Organization, User
from app.models.project import Project, ProjectMember
from app.services.auth import hash_password, create_access_token

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def test_setup(db_session):
    org = Organization(name="Test Org")
    db_session.add(org)
    db_session.commit()

    pwd = hash_password("testpass123")
    admin = User(org_id=org.id, email="admin@test.org", full_name="Admin", role=UserRole.ORG_ADMIN, hashed_password=pwd)
    lead = User(org_id=org.id, email="lead@test.org", full_name="Lead", role=UserRole.TEAM_LEAD, hashed_password=pwd)
    leaver = User(org_id=org.id, email="leaver@test.org", full_name="Leaver", role=UserRole.OUTGOING_EMPLOYEE, hashed_password=pwd)
    successor = User(org_id=org.id, email="successor@test.org", full_name="Successor", role=UserRole.INCOMING_EMPLOYEE, hashed_password=pwd)
    db_session.add_all([admin, lead, leaver, successor])
    db_session.commit()

    proj = Project(org_id=org.id, name="Test Project", description="Testing", created_by=lead.id)
    db_session.add(proj)
    db_session.commit()

    for u in [admin, lead, leaver, successor]:
        pm = ProjectMember(project_id=proj.id, user_id=u.id, role=u.role)
        db_session.add(pm)
    db_session.commit()

    return {
        "org": org,
        "admin": admin,
        "lead": lead,
        "leaver": leaver,
        "successor": successor,
        "project": proj
    }
