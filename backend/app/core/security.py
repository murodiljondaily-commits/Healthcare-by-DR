"""Security helpers: password hashing and JWT creation/verification.

We use bcrypt directly (the `bcrypt` package) rather than passlib to avoid
version-compatibility warnings between passlib and bcrypt >= 4/5.
"""

from __future__ import annotations

import datetime as dt
import secrets
from typing import Any, Dict, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# bcrypt has a hard 72-byte limit on the password input.
_BCRYPT_MAX_BYTES = 72


def _truncate(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(_truncate(password), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_truncate(password), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def hash_token(raw: str) -> str:
    """Hash refresh tokens / OTP codes before storing them."""
    return bcrypt.hashpw(_truncate(raw), bcrypt.gensalt(rounds=10)).decode("utf-8")


def verify_token_hash(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_truncate(raw), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def create_access_token(subject: str, extra: Optional[Dict[str, Any]] = None) -> str:
    expire = _now() + dt.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "type": "access",
        "iat": int(_now().timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_ACCESS_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> tuple[str, str, dt.datetime]:
    """Return (jwt, jti, expires_at). The jti is stored hashed server-side."""
    jti = secrets.token_urlsafe(32)
    expire = _now() + dt.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
        "iat": int(_now().timestamp()),
        "exp": int(expire.timestamp()),
    }
    token = jwt.encode(payload, settings.JWT_REFRESH_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expire


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(
            token, settings.JWT_ACCESS_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(
            token, settings.JWT_REFRESH_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP code as a zero-padded string."""
    upper = 10 ** length
    return str(secrets.randbelow(upper)).zfill(length)
