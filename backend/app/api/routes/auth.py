"""Authentication & account routes."""

from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.i18n import t
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_otp,
    hash_password,
    hash_token,
    verify_password,
    verify_token_hash,
)
from app.db.session import get_db
from app.models import OtpCode, RefreshToken, User, utcnow
from app.schemas import (
    AuthResult,
    ChangePasswordIn,
    LoginIn,
    RefreshIn,
    RegisterIn,
    ResendOtpIn,
    TokenPair,
    UserOut,
    UserUpdateIn,
    VerifyOtpIn,
)
from app.services.email import send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _make_avatar(name: str) -> str:
    parts = [p for p in name.split() if p]
    return "".join(p[0].upper() for p in parts[:2]) or "MS"


def _issue_tokens(db: Session, user: User) -> TokenPair:
    access = create_access_token(str(user.id), {"role": user.role})
    refresh, jti, expires = create_refresh_token(str(user.id))
    db.add(
        RefreshToken(
            user_id=user.id,
            jti=jti,
            token_hash=hash_token(refresh),
            expires_at=expires,
        )
    )
    db.commit()
    return TokenPair(access_token=access, refresh_token=refresh)


def _create_otp(db: Session, user: User, locale: str) -> str | None:
    """Create + store an OTP, attempt to email it. Returns dev_otp if demo."""
    code = generate_otp(settings.OTP_LENGTH)
    # Invalidate previous unconsumed codes.
    for old in db.scalars(
        select(OtpCode).where(OtpCode.user_id == user.id, OtpCode.consumed_at.is_(None))
    ):
        old.consumed_at = utcnow()
    db.add(
        OtpCode(
            user_id=user.id,
            code_hash=hash_token(code),
            purpose="verify_email",
            expires_at=utcnow() + dt.timedelta(minutes=settings.OTP_TTL_MINUTES),
        )
    )
    db.commit()
    delivered = send_otp_email(user.email, code, locale)
    return None if delivered else code


@router.post("/register", response_model=AuthResult)
def register(body: RegisterIn, db: Session = Depends(get_db)) -> AuthResult:
    existing = db.scalar(select(User).where(User.email == body.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail=t(body.locale, "email_taken"))

    user = User(
        name=body.name.strip(),
        email=body.email.lower(),
        phone=body.phone,
        password_hash=hash_password(body.password),
        role=body.role,
        gender=body.gender,
        birth_date=body.birth_date,
        locale=body.locale,
        avatar=_make_avatar(body.name),
    )
    if body.role == "doctor":
        user.specialty = "Terapevt"
        user.rating = 5.0

    if not settings.REQUIRE_EMAIL_VERIFICATION:
        user.email_verified_at = utcnow()

    db.add(user)
    db.commit()
    db.refresh(user)

    if settings.REQUIRE_EMAIL_VERIFICATION:
        dev_otp = _create_otp(db, user, body.locale)
        return AuthResult(
            user=UserOut.model_validate(user),
            requires_verification=True,
            dev_otp=dev_otp,
            message=t(body.locale, "otp_sent"),
        )

    tokens = _issue_tokens(db, user)
    return AuthResult(
        user=UserOut.model_validate(user),
        tokens=tokens,
        message=t(body.locale, "registered"),
    )


@router.post("/verify-email", response_model=AuthResult)
def verify_email(body: VerifyOtpIn, db: Session = Depends(get_db)) -> AuthResult:
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user:
        raise HTTPException(status_code=404, detail=t("uz", "user_not_found"))

    otp = db.scalar(
        select(OtpCode)
        .where(OtpCode.user_id == user.id, OtpCode.consumed_at.is_(None))
        .order_by(OtpCode.created_at.desc())
    )
    locale = user.locale
    if not otp:
        raise HTTPException(status_code=400, detail=t(locale, "otp_invalid"))
    if otp.attempts >= 5:
        raise HTTPException(status_code=429, detail=t(locale, "otp_too_many"))

    expires = otp.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=dt.timezone.utc)
    if expires < utcnow():
        raise HTTPException(status_code=400, detail=t(locale, "otp_invalid"))

    if not verify_token_hash(body.code, otp.code_hash):
        otp.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail=t(locale, "otp_invalid"))

    otp.consumed_at = utcnow()
    user.email_verified_at = utcnow()
    db.commit()
    db.refresh(user)

    tokens = _issue_tokens(db, user)
    return AuthResult(
        user=UserOut.model_validate(user), tokens=tokens, message=t(locale, "verified")
    )


@router.post("/resend-otp", response_model=AuthResult)
def resend_otp(body: ResendOtpIn, db: Session = Depends(get_db)) -> AuthResult:
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user:
        raise HTTPException(status_code=404, detail=t("uz", "user_not_found"))
    dev_otp = _create_otp(db, user, user.locale)
    return AuthResult(
        user=UserOut.model_validate(user),
        requires_verification=True,
        dev_otp=dev_otp,
        message=t(user.locale, "otp_sent"),
    )


@router.post("/login", response_model=AuthResult)
def login(body: LoginIn, db: Session = Depends(get_db)) -> AuthResult:
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail=t("uz", "invalid_credentials"))

    if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
        dev_otp = _create_otp(db, user, user.locale)
        return AuthResult(
            user=UserOut.model_validate(user),
            requires_verification=True,
            dev_otp=dev_otp,
            message=t(user.locale, "email_not_verified"),
        )

    tokens = _issue_tokens(db, user)
    return AuthResult(
        user=UserOut.model_validate(user), tokens=tokens, message=t(user.locale, "logged_in")
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(body: RefreshIn, db: Session = Depends(get_db)) -> TokenPair:
    payload = decode_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail=t("uz", "invalid_token"))

    jti = payload.get("jti", "")
    stored = db.scalar(select(RefreshToken).where(RefreshToken.jti == jti))
    if not stored or stored.revoked_at is not None:
        raise HTTPException(status_code=401, detail=t("uz", "invalid_token"))
    if not verify_token_hash(body.refresh_token, stored.token_hash):
        raise HTTPException(status_code=401, detail=t("uz", "invalid_token"))

    expires = stored.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=dt.timezone.utc)
    if expires < utcnow():
        raise HTTPException(status_code=401, detail=t("uz", "invalid_token"))

    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail=t("uz", "invalid_token"))

    # Rotate: revoke old, issue new.
    stored.revoked_at = utcnow()
    db.commit()
    return _issue_tokens(db, user)


@router.post("/logout")
def logout(body: RefreshIn, db: Session = Depends(get_db)) -> dict:
    payload = decode_refresh_token(body.refresh_token)
    if payload:
        stored = db.scalar(select(RefreshToken).where(RefreshToken.jti == payload.get("jti", "")))
        if stored and stored.revoked_at is None:
            stored.revoked_at = utcnow()
            db.commit()
    return {"ok": True, "message": t("uz", "logged_out")}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    body: UserUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    data = body.model_dump(exclude_none=True)
    for field, value in data.items():
        setattr(user, field, value)
    if "name" in data:
        user.avatar = _make_avatar(user.name)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/change-password")
def change_password(
    body: ChangePasswordIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail=t(user.locale, "wrong_password"))
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True, "message": t(user.locale, "password_changed")}
