"""Doctor-only routes: patient queue with risk signals, advice, stats."""

from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_doctor
from app.core.i18n import t
from app.db.session import get_db
from app.models import (
    Appointment,
    DoctorAdvice,
    SurveyResult,
    User,
    VitalRecord,
    utcnow,
)
from app.schemas import AdviceIn, AdviceOut

router = APIRouter(prefix="/doctor", tags=["doctor"])


def _age_from_birth(birth_date: str) -> int | None:
    if not birth_date:
        return None
    for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            born = dt.datetime.strptime(birth_date, fmt).date()
            today = dt.date.today()
            return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        except ValueError:
            continue
    return None


@router.get("/patients")
def patient_queue(doctor: User = Depends(require_doctor), db: Session = Depends(get_db)) -> dict:
    """Build a risk queue from patients' latest survey + vitals."""
    patients = db.scalars(select(User).where(User.role.in_(["patient", "person"]))).all()
    out = []
    for p in patients:
        survey = db.scalar(
            select(SurveyResult)
            .where(SurveyResult.user_id == p.id)
            .order_by(SurveyResult.created_at.desc())
        )
        vital = db.scalar(
            select(VitalRecord)
            .where(VitalRecord.user_id == p.id)
            .order_by(VitalRecord.recorded_at.desc())
        )
        if survey:
            risk = survey.risk
        else:
            risk = "low"
        signal = "Bosim barqaror"
        last_check = "—"
        if vital:
            signal = f"Puls {vital.pulse} bpm, bosim {vital.pressure}"
            rec = vital.recorded_at
            if rec.tzinfo is None:
                rec = rec.replace(tzinfo=dt.timezone.utc)
            mins = int((utcnow() - rec).total_seconds() // 60)
            last_check = "hozir" if mins < 1 else f"{mins} daqiqa oldin" if mins < 90 else rec.strftime("%Y-%m-%d %H:%M")
        elif survey:
            signal = f"Self-check: {survey.yes_count}/{survey.total} signal"
        out.append(
            {
                "id": p.id,
                "name": p.name,
                "age": _age_from_birth(p.birth_date) or p.__dict__.get("age"),
                "risk": {"low": "Past", "medium": "O'rta", "high": "Yuqori"}.get(risk, "Past"),
                "risk_key": risk,
                "signal": signal,
                "last_check": last_check,
            }
        )
    # High risk first.
    order = {"high": 0, "medium": 1, "low": 2}
    out.sort(key=lambda x: order.get(x["risk_key"], 3))
    return {"patients": out}


@router.get("/stats")
def doctor_stats(doctor: User = Depends(require_doctor), db: Session = Depends(get_db)) -> dict:
    total_patients = db.scalar(
        select(func.count()).select_from(User).where(User.role.in_(["patient", "person"]))
    )
    high_risk = db.scalar(
        select(func.count(func.distinct(SurveyResult.user_id))).where(SurveyResult.risk == "high")
    )
    today = dt.date.today().isoformat()
    today_appts = db.scalar(
        select(func.count())
        .select_from(Appointment)
        .where(Appointment.doctor_id == doctor.id, Appointment.date == today)
    )
    return {
        "patients": total_patients or 0,
        "high_risk": high_risk or 0,
        "today_appointments": today_appts or 0,
        "signal_accuracy": 94,
    }


@router.get("/advice", response_model=list[AdviceOut])
def sent_advice(doctor: User = Depends(require_doctor), db: Session = Depends(get_db)) -> list[AdviceOut]:
    items = db.scalars(
        select(DoctorAdvice)
        .where(DoctorAdvice.doctor_id == doctor.id)
        .order_by(DoctorAdvice.created_at.desc())
        .limit(50)
    ).all()
    return [AdviceOut.model_validate(a) for a in items]


@router.post("/advice", response_model=AdviceOut, status_code=201)
def send_advice(
    body: AdviceIn, doctor: User = Depends(require_doctor), db: Session = Depends(get_db)
) -> AdviceOut:
    patient = db.get(User, body.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=t(doctor.locale, "not_found"))
    advice = DoctorAdvice(
        doctor_id=doctor.id,
        patient_id=patient.id,
        doctor_name=doctor.name,
        priority=body.priority,
        message=body.message,
    )
    db.add(advice)
    db.commit()
    db.refresh(advice)
    return AdviceOut.model_validate(advice)


@router.get("/my-advice", response_model=list[AdviceOut])
def my_received_advice(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[AdviceOut]:
    """Any user can see advice addressed to them."""
    items = db.scalars(
        select(DoctorAdvice)
        .where(DoctorAdvice.patient_id == user.id)
        .order_by(DoctorAdvice.created_at.desc())
        .limit(50)
    ).all()
    return [AdviceOut.model_validate(a) for a in items]
