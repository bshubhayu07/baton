from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.custody import CustodyLedger
from app.models.user import User
from app.schemas.custody import CustodyEntryResponse, CustodyVerifyResponse
from app.services.auth import get_current_user
from app.services.custody_ledger import verify_project_ledger

router = APIRouter(prefix="/projects/{project_id}/ledger", tags=["Custody Ledger"])

@router.get("", response_model=List[CustodyEntryResponse])
def get_custody_ledger(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entries = (
        db.query(CustodyLedger)
        .filter(CustodyLedger.project_id == project_id)
        .order_by(CustodyLedger.created_at.asc(), CustodyLedger.id.asc())
        .all()
    )
    return entries

@router.get("/verify", response_model=CustodyVerifyResponse)
def verify_ledger_chain(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = verify_project_ledger(db=db, project_id=project_id)
    return result
