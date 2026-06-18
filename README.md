# MediSelf 🩺

**MediSelf** — bemor, shifokor va oddiy foydalanuvchi uchun to‘liq tibbiy platforma.
Loyiha **FastAPI (Python)** backend va **React + Vite** frontend asosida qurilgan. Barcha
funksiyalar real ishlaydi: autentifikatsiya (email OTP), 3 xil rol, dori boshqaruvi,
shifokor–bemor oqimi, AI yordamchi (DeepSeek) va psixologik testlar.

Interfeys **3 tilda**: 🇺🇿 O‘zbekcha · 🇷🇺 Русский · 🇬🇧 English.

---

## ✨ Asosiy imkoniyatlar

- **Autentifikatsiya** — ro‘yxatdan o‘tish, email OTP tasdiqlash, JWT token (access + refresh), parol shifrlash (bcrypt).
- **3 rol** — Bemor, Shifokor, Profilaktika foydalanuvchisi. Har biriga moslangan panel.
- **Dori boshqaruvi** — qo‘shish, “qabul qildim”, qoldiq va adherence (rioya) hisobi.
- **Qabul (appointments)** — shifokor tanlash, online so‘rov, holat boshqaruvi (kutilmoqda → tasdiqlangan → yakunlangan).
- **Shifokor paneli** — bemor risk navbati (yuqori risk birinchi), statistika, AI triage tahlili, bemorga maslahat yuborish.
- **AI yordamchi** — DeepSeek orqali (kalit kiritilsa) yoki xavfsiz offline lokalizatsiyalangan javob (kalitsiz). “Red-flag” simptomlarni aniqlaydi.
- **Sog‘liq monitoringi** — puls, bosim, uyqu, suv, qadam; 7 kunlik trend grafigi.
- **Kaloriya & Diet** — ovqat qo‘shish, makro balans, AI diet rejasi.
- **Psixologik testlar** — PHQ-2 (kayfiyat) va GAD-2 (xavotir), natija darajasi va tavsiya.
- **Tezkor self-check** — kunlik 5 savol, risk darajasi shifokor paneliga signal beradi.
- **Yurish trekeri** — marshrut rejasi va jarayon (dizayn asl loyihadan saqlangan).
- **Profil** — ma’lumotlarni tahrirlash, tilni o‘zgartirish, parolni almashtirish.

---

## 🧱 Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Backend | FastAPI, SQLAlchemy, SQLite, python-jose (JWT), bcrypt, httpx |
| Frontend | React 19, Vite, lucide-react |
| AI | DeepSeek API (ixtiyoriy) + offline fallback |
| Deploy | PM2 (uvicorn jarayoni) |

Backend bitta jarayonda **ham API (`/api/*`) ham web ilovani** (build qilingan React) tarqatadi —
alohida web-server kerak emas.

---

## 🚀 Serverga o‘rnatish (Deployment)

### Talablar
- Python 3.10+ (3.12 tavsiya)
- Node.js 18+ va npm
- PM2 (`npm install -g pm2`)

### 1-qadam: Loyihani serverga ko‘chiring
ZIP faylni serverga yuklab, oching:
```bash
unzip mediself.zip
cd mediself
```

### 2-qadam: `.env` faylini sozlang
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Eng kamida quyidagilarni o‘zgartiring:
- **`PORT`** — ilova ishlaydigan port (masalan, `3000`).
- **`JWT_SECRET`** va **`JWT_REFRESH_SECRET`** — uzun, tasodifiy maxfiy satrlar.

Ixtiyoriy:
- **SMTP** (Gmail App Password) — real email OTP yuborish uchun. Bo‘sh qoldirilsa, OTP kod API javobida (`dev_otp`) qaytariladi (demo/test rejimi).
- **`DEEPSEEK_API_KEY`** — real AI javoblari uchun. Bo‘sh bo‘lsa, o‘rnatilgan offline yordamchi ishlaydi.

### 3-qadam: O‘rnatish va build
```bash
./setup.sh
```
Bu skript:
1. Backend uchun Python virtualenv yaratadi va kutubxonalarni o‘rnatadi.
2. `.env` mavjudligini tekshiradi.
3. Frontend’ni `npm install` qilib, `frontend/dist` ga build qiladi.

