"""Medicine routes: list, add, take a dose, delete."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.i18n import t
from app.db.session import get_db
from app.models import Medicine, User
from app.schemas import MedicineIn, MedicineOut

router = APIRouter(prefix="/medicines", tags=["medicines"])


@router.get("", response_model=list[MedicineOut])
def list_medicines(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[MedicineOut]:
    items = db.scalars(
        select(Medicine).where(Medicine.user_id == user.id).order_by(Medicine.time)
    ).all()
    return [MedicineOut.model_validate(m) for m in items]


@router.post("", response_model=MedicineOut, status_code=201)
def add_medicine(
    body: MedicineIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> MedicineOut:
    med = Medicine(
        user_id=user.id,
        name=body.name.strip(),
        dose=body.dose,
        time=body.time,
        stock=body.stock,
        scheduled_count=0,
        taken_count=0,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return MedicineOut.model_validate(med)


@router.post("/{medicine_id}/take", response_model=MedicineOut)
def take_dose(
    medicine_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> MedicineOut:
    med = db.get(Medicine, medicine_id)
    if not med or med.user_id != user.id:
        raise HTTPException(status_code=404, detail=t(user.locale, "not_found"))
    med.scheduled_count += 1
    med.taken_count += 1
    if med.stock > 0:
        med.stock -= 1
    db.commit()
    db.refresh(med)
    return MedicineOut.model_validate(med)


@router.post("/{medicine_id}/skip", response_model=MedicineOut)
def skip_dose(
    medicine_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> MedicineOut:
    med = db.get(Medicine, medicine_id)
    if not med or med.user_id != user.id:
        raise HTTPException(status_code=404, detail=t(user.locale, "not_found"))
    med.scheduled_count += 1
    db.commit()
    db.refresh(med)
    return MedicineOut.model_validate(med)


@router.delete("/{medicine_id}")
def delete_medicine(
    medicine_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    med = db.get(Medicine, medicine_id)
    if not med or med.user_id != user.id:
        raise HTTPException(status_code=404, detail=t(user.locale, "not_found"))
    db.delete(med)
    db.commit()
    return {"ok": True, "message": t(user.locale, "medicine_deleted")}
