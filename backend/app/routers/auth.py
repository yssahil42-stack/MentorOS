from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..database import get_db
from .. import models, schemas
from ..auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def _to_user_out(user: models.User) -> schemas.UserOut:
    out = schemas.UserOut.from_orm(user)
    out.onboarding_complete = bool(user.onboarding_completed)
    out.onboarding_completed = bool(user.onboarding_completed)
    out.profile_data = user.profile_data or {}
    return out

@router.post("/register", response_model=schemas.TokenResponse)
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create an account with the supplied details.",
        )

    hashed_pw = get_password_hash(user_in.password)
    user = models.User(
        email=user_in.email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name,
        role=user_in.role,
        onboarding_completed=True,
        profile_data=user_in.profile_data or {},
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create an account with the supplied details.",
        )
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return schemas.TokenResponse(access_token=token, user=_to_user_out(user))

@router.post("/login", response_model=schemas.TokenResponse)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(data={"sub": str(user.id)})
    return schemas.TokenResponse(access_token=token, user=_to_user_out(user))

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return _to_user_out(current_user)

def _save_onboarding(data: dict, current_user: models.User, db: Session) -> schemas.UserOut:
    current_user.onboarding_completed = True
    current_user.profile_data = data
    db.commit()
    db.refresh(current_user)
    return _to_user_out(current_user)

@router.patch("/onboarding", response_model=schemas.UserOut)
def complete_onboarding(
    payload: schemas.OnboardingUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.profile_data or payload.onboarding_data or {}
    return _save_onboarding(data, current_user, db)

@router.patch("/me/onboarding", response_model=schemas.UserOut)
def complete_onboarding_me(
    payload: schemas.OnboardingUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.profile_data or payload.onboarding_data or {}
    return _save_onboarding(data, current_user, db)
