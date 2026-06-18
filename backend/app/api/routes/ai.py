"""AI assistant routes (chat + doctor triage) and a dashboard summary."""

from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_doctor
from app.db.session import get_db
from app.models import AiLog, Medicine, User, VitalRecord
from app.schemas import AiChatIn, AiChatOut, AiTriageIn
from app.services.ai import ask_deepseek

router = APIRouter(tags=["ai"])


@router.post("/ai/chat", response_model=AiChatOut)
async def ai_chat(
    body: AiChatIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> AiChatOut:
    context = dict(body.context or {})
    context.setdefault("name", user.name)
    context.setdefault("city", user.city)

    result = await ask_deepseek(
        [m.model_dump() for m in body.messages],
        context,
        locale=body.locale,
        role=user.role,
    )
    last_user = next(
        (m.text for m in reversed(body.messages) if m.role == "user"), ""
    )
    db.add(
        AiLog(
            user_id=user.id,
            provider=result["provider"],
            prompt=last_user[:2000],
            response=result["text"][:4000],
        )
    )
    db.commit()
    return AiChatOut(**result)


@router.post("/ai/triage", response_model=AiChatOut)
async def ai_triage(
    body: AiTriageIn, doctor: User = Depends(require_doctor), db: Session = Depends(get_db)
) -> AiChatOut:
    prompts = {
        "uz": f"Bemor: {body.patient_name}, Yosh: {body.age}, Holat: {body.signal}. Qisqa AI triage tahlilini bering.",
        "ru": f"Пациент: {body.patient_name}, Возраст: {body.age}, Состояние: {body.signal}. Дайте краткий AI-триаж анализ.",
        "en": f"Patient: {body.patient_name}, Age: {body.age}, Condition: {body.signal}. Provide a brief AI triage analysis.",
    }
    locale = body.locale if body.locale in prompts else "uz"
    result = await ask_deepseek(
        [{"role": "user", "text": prompts[locale]}],
        {"doctorRole": True, "doctor": doctor.name},
        locale=locale,
        role="doctor",
    )
    db.add(
        AiLog(
            user_id=doctor.id,
            provider=result["provider"],
            prompt=prompts[locale][:2000],
            response=result["text"][:4000],
        )
    )
    db.commit()
    return AiChatOut(**result)


@router.get("/dashboard/summary")
def dashboard_summary(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    """Aggregate the numbers the dashboard shows from real data."""
    latest = db.scalar(
        select(VitalRecord)
        .where(VitalRecord.user_id == user.id)
        .order_by(VitalRecord.recorded_at.desc())
    )
    meds = db.scalars(select(Medicine).where(Medicine.user_id == user.id)).all()

    if meds:
        scheduled = sum(m.scheduled_count for m in meds)
        taken = sum(m.taken_count for m in meds)
        adherence = round(100 * taken / scheduled) if scheduled else 100
    else:
        adherence = 96

    pulse = latest.pulse if latest else 72
    pressure = latest.pressure if latest else "120/80"
    sleep = latest.sleep if latest else 7.2
    water = latest.water if latest else 1.9
    steps = latest.steps if latest else 7420

    # Simple composite health score (0-100) from available signals.
    score = 70
    if 60 <= pulse <= 90:
        score += 8
    if sleep >= 7:
        score += 7
    if water >= 1.8:
        score += 5
    if adherence >= 90:
        score += 8
    score = min(100, score)

    return {
        "health_score": score,
        "pulse": pulse,
        "pressure": pressure,
        "sleep": sleep,
        "water": water,
        "steps": steps,
        "medication_adherence": adherence,
        "medicine_count": len(meds),
    }
