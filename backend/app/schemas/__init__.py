"""Pydantic v2 schemas for request validation and response serialization."""

from __future__ import annotations

import datetime as dt
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Role = Literal["patient", "doctor", "person"]
Locale = Literal["uz", "ru", "en"]


# ----------------------------- Auth -----------------------------------------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    password: str = Field(min_length=6, max_length=128)
    gender: str = Field(default="", max_length=20)
    birth_date: str = Field(default="", max_length=20)
    role: Role = "patient"
    locale: Locale = "uz"


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class VerifyOtpIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)


class ResendOtpIn(BaseModel):
    email: EmailStr


class RefreshIn(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    phone: str
    role: Role
    city: str
    gender: str
    birth_date: str
    plan: str
    avatar: str
    locale: Locale
    specialty: str
    rating: float
    is_verified: bool


class AuthResult(BaseModel):
    user: UserOut
    tokens: Optional[TokenPair] = None
    requires_verification: bool = False
    # For demo mode where SMTP is not configured, the OTP is returned so the
    # user can complete the flow without a real mailbox.
    dev_otp: Optional[str] = None
    message: str = ""


class UserUpdateIn(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=40)
    city: Optional[str] = Field(default=None, max_length=80)
    role: Optional[Role] = None
    locale: Optional[Locale] = None
    specialty: Optional[str] = Field(default=None, max_length=80)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6, max_length=128)


# --------------------------- Medicine ---------------------------------------
class MedicineIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    dose: str = Field(default="1 tabletka", max_length=80)
    time: str = Field(default="08:00", max_length=10)
    stock: int = Field(default=30, ge=0, le=100000)


class MedicineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    dose: str
    time: str
    stock: int
    adherence: int
    active: bool


# --------------------------- Appointment ------------------------------------
class AppointmentIn(BaseModel):
    doctor_id: Optional[int] = None
    doctor_name: str = Field(default="", max_length=120)
    specialty: str = Field(default="Umumiy qabul", max_length=80)
    date: str = Field(min_length=1, max_length=20)
    time: str = Field(min_length=1, max_length=10)
    reason: str = Field(default="", max_length=2000)


class AppointmentStatusIn(BaseModel):
    status: Literal["pending", "confirmed", "cancelled", "done"]


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: Optional[int]
    patient_name: str
    doctor_name: str
    specialty: str
    date: str
    time: str
    reason: str
    status: str
    created_at: dt.datetime


# --------------------------- Vitals -----------------------------------------
class VitalIn(BaseModel):
    pulse: int = Field(default=72, ge=20, le=260)
    pressure: str = Field(default="120/80", max_length=20)
    sleep: float = Field(default=7.0, ge=0, le=24)
    water: float = Field(default=1.8, ge=0, le=20)
    steps: int = Field(default=0, ge=0, le=200000)


class VitalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pulse: int
    pressure: str
    sleep: float
    water: float
    steps: int
    recorded_at: dt.datetime


# --------------------------- Meals ------------------------------------------
class MealIn(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    menu: str = Field(default="", max_length=255)
    kcal: int = Field(default=0, ge=0, le=20000)
    protein: int = Field(default=0, ge=0, le=2000)
    carbs: int = Field(default=0, ge=0, le=2000)
    fat: int = Field(default=0, ge=0, le=2000)


class MealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    menu: str
    kcal: int
    protein: int
    carbs: int
    fat: int
    recorded_at: dt.datetime


# --------------------------- Survey -----------------------------------------
class SurveyIn(BaseModel):
    answers: List[bool] = Field(default_factory=list)

    @field_validator("answers")
    @classmethod
    def limit_answers(cls, v: List[bool]) -> List[bool]:
        return v[:20]


class SurveyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    yes_count: int
    total: int
    risk: str
    created_at: dt.datetime


# --------------------------- Mental -----------------------------------------
class MentalIn(BaseModel):
    test_id: Literal["phq2", "gad2"]
    score: int = Field(ge=0, le=24)


class MentalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    test_id: str
    score: int
    level: str
    created_at: dt.datetime


# --------------------------- Doctor advice ----------------------------------
class AdviceIn(BaseModel):
    patient_id: int
    priority: Literal["normal", "urgent", "prevention"] = "normal"
    message: str = Field(min_length=1, max_length=4000)


class AdviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    patient_id: int
    doctor_name: str
    priority: str
    message: str
    read_at: Optional[dt.datetime]
    created_at: dt.datetime


# --------------------------- Doctor patient view ----------------------------
class PatientSignalOut(BaseModel):
    id: int
    name: str
    age: Optional[int]
    risk: str
    signal: str
    last_check: str


# --------------------------- AI ---------------------------------------------
class AiMessage(BaseModel):
    role: str = "user"
    text: str = ""


class AiChatIn(BaseModel):
    messages: List[AiMessage] = Field(default_factory=list)
    context: dict = Field(default_factory=dict)
    locale: Locale = "uz"


class AiTriageIn(BaseModel):
    patient_id: Optional[int] = None
    patient_name: str = ""
    age: Optional[int] = None
    signal: str = ""
    locale: Locale = "uz"


class AiChatOut(BaseModel):
    provider: str
    text: str