### 4-qadam: PM2 bilan ishga tushirish
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # server qayta yuklanganda avtomatik ishga tushishi uchun
```

Ilova endi `http://<server-ip>:<PORT>` manzilida ishlaydi.

#### Foydali PM2 buyruqlari
```bash
pm2 logs mediself        # loglarni ko‘rish
pm2 restart mediself     # qayta ishga tushirish
pm2 stop mediself        # to‘xtatish
pm2 status               # holat
```

> **Eslatma:** PM2’siz to‘g‘ridan-to‘g‘ri ishga tushirish uchun: `./start.sh`

---

## 🔑 Gmail App Password (email OTP uchun)

Real OTP email yuborish uchun Gmail’da App Password kerak:
1. Google hisobingizda **2 bosqichli tasdiqlash** (2FA) yoqilgan bo‘lsin.
2. https://myaccount.google.com/apppasswords → yangi App Password yarating.
3. `backend/.env` da quyidagilarni to‘ldiring:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=siz@gmail.com
   SMTP_PASSWORD=16-belgili-app-password
   SMTP_FROM=MediSelf <siz@gmail.com>
   ```
4. `pm2 restart mediself`.

App Password kiritilgach, ro‘yxatdan o‘tishda OTP avtomatik emailga yuboriladi.

---

## 👤 Demo hisoblar

Boshlang‘ich (seed) ma’lumotlar bilan quyidagi hisoblar tayyor (parol hammasi: **`mediself`**):

| Email | Rol | Mutaxassislik |
|-------|-----|---------------|
| `sardor@mediself.uz` | Bemor | — (3 dori, 7 kunlik vitals) |
| `madina@mediself.uz` | Bemor | — (o‘rta risk) |
| `bekzod@mediself.uz` | Bemor | — (yuqori risk) |
| `malika@mediself.uz` | Shifokor | Kardiolog |
| `aziz@mediself.uz` | Shifokor | Endokrinolog |
| `dilshod@mediself.uz` | Shifokor | Terapevt |
| `sevara@mediself.uz` | Shifokor | Psixolog |

> Demo ma’lumotlarni o‘chirish uchun `backend/.env` da `SEED_DEMO_DATA=false` qiling
> va `backend/mediself.db` faylini o‘chiring (yangi bo‘sh baza yaratiladi).

---

## 🗂 Loyiha tuzilishi

```
mediself/
├── backend/                # FastAPI ilova
│   ├── app/
│   │   ├── core/           # config, security (JWT/bcrypt), i18n
│   │   ├── models/         # SQLAlchemy modellar
│   │   ├── schemas/        # Pydantic sxemalar
│   │   ├── services/       # email (SMTP), ai (DeepSeek + fallback)
│   │   ├── api/routes/     # auth, medicines, appointments, health, doctor, ai
│   │   ├── db/             # session, seed
│   │   └── main.py         # ilova + SPA tarqatish
│   ├── requirements.txt
│   └── .env.example
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── i18n/           # uz/ru/en tarjimalar (364 kalit)
│   │   ├── context/        # Auth, Toast
│   │   ├── services/api.js # backend bilan bog‘lanish
│   │   ├── components/
│   │   └── pages/          # barcha sahifalar
│   └── dist/               # build natijasi (setup.sh yaratadi)
├── ecosystem.config.js     # PM2 konfiguratsiyasi
├── setup.sh                # o‘rnatish + build
├── start.sh                # serverni ishga tushirish
└── README.md
```

---

## 🔒 Xavfsizlik eslatmalari

- Ishga tushirishdan oldin `.env` dagi JWT maxfiy kalitlarni albatta o‘zgartiring.
- Parollar bcrypt bilan shifrlanadi, hech qachon ochiq saqlanmaydi.
- Sessiyalar JWT access + refresh token bilan himoyalangan; refresh token aylantiriladi (rotation).
- Reverse-proxy (nginx) orqali HTTPS sozlash tavsiya etiladi.

---

## ⚠️ Tibbiy ogohlantirish

MediSelf — yordamchi va monitoring vositasi. U **tibbiy tashxis qo‘ymaydi** va shifokor
ko‘rigini almashtirmaydi. Shoshilinch holatlarda (kuchli ko‘krak og‘rig‘i, nafas qisishi,
hushdan ketish va h.k.) zudlik bilan shoshilinch yordamga murojaat qiling.
