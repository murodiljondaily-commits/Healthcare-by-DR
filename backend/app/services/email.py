"""Email delivery service.

If SMTP credentials are configured, OTP codes are sent through Gmail (or any
SMTP server). If not, the service runs in "demo" mode: it logs the code to the
console and the API returns it in the response so the flow is testable without
a real mailbox.
"""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("mediself.email")


def _build_message(to_email: str, code: str, locale: str) -> EmailMessage:
    subjects = {
        "uz": "MediSelf — tasdiqlash kodi",
        "ru": "MediSelf — код подтверждения",
        "en": "MediSelf — verification code",
    }
    bodies = {
        "uz": f"Sizning MediSelf tasdiqlash kodingiz: {code}\n\nKod {settings.OTP_TTL_MINUTES} daqiqa amal qiladi.",
        "ru": f"Ваш код подтверждения MediSelf: {code}\n\nКод действует {settings.OTP_TTL_MINUTES} минут.",
        "en": f"Your MediSelf verification code: {code}\n\nThe code is valid for {settings.OTP_TTL_MINUTES} minutes.",
    }
    msg = EmailMessage()
    msg["Subject"] = subjects.get(locale, subjects["uz"])
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg.set_content(bodies.get(locale, bodies["uz"]))
    return msg


def send_otp_email(to_email: str, code: str, locale: str = "uz") -> bool:
    """Send an OTP. Returns True if delivered via SMTP, False if demo/logged."""
    if not settings.smtp_enabled:
        logger.warning("[DEMO OTP] %s -> %s (SMTP not configured)", to_email, code)
        return False

    try:
        msg = _build_message(to_email, code, locale)
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls(context=context)
            server.login(settings.SMTP_USER, settings.SMTP_APP_PASSWORD)
            server.send_message(msg)
        logger.info("OTP email sent to %s", to_email)
        return True
    except Exception as exc:  # pragma: no cover - network dependent
        logger.error("Failed to send OTP email to %s: %s", to_email, exc)
        # Fall back to demo behavior so registration is not blocked.
        logger.warning("[DEMO OTP fallback] %s -> %s", to_email, code)
        return False
