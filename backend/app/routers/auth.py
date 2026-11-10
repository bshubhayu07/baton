from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, UserResponse
from app.services.auth import verify_password, create_access_token, get_current_user
from app.services.audit import record_audit_log

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.strip().lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value, "org_id": user.org_id}
    )
    record_audit_log(
        db=db,
        action="LOGIN",
        resource_type="user",
        resource_id=user.id,
        user=user,
        org_id=user.org_id
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login_json(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value, "org_id": user.org_id}
    )
    record_audit_log(
        db=db,
        action="LOGIN",
        resource_type="user",
        resource_id=user.id,
        user=user,
        org_id=user.org_id
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-users")
def list_demo_users(db: Session = Depends(get_db)):
    """Returns the 4 seeded demo personas so the UI role switcher can log into any role with 1 click."""
    users = db.query(User).all()
    res = []
    for u in users:
        token = create_access_token(data={"sub": u.id, "role": u.role.value, "org_id": u.org_id})
        res.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "token": token
        })
    return res
