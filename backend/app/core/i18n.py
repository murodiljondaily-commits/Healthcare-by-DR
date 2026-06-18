"""Backend-side localized messages (uz / ru / en).

The frontend handles UI translation, but API error/success messages are also
localized so they display correctly regardless of which language the user
picked. Use `t(locale, key)` to fetch a message.
"""

from __future__ import annotations

from typing import Dict

MESSAGES: Dict[str, Dict[str, str]] = {
    "uz": {
        "email_taken": "Bu email allaqachon ro'yxatdan o'tgan.",
        "invalid_credentials": "Email yoki parol noto'g'ri.",
        "user_not_found": "Foydalanuvchi topilmadi.",
        "otp_sent": "Tasdiqlash kodi yuborildi.",
        "otp_invalid": "Kod noto'g'ri yoki muddati tugagan.",
        "otp_too_many": "Juda ko'p urinish. Yangi kod so'rang.",
        "email_not_verified": "Email tasdiqlanmagan. Avval kodni kiriting.",
        "verified": "Email muvaffaqiyatli tasdiqlandi.",
        "registered": "Ro'yxatdan o'tish muvaffaqiyatli.",
        "logged_in": "Tizimga muvaffaqiyatli kirdingiz.",
        "logged_out": "Tizimdan chiqdingiz.",
        "invalid_token": "Token yaroqsiz yoki muddati tugagan.",
        "wrong_password": "Joriy parol noto'g'ri.",
        "password_changed": "Parol o'zgartirildi.",
        "not_authorized": "Ruxsat yo'q.",
        "doctor_only": "Bu amal faqat shifokorlar uchun.",
        "medicine_added": "Dori qo'shildi.",
        "medicine_deleted": "Dori o'chirildi.",
        "not_found": "Topilmadi.",
        "appointment_created": "Qabul so'rovi yuborildi.",
        "advice_sent": "Maslahat yuborildi.",
        "ai_unavailable": "AI xizmati hozir mavjud emas.",
    },
    "ru": {
        "email_taken": "Этот email уже зарегистрирован.",
        "invalid_credentials": "Неверный email или пароль.",
        "user_not_found": "Пользователь не найден.",
        "otp_sent": "Код подтверждения отправлен.",
        "otp_invalid": "Код неверный или срок истёк.",
        "otp_too_many": "Слишком много попыток. Запросите новый код.",
        "email_not_verified": "Email не подтверждён. Сначала введите код.",
        "verified": "Email успешно подтверждён.",
        "registered": "Регистрация прошла успешно.",
        "logged_in": "Вы успешно вошли в систему.",
        "logged_out": "Вы вышли из системы.",
        "invalid_token": "Токен недействителен или истёк.",
        "wrong_password": "Текущий пароль неверный.",
        "password_changed": "Пароль изменён.",
        "not_authorized": "Нет доступа.",
        "doctor_only": "Это действие только для врачей.",
        "medicine_added": "Лекарство добавлено.",
        "medicine_deleted": "Лекарство удалено.",
        "not_found": "Не найдено.",
        "appointment_created": "Запрос на приём отправлен.",
        "advice_sent": "Рекомендация отправлена.",
        "ai_unavailable": "AI-сервис сейчас недоступен.",
    },
    "en": {
        "email_taken": "This email is already registered.",
        "invalid_credentials": "Invalid email or password.",
        "user_not_found": "User not found.",
        "otp_sent": "Verification code sent.",
        "otp_invalid": "Code is invalid or expired.",
        "otp_too_many": "Too many attempts. Request a new code.",
        "email_not_verified": "Email not verified. Enter the code first.",
        "verified": "Email verified successfully.",
        "registered": "Registration successful.",
        "logged_in": "Signed in successfully.",
        "logged_out": "Signed out.",
        "invalid_token": "Token is invalid or expired.",
        "wrong_password": "Current password is incorrect.",
        "password_changed": "Password changed.",
        "not_authorized": "Not authorized.",
        "doctor_only": "This action is for doctors only.",
        "medicine_added": "Medicine added.",
        "medicine_deleted": "Medicine deleted.",
        "not_found": "Not found.",
        "appointment_created": "Appointment request sent.",
        "advice_sent": "Advice sent.",
        "ai_unavailable": "AI service is currently unavailable.",
    },
}


def t(locale: str, key: str) -> str:
    locale = locale if locale in MESSAGES else "uz"
    return MESSAGES[locale].get(key) or MESSAGES["uz"].get(key, key)
