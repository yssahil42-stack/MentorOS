import datetime
import secrets
import httpx
from jose import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..database import get_db
from ..config import settings
from .. import models, schemas
from ..auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    oauth2_scheme,
)

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

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    hashed_pw = get_password_hash(user_in.password)
    user = models.User(
        email=clean_email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name or "MentorOS Member",
        role=user_in.role or "student",
        onboarding_completed=True,
        profile_data=user_in.profile_data or {},
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(login_in.password, user.hashed_password):
        if (user.profile_data or {}).get("auth_provider") == "google":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account was registered using Google Sign-In. Please sign in using the 'Continue with Google' button.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

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

    # Verify audience matches client_id if configured
    token_aud = id_info.get("aud")
    if settings.GOOGLE_CLIENT_ID and token_aud != settings.GOOGLE_CLIENT_ID:
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

    email_verified = id_info.get("email_verified")
    if str(email_verified).lower() not in ("true", "1"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified.",
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
def logout(
    token: str = Depends(oauth2_scheme),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            expires_at = datetime.datetime.utcfromtimestamp(exp_timestamp)
        else:
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        if jti:
            existing = db.query(models.RevokedToken).filter(models.RevokedToken.jti == jti).first()
            if not existing:
                revoked = models.RevokedToken(
                    jti=jti,
                    user_id=current_user.id,
                    expires_at=expires_at,
                )
                db.add(revoked)
                db.commit()
    except Exception:
        db.rollback()

    return {"message": "Logged out successfully"}


@router.post("/set-password")
def set_password(
    payload: schemas.SetPasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.hashed_password = get_password_hash(payload.new_password)
    profile = dict(current_user.profile_data or {})
    profile["has_password"] = True
    current_user.profile_data = profile
    db.commit()
    db.refresh(current_user)
    return {"message": "Password updated successfully. You can now sign in using your email and password."}


RESET_TOKEN_EXPIRE_MINUTES = 15


@router.post("/forgot-password")
def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    clean_email = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == clean_email).first()
    if not user:
        user = db.query(models.User).filter(models.User.email.ilike(clean_email)).first()

    response = {
        "message": "If an account exists with this email, a password reset link has been generated.",
        "email": clean_email,
    }

    if user:
        now = datetime.datetime.utcnow()
        expire = now + datetime.timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "purpose": "password_reset",
            "iat": now,
            "exp": expire,
        }
        reset_token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        response["reset_token"] = reset_token
        response["reset_url"] = f"/reset-password?token={reset_token}"

    return response


@router.post("/verify-reset-token")
def verify_reset_token(
    payload: schemas.VerifyResetTokenRequest,
    db: Session = Depends(get_db),
):
    try:
        decoded = jwt.decode(payload.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link has expired. Please request a new one.",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupt password reset link.",
        )

    if decoded.get("purpose") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token purpose.",
        )

    user_id = decoded.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    return {
        "valid": True,
        "email": user.email,
        "full_name": user.full_name,
    }


@router.post("/reset-password")
def reset_password(
    payload: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        decoded = jwt.decode(payload.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link has expired. Please request a new one.",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupt password reset link.",
        )

    if decoded.get("purpose") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token purpose.",
        )

    user_id = decoded.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    user.hashed_password = get_password_hash(payload.new_password)
    profile = dict(user.profile_data or {})
    profile["has_password"] = True
    user.profile_data = profile

    db.commit()
    db.refresh(user)

    return {
        "message": "Password has been successfully reset. You can now sign in with your new password.",
        "email": user.email,
    }



