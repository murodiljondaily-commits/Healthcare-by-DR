"""ORM models for MediSelf.

Domain entities:
- User (with 3 roles: patient, doctor, person)
- RefreshToken, OtpCode (auth)
- Medicine, MedicineLog (medication tracking & adherence)
- Appointment (booking between patient and doctor)
- VitalRecord (pulse, pressure, sleep, water, steps)
- MealRecord (calorie tracking)
- SurveyResult (daily self-check)
- MentalResult (PHQ-2 / GAD-2 screening)
- DoctorAdvice (doctor -> patient messages)
- AiLog (audit of AI requests)
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(40), default="")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="patient")  # patient|doctor|person
    city: Mapped[str] = mapped_column(String(80), default="Toshkent")
    gender: Mapped[str] = mapped_column(String(20), default="")
    birth_date: Mapped[str] = mapped_column(String(20), default="")
    plan: Mapped[str] = mapped_column(String(60), default="MediSelf Plus")
    avatar: Mapped[str] = mapped_column(String(8), default="")
    locale: Mapped[str] = mapped_column(String(5), default="uz")  # uz|ru|en
    # Doctor-specific fields
    specialty: Mapped[str] = mapped_column(String(80), default="")
    rating: Mapped[float] = mapped_column(Float, default=0.0)

    email_verified_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    medicines: Mapped[list["Medicine"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    vitals: Mapped[list["VitalRecord"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    meals: Mapped[list["MealRecord"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    @property
    def is_verified(self) -> bool:
        return self.email_verified_at is not None


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    jti: Mapped[str] = mapped_column(String(64), index=True)
    token_hash: Mapped[str] = mapped_column(String(255))
    expires_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    code_hash: Mapped[str] = mapped_column(String(255))
    purpose: Mapped[str] = mapped_column(String(30), default="verify_email")
    expires_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True))
    consumed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    dose: Mapped[str] = mapped_column(String(80), default="1 tabletka")
    time: Mapped[str] = mapped_column(String(10), default="08:00")
    stock: Mapped[int] = mapped_column(Integer, default=30)
    taken_count: Mapped[int] = mapped_column(Integer, default=0)
    scheduled_count: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="medicines")

    @property
    def adherence(self) -> int:
        if self.scheduled_count <= 0:
            return 100
        return round(100 * self.taken_count / self.scheduled_count)


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    patient_name: Mapped[str] = mapped_column(String(120))
    doctor_name: Mapped[str] = mapped_column(String(120), default="")
    specialty: Mapped[str] = mapped_column(String(80), default="Umumiy qabul")
    date: Mapped[str] = mapped_column(String(20))
    time: Mapped[str] = mapped_column(String(10))
    reason: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|confirmed|cancelled|done
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class VitalRecord(Base):
    __tablename__ = "vitals"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    pulse: Mapped[int] = mapped_column(Integer, default=72)
    pressure: Mapped[str] = mapped_column(String(20), default="120/80")
    sleep: Mapped[float] = mapped_column(Float, default=7.0)
    water: Mapped[float] = mapped_column(Float, default=1.8)
    steps: Mapped[int] = mapped_column(Integer, default=0)
    recorded_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="vitals")


class MealRecord(Base):
    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(80))
    menu: Mapped[str] = mapped_column(String(255), default="")
    kcal: Mapped[int] = mapped_column(Integer, default=0)
    protein: Mapped[int] = mapped_column(Integer, default=0)
    carbs: Mapped[int] = mapped_column(Integer, default=0)
    fat: Mapped[int] = mapped_column(Integer, default=0)
    recorded_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="meals")


class SurveyResult(Base):
    __tablename__ = "survey_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    yes_count: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer, default=0)
    risk: Mapped[str] = mapped_column(String(20), default="low")  # low|medium|high
    answers_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MentalResult(Base):
    __tablename__ = "mental_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    test_id: Mapped[str] = mapped_column(String(20))  # phq2|gad2
    score: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[str] = mapped_column(String(20), default="low")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class DoctorAdvice(Base):
    __tablename__ = "doctor_advice"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    doctor_name: Mapped[str] = mapped_column(String(120), default="")
    priority: Mapped[str] = mapped_column(String(20), default="normal")  # normal|urgent|prevention
    message: Mapped[str] = mapped_column(Text)
    read_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AiLog(Base):
    __tablename__ = "ai_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    provider: Mapped[str] = mapped_column(String(20), default="demo")
    prompt: Mapped[str] = mapped_column(Text, default="")
    response: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
