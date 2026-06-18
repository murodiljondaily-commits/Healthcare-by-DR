"""Appointment routes + doctor directory.

Patients create appointment requests; doctors see requests assigned to them
and can update status. A public-ish doctor directory lists all doctor users.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.i18n import t
from app.db.session import get_db
from app.models import Appointment, User
from app.schemas import (
    AppointmentIn,
    AppointmentOut,
    AppointmentStatusIn,
)

router = APIRouter(tags=["appointments"])


@router.get("/doctors")
def list_doctors(db: Session = Depends(get_db)) -> dict:
    doctors = db.scalars(select(User).where(User.role == "doctor")).all()
    return {
        "doctors": [
            {
                "id": d.id,
                "name": d.name,
                "specialty": d.specialty or "Terapevt",
                "rating": d.rating or 4.8,
                "status": "Online",
            }
            for d in doctors
        ]
    }


@router.get("/appointments", response_model=list[AppointmentOut])
def list_appointments(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[AppointmentOut]:
    if user.role == "doctor":
        stmt = select(Appointment).where(Appointment.doctor_id == user.id)
    else:
        stmt = select(Appointment).where(Appointment.patient_id == user.id)
    items = db.scalars(stmt.order_by(Appointment.created_at.desc())).all()
    return [AppointmentOut.model_validate(a) for a in items]


@router.post("/appointments", response_model=AppointmentOut, status_code=201)
def create_appointment(
    body: AppointmentIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> AppointmentOut:
    doctor_name = body.doctor_name
    specialty = body.specialty
    if body.doctor_id:
        doctor = db.get(User, body.doctor_id)
        if doctor and doctor.role == "doctor":
            doctor_name = doctor.name
            specialty = doctor.specialty or specialty

    appt = Appointment(
        patient_id=user.id,
        doctor_id=body.doctor_id,
        patient_name=user.name,
        doctor_name=doctor_name,
        specialty=specialty,
        date=body.date,
        time=body.time,
        reason=body.reason,
        status="pending",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return AppointmentOut.model_validate(appt)


@router.patch("/appointments/{appointment_id}", response_model=AppointmentOut)
def update_appointment_status(
    appointment_id: int,
    body: AppointmentStatusIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentOut:
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail=t(user.locale, "not_found"))
    # Only the assigned doctor or the owning patient can change status.
    if user.id not in {appt.patient_id, appt.doctor_id}:
        raise HTTPException(status_code=403, detail=t(user.locale, "not_authorized"))
    appt.status = body.status
    db.commit()
    db.refresh(appt)
    return AppointmentOut.model_validate(appt)


@router.delete("/appointments/{appointment_id}")
def cancel_appointment(
    appointment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    appt = db.get(Appointment, appointment_id)
    if not appt or appt.patient_id != user.id:
        raise HTTPException(status_code=404, detail=t(user.locale, "not_found"))
    appt.status = "cancelled"
    db.commit()
    return {"ok": True}
