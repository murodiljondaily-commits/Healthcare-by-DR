"""AI assistant service - supports Groq, DeepSeek, and demo fallback."""

from __future__ import annotations

import logging
from typing import Dict, List

import httpx

from app.core.config import settings

logger = logging.getLogger("mediself.ai")

SYSTEM_PROMPTS = {
    "uz": (
        "Sen MediSelf tibbiy yordamchisisan. O'zbek tilida javob ber. "
        "Klinik jihatdan ehtiyotkor bo'l, tashxis qo'yma, triage bo'yicha yo'nalish ber, "
        "xavfli belgilar (keskin ko'krak og'rig'i, nafas qisishi, hushdan ketish, kuchli qon ketish) "
        "bo'lsa zudlik bilan shoshilinch yordamga murojaat qilishni tavsiya et va litsenziyali "
        "shifokorga ko'rinishni maslahat ber. Qisqa, aniq va amaliy javob ber."
    ),
    "ru": (
        "Ты — медицинский помощник MediSelf. Отвечай на русском языке. "
        "Будь клинически осторожен, не ставь диагноз, давай рекомендации по триажу, "
        "при тревожных симптомах (резкая боль в груди, одышка, потеря сознания, сильное кровотечение) "
        "советуй немедленно обратиться за экстренной помощью и рекомендуй посещение "
        "лицензированного врача. Отвечай кратко, ясно и практично."
    ),
    "en": (
        "You are the MediSelf medical assistant. Respond in English. "
        "Be clinically cautious, do not diagnose, provide triage guidance, "
        "recommend emergency care for red flags (severe chest pain, shortness of breath, "
        "fainting, heavy bleeding), and advise seeing a licensed doctor. "
        "Be concise, clear and practical."
    ),
}


def _fallback_text(messages: List[Dict], context: Dict, locale: str) -> str:
    last_user = ""
    for msg in reversed(messages):
        if (msg.get("role") or "user") == "user":
            last_user = (msg.get("text") or msg.get("content") or "").lower()
            break

    score = context.get("healthScore") or context.get("health_score")
    adherence = context.get("medicationAdherence") or context.get("medication_adherence")
    name = context.get("name") or ""

    red_flags = {
        "uz": ["og'riq", "nafas", "hushdan", "qon", "ko'krak"],
        "ru": ["боль", "дыхан", "сознани", "кров", "груд"],
        "en": ["pain", "breath", "faint", "bleed", "chest"],
    }
    emergency = {
        "uz": "Agar keskin ko'krak og'rig'i, nafas qisishi, hushdan ketish yoki kuchli qon ketish bo'lsa — zudlik bilan 103 raqamiga yoki shoshilinch yordamga murojaat qiling.",
        "ru": "Если есть резкая боль в груди, одышка, потеря сознания или сильное кровотечение — немедленно звоните 103 или обратитесь за экстренной помощью.",
        "en": "If you have severe chest pain, shortness of breath, fainting, or heavy bleeding — call emergency services immediately.",
    }

    has_flag = any(word in last_user for word in red_flags.get(locale, red_flags["uz"]))

    tips = {
        "uz": [
            "Bugun kamida 1.5–2 litr suv iching va uyqu 7 soatdan kam bo'lmasin.",
            "Dori jadvalingizni buzmang; vaqtida qabul qilish holatni barqaror saqlaydi.",
            "Yengil 20–30 daqiqalik yurish puls va kayfiyatni yaxshilaydi.",
        ],
        "ru": [
            "Сегодня выпейте не менее 1.5–2 литров воды и спите не менее 7 часов.",
            "Не нарушайте график приёма лекарств; своевременный приём стабилизирует состояние.",
            "Лёгкая прогулка 20–30 минут улучшает пульс и настроение.",
        ],
        "en": [
            "Drink at least 1.5–2 liters of water today and sleep no less than 7 hours.",
            "Keep your medication schedule; timely doses keep your condition stable.",
            "A light 20–30 minute walk improves your pulse and mood.",
        ],
    }

    lead = {
        "uz": f"{name + ', ' if name else ''}sizning so'rovingiz bo'yicha umumiy tavsiyalar:",
        "ru": f"{name + ', ' if name else ''}общие рекомендации по вашему запросу:",
        "en": f"{name + ', ' if name else ''}here are general recommendations for your request:",
    }
    score_line = {
        "uz": f" Joriy health score: {score}." if score else "",
        "ru": f" Текущий health score: {score}." if score else "",
        "en": f" Current health score: {score}." if score else "",
    }
    adherence_line = {
        "uz": f" Dori adherence: {adherence}%." if adherence else "",
        "ru": f" Приверженность лечению: {adherence}%." if adherence else "",
        "en": f" Medication adherence: {adherence}%." if adherence else "",
    }
    disclaimer = {
        "uz": "Eslatma: bu tibbiy tashxis emas. Aniq holat uchun shifokorga murojaat qiling.",
        "ru": "Примечание: это не медицинский диагноз. Для точной оценки обратитесь к врачу.",
        "en": "Note: this is not a medical diagnosis. See a doctor for an accurate assessment.",
    }

    parts = [lead[locale] + score_line[locale] + adherence_line[locale]]
    parts.extend(f"• {tip}" for tip in tips[locale])
    if has_flag:
        parts.append("⚠️ " + emergency[locale])
    parts.append(disclaimer[locale])
    return "\n".join(parts)


async def ask_deepseek(messages: List[Dict], context: Dict, locale: str = "uz", role: str = "patient") -> Dict:
    """Return {"provider": str, "text": str}."""
    locale = locale if locale in SYSTEM_PROMPTS else "uz"
    clean = [
        {
            "role": "assistant" if (m.get("role") == "assistant") else "user",
            "content": str(m.get("text") or m.get("content") or "")[:2500],
        }
        for m in messages[-10:]
    ]

    if not settings.ai_enabled:
        return {"provider": "demo", "text": _fallback_text(messages, context, locale)}

    # Combine system prompts into one (Groq only allows one system message)
    system_content = (
        SYSTEM_PROMPTS[locale] +
        f"\n\nUser role: {role}. Context: {str(context)[:1500]}"
    )

    payload = {
        "model": settings.DEEPSEEK_MODEL,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_content},
            *clean,
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            resp = await client.post(
                settings.DEEPSEEK_BASE_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                },
                json=payload,
            )
        if resp.status_code != 200:
            logger.error("AI error %s: %s", resp.status_code, resp.text[:300])
            return {"provider": "demo", "text": _fallback_text(messages, context, locale)}
        data = resp.json()
        text = (
            data.get("choices", [{}])[0].get("message", {}).get("content")
            or _fallback_text(messages, context, locale)
        )
        return {"provider": "groq", "text": text}
    except Exception as exc:
        logger.error("AI request failed: %s", exc)
        return {"provider": "demo", "text": _fallback_text(messages, context, locale)}
