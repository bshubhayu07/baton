from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.seed_data import seed_demo_data
from app.models.project import Project

router = APIRouter(prefix="/demo", tags=["Demo Simulation"])

@router.post("/seed")
def seed_demo_endpoint(force: bool = False, db: Session = Depends(get_db)):
    """Triggers seeding of the realistic Payments V2 Migration demo project with all 4 roles and sources."""
    res = seed_demo_data(db=db, force_recreate=force)
    return res

@router.get("/status")
def get_demo_status(db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.name == "Payments V2 Core Migration").first()
    return {
        "seeded": project is not None,
        "project_id": project.id if project else None,
        "project_name": project.name if project else None
    }
