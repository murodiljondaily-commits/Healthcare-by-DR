"""Seed the database with demo accounts and history on first run.

Creates 4 doctors, 1 demo patient and 2 extra patients with vitals + survey
history so the doctor panel queue looks realistic. Idempotent: if the demo
patient already exists, seeding is skipped.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (
    Medicine,
    MealRecord,
    SurveyResult,
    User,
    VitalRecord,
    utcnow,
)

DEMO_PASSWORD = "mediself"


def _avatar(name: str) -> str:
    parts = [p for p in name.split() if p]
    return "".join(p[0].upper() for p in parts[:2]) or "MS"


DOCTORS = [
    ("Dr. Malika Usmonova", "malika@mediself.uz", "Kardiolog", 4.9),
    ("Dr. Aziz Tursunov", "aziz@mediself.uz", "Endokrinolog", 4.8),
    ("Dr. Dilshod Rahimov", "dilshod@mediself.uz", "Terapevt", 4.7),
    ("Dr. Sevara Karimova", "sevara@mediself.uz", "Psixolog", 4.9),
]


def seed(db: Session) -> None:
    existing = db.scalar(select(User).where(User.email == "sardor@mediself.uz"))
    if existing:
        return

    # Doctors
    for name, email, specialty, rating in DOCTORS:
        db.add(
            User(
                name=name,
                email=email,
                phone="+998 71 000 00 00",
                password_hash=hash_password(DEMO_PASSWORD),
                role="doctor",
                specialty=specialty,
                rating=rating,
                avatar=_avatar(name),
                email_verified_at=utcnow(),
            )
        )

    # Demo patient
    sardor = User(
        name="Sardor Karimov",
        email="sardor@mediself.uz",
        phone="+998 90 123 45 67",
        password_hash=hash_password(DEMO_PASSWORD),
        role="patient",
        city="Toshkent",
        gender="Erkak",
        birth_date="1996-04-12",
        avatar="SK",
        email_verified_at=utcnow(),
    )
    db.add(sardor)
    db.flush()

    # Medicines for Sardor
    meds = [
        ("Vitamin D3", "1 kapsula", "08:00", 24, 48, 50),
        ("Omega-3", "1 kapsula", "08:00", 18, 46, 50),
        ("Magniy B6", "1 tabletka", "21:30", 12, 44, 50),
    ]
    for name, dose, time, stock, taken, scheduled in meds:
        db.add(
            Medicine(
                user_id=sardor.id,
                name=name,
                dose=dose,
                time=time,
                stock=stock,
                taken_count=taken,
                scheduled_count=scheduled,
            )
        )

    # Vitals history (7 days)
    base = utcnow() - dt.timedelta(days=6)
    vitals = [
        (74, "121/80", 6.7, 1.5, 6200),
        (70, "119/79", 7.1, 1.8, 8500),
        (73, "122/81", 6.5, 1.4, 7100),
        (71, "118/78", 7.4, 2.1, 9400),
        (76, "123/82", 6.2, 1.7, 7420),
        (69, "117/77", 8.0, 2.0, 10800),
        (72, "120/80", 7.2, 1.9, 6800),
    ]
    for i, (pulse, pressure, sleep, water, steps) in enumerate(vitals):
        db.add(
            VitalRecord(
                user_id=sardor.id,
                pulse=pulse,
                pressure=pressure,
                sleep=sleep,
                water=water,
                steps=steps,
                recorded_at=base + dt.timedelta(days=i),
            )
        )

    # Meals
    meals = [
        ("Nonushta", "Tuxum, suli yormasi, ko'k choy", 420, 28, 40, 14),
        ("Tushlik", "Tovuq filesi, guruch, salat", 560, 42, 60, 16),
        ("Kechki ovqat", "Baliq, sabzavot, qatiq", 480, 36, 30, 18),
    ]
    for title, menu, kcal, protein, carbs, fat in meals:
        db.add(
            MealRecord(
                user_id=sardor.id,
                title=title,
                menu=menu,
                kcal=kcal,
                protein=protein,
                carbs=carbs,
                fat=fat,
            )
        )

    db.add(SurveyResult(user_id=sardor.id, yes_count=1, total=5, risk="low", answers_json="[true,false,false,false,false]"))

    # Two extra patients for the doctor queue
    madina = User(
        name="Madina Soliyeva",
        email="madina@mediself.uz",
        phone="+998 90 222 33 44",
        password_hash=hash_password(DEMO_PASSWORD),
        role="patient",
        birth_date="1991-09-03",
        avatar="MS",
        email_verified_at=utcnow(),
    )
    bekzod = User(
        name="Bekzod Aliyev",
        email="bekzod@mediself.uz",
        phone="+998 90 555 66 77",
        password_hash=hash_password(DEMO_PASSWORD),
        role="patient",
        birth_date="1984-12-19",
        avatar="BA",
        email_verified_at=utcnow(),
    )
    db.add_all([madina, bekzod])
    db.flush()

    db.add(VitalRecord(user_id=madina.id, pulse=84, pressure="128/86", sleep=5.5, water=1.1, steps=3200))
    db.add(SurveyResult(user_id=madina.id, yes_count=3, total=5, risk="medium", answers_json="[true,true,true,false,false]"))
    db.add(VitalRecord(user_id=bekzod.id, pulse=96, pressure="142/92", sleep=4.8, water=0.9, steps=1800))
    db.add(SurveyResult(user_id=bekzod.id, yes_count=4, total=5, risk="high", answers_json="[true,true,true,true,false]"))

    db.commit()
