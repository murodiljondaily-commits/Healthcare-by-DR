"""Application configuration loaded from environment variables.

All settings have safe defaults so the app runs out-of-the-box for local
development. For production, override them through a `.env` file or real
environment variables (see `.env.example`).
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

# Load .env if present (no hard dependency on python-dotenv being installed).
try:  # pragma: no cover - optional dependency
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover
    # Minimal manual .env loader as a fallback.
    _env_path = Path(__file__).resolve().parents[3] / ".env"
    if _env_path.exists():
        for _line in _env_path.read_text(encoding="utf-8").splitlines():
            _line = _line.strip()
            if not _line or _line.startswith("#") or "=" not in _line:
                continue
            _key, _, _val = _line.partition("=")
            os.environ.setdefault(_key.strip(), _val.strip())


BASE_DIR = Path(__file__).resolve().parents[2]  # .../backend


def _get_bool(key: str, default: bool) -> bool:
    raw = os.getenv(key)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _get_int(key: str, default: int) -> int:
    try:
        return int(os.getenv(key, str(default)))
    except (TypeError, ValueError):
        return default


def _get_list(key: str, default: List[str]) -> List[str]:
    raw = os.getenv(key)
    if not raw:
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    """Central settings object. Plain class to avoid extra dependencies."""

    # --- General ---
    APP_NAME: str = os.getenv("APP_NAME", "MediSelf")
    ENV: str = os.getenv("ENV", "production")
    DEBUG: bool = _get_bool("DEBUG", False)
    PORT: int = _get_int("PORT", 3000)

    # --- Database ---
    # Default: SQLite file living next to the backend package.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{(BASE_DIR / 'mediself.db').as_posix()}"
    )

    # --- Security / JWT ---
    JWT_ACCESS_SECRET: str = os.getenv(
        "JWT_ACCESS_SECRET", "change-me-access-secret-please-override-in-env"
    )
    JWT_REFRESH_SECRET: str = os.getenv(
        "JWT_REFRESH_SECRET", "change-me-refresh-secret-please-override-in-env"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = _get_int("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 12)
    REFRESH_TOKEN_EXPIRE_DAYS: int = _get_int("REFRESH_TOKEN_EXPIRE_DAYS", 30)

    # --- CORS ---
    # In production the SPA is served from the same origin, so "*" is fine for
    # the API; tighten if you split the domains.
    CORS_ORIGINS: List[str] = _get_list("CORS_ORIGINS", ["*"])

    # --- Email / OTP ---
    OTP_TTL_MINUTES: int = _get_int("OTP_TTL_MINUTES", 10)
    OTP_LENGTH: int = _get_int("OTP_LENGTH", 6)
    # When email is not required, registration immediately verifies the user.
    REQUIRE_EMAIL_VERIFICATION: bool = _get_bool("REQUIRE_EMAIL_VERIFICATION", False)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = _get_int("SMTP_PORT", 587)
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_APP_PASSWORD: str = os.getenv("SMTP_APP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@mediself.uz"))

    # --- AI (DeepSeek) ---
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_BASE_URL: str = os.getenv(
        "DEEPSEEK_BASE_URL", "https://api.deepseek.com/chat/completions"
    )
    AI_TIMEOUT_SECONDS: int = _get_int("AI_TIMEOUT_SECONDS", 40)

    # --- Static frontend ---
    # Path to the built SPA (dist). Resolved relative to repo root by default.
    FRONTEND_DIST: str = os.getenv(
        "FRONTEND_DIST", (BASE_DIR.parent / "frontend" / "dist").as_posix()
    )

    # --- Seed demo data on first run ---
    SEED_DEMO_DATA: bool = _get_bool("SEED_DEMO_DATA", True)

    @property
    def smtp_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.SMTP_USER and self.SMTP_APP_PASSWORD)

    @property
    def ai_enabled(self) -> bool:
        return bool(self.DEEPSEEK_API_KEY)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
