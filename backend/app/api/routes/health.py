"""Health tracking routes: vitals, meals, survey self-check, mental screening."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import MealRecord, MentalResult, SurveyResult, User, VitalRecord
from app.schemas import (
    MealIn,
    MealOut,
    MentalIn,
    MentalOut,
    SurveyIn,
    SurveyOut,
    VitalIn,
    VitalOut,
)

router = APIRouter(tags=["health"])


# ----------------------------- Vitals ---------------------------------------
@router.get("/vitals", response_model=list[VitalOut])
def list_vitals(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[VitalOut]:
    items = db.scalars(
        select(VitalRecord)
        .where(VitalRecord.user_id == user.id)
        .order_by(VitalRecord.recorded_at.desc())
        .limit(30)
    ).all()
    return [VitalOut.model_validate(v) for v in reversed(items)]


@router.post("/vitals", response_model=VitalOut, status_code=201)
def add_vital(
    body: VitalIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> VitalOut:
    rec = VitalRecord(user_id=user.id, **body.model_dump())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return VitalOut.model_validate(rec)


# ----------------------------- Meals ----------------------------------------
@router.get("/meals", response_model=list[MealOut])
def list_meals(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[MealOut]:
    items = db.scalars(
        select(MealRecord)
        .where(MealRecord.user_id == user.id)
        .order_by(MealRecord.recorded_at.desc())
        .limit(50)
    ).all()
    return [MealOut.model_validate(m) for m in items]


@router.post("/meals", response_model=MealOut, status_code=201)
def add_meal(
    body: MealIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> MealOut:
    rec = MealRecord(user_id=user.id, **body.model_dump())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return MealOut.model_validate(rec)


@router.delete("/meals/{meal_id}")
def delete_meal(
    meal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    rec = db.get(MealRecord, meal_id)
    if rec and rec.user_id == user.id:
        db.delete(rec)
        db.commit()
    return {"ok": True}


# ----------------------------- Survey ---------------------------------------
@router.get("/survey", response_model=list[SurveyOut])
def list_survey(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[SurveyOut]:
    items = db.scalars(
        select(SurveyResult)
        .where(SurveyResult.user_id == user.id)
        .order_by(SurveyResult.created_at.desc())
        .limit(20)
    ).all()
    return [SurveyOut.model_validate(s) for s in items]


@router.post("/survey", response_model=SurveyOut, status_code=201)
def submit_survey(
    body: SurveyIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> SurveyOut:
    yes_count = sum(1 for a in body.answers if a)
    total = len(body.answers)
    risk = "low" if yes_count <= 1 else "medium" if yes_count <= 3 else "high"
    rec = SurveyResult(
        user_id=user.id,
        yes_count=yes_count,
        total=total,
        risk=risk,
        answers_json=json.dumps(body.answers),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return SurveyOut.model_validate(rec)


# ----------------------------- Mental ---------------------------------------
@router.get("/mental", response_model=list[MentalOut])
def list_mental(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[MentalOut]:
    items = db.scalars(
        select(MentalResult)
        .where(MentalResult.user_id == user.id)
        .order_by(MentalResult.created_at.desc())
        .limit(20)
    ).all()
    return [MentalOut.model_validate(m) for m in items]


@router.post("/mental", response_model=MentalOut, status_code=201)
def submit_mental(
    body: MentalIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> MentalOut:
    level = "low" if body.score <= 1 else "medium" if body.score <= 3 else "high"
    rec = MentalResult(user_id=user.id, test_id=body.test_id, score=body.score, level=level)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return MentalOut.model_validate(rec)
