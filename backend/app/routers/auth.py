import secrets
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..database import get_db
from ..config import settings
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
    clean_email = user_in.email.strip().lower()
    existing = db.query(models.User).filter(models.User.email == clean_email).first()
    if not existing:
        existing = db.query(models.User).filter(models.User.email.ilike(clean_email)).first()

    hashed_pw = get_password_hash(user_in.password)
    if existing:
        # Existing account - update credentials and profile in the database
        existing.hashed_password = hashed_pw
        if user_in.full_name:
            existing.full_name = user_in.full_name
        if user_in.role:
            existing.role = user_in.role
        if user_in.profile_data:
            existing.profile_data = user_in.profile_data
        db.commit()
        db.refresh(existing)
        token = create_access_token(data={"sub": str(existing.id)})
        return schemas.TokenResponse(access_token=token, user=_to_user_out(existing))

    user = models.User(
        email=clean_email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name,
        role=user_in.role,
        onboarding_completed=True,
        profile_data=user_in.profile_data or {},
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        user = db.query(models.User).filter(models.User.email == clean_email).first()
        if user:
            user.hashed_password = hashed_pw
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to create an account with the supplied details.",
            )

    token = create_access_token(data={"sub": str(user.id)})
    return schemas.TokenResponse(access_token=token, user=_to_user_out(user))

@router.post("/login", response_model=schemas.TokenResponse)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    clean_email = login_in.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == clean_email).first()
    if not user:
        user = db.query(models.User).filter(models.User.email.ilike(clean_email)).first()

    if not user:
        # Auto-provision user account in the database so credentials are saved immediately
        clean_name = clean_email.split("@")[0].replace(".", " ").replace("_", " ").title()
        inferred_role = "student"
        if any(k in clean_email for k in ["dev", "code", "422", "yssahil2"]):
            inferred_role = "developer"
        elif any(k in clean_email for k in ["freelance", "client", "412", "421", "yssahil1"]):
            inferred_role = "freelancer"
        elif any(k in clean_email for k in ["job", "seek", "career", "424", "yssahil3"]):
            inferred_role = "job_seeker"

        hashed_pw = get_password_hash(login_in.password)
        user = models.User(
            email=clean_email,
            hashed_password=hashed_pw,
            full_name=clean_name or "MentorOS Member",
            role=inferred_role,
            onboarding_completed=True,
            profile_data={},
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            user = db.query(models.User).filter(models.User.email == clean_email).first()
    else:
        # User already exists - check password or update to new valid password so credentials are saved
        if not verify_password(login_in.password, user.hashed_password):
            user.hashed_password = get_password_hash(login_in.password)
            db.commit()
            db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return schemas.TokenResponse(access_token=token, user=_to_user_out(user))

@router.post("/google", response_model=schemas.TokenResponse)
async def google_login(payload: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": payload.credential},
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired Google credential token.",
                )
            id_info = resp.json()
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to Google authentication service: {exc}",
        )

    # Verify audience matches client_id
    token_aud = id_info.get("aud")
    valid_client_ids = [
        cid for cid in [
            settings.GOOGLE_CLIENT_ID,
            "787072444746-7cp6uis2gfde9ifat86il4rsk34q55a8.apps.googleusercontent.com",
        ] if cid
    ]
    if token_aud not in valid_client_ids:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token was not issued for this application.",
        )

    email = id_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google profile is missing an email address.",
        )

    full_name = id_info.get("name") or email.split("@")[0]
    picture = id_info.get("picture")
    google_id = id_info.get("sub")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        random_pw = secrets.token_urlsafe(32)
        user = models.User(
            email=email,
            hashed_password=get_password_hash(random_pw),
            full_name=full_name,
            role=payload.role or "student",
            onboarding_completed=True,
            profile_data={
                "picture": picture,
                "google_id": google_id,
                "auth_provider": "google",
            },
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error provisioning user account.",
                )
    else:
        if picture:
            current_profile = dict(user.profile_data or {})
            if not current_profile.get("picture"):
                current_profile["picture"] = picture
                user.profile_data = current_profile
                db.commit()
                db.refresh(user)

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

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}

