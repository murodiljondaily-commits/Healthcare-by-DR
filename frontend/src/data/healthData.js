export const initialUser = {
  name: "Sardor Karimov",
  email: "sardor@mediself.uz",
  phone: "+998 90 123 45 67",
  role: "patient",
  city: "Toshkent",
  age: 29,
  avatar: "SK",
  plan: "MediSelf Plus",
};

export const roleProfiles = {
  patient: {
    label: "Bemor",
    headline: "Davolanish rejasi, qabul va monitoring bir joyda.",
    dashboardTitle: "Bemor nazorat paneli",
  },
  doctor: {
    label: "Shifokor",
    headline: "Bemorlar, risk signallari va maslahatlar paneli.",
    dashboardTitle: "Shifokor ish stoli",
  },
  person: {
    label: "Oddiy foydalanuvchi",
    headline: "Profilaktika, psixologik self-check va sog'lom odatlar.",
    dashboardTitle: "Profilaktika paneli",
  },
};

export const dashboardMetrics = [
  { label: "Health score", value: "88", unit: "/100", tone: "mint", helper: "+6 bu hafta" },
  { label: "Yurak urishi", value: "72", unit: "bpm", tone: "teal", helper: "Normal" },
  { label: "Qon bosimi", value: "120/80", unit: "", tone: "blue", helper: "Barqaror" },
  { label: "Bugungi qadam", value: "7 420", unit: "", tone: "amber", helper: "74% target" },
];

export const vitals = [
  { day: "Du", pulse: 74, pressure: "121/80", sleep: 6.7, water: 1.5 },
  { day: "Se", pulse: 70, pressure: "119/79", sleep: 7.1, water: 1.8 },
  { day: "Ch", pulse: 73, pressure: "122/81", sleep: 6.5, water: 1.4 },
  { day: "Pa", pulse: 71, pressure: "118/78", sleep: 7.4, water: 2.1 },
  { day: "Ju", pulse: 76, pressure: "123/82", sleep: 6.2, water: 1.7 },
  { day: "Sh", pulse: 69, pressure: "117/77", sleep: 8.0, water: 2.0 },
  { day: "Ya", pulse: 72, pressure: "120/80", sleep: 7.2, water: 1.9 },
];

export const carePlan = [
  { time: "08:00", title: "Dori qabul qilish", detail: "Vitamin D3 va Omega-3", status: "Bajarildi" },
  { time: "12:30", title: "Tushlik balansi", detail: "450-550 kcal oralig'ida", status: "Kutilmoqda" },
  { time: "18:00", title: "Yurish seansi", detail: "25 daqiqa tez yurish", status: "Bugun" },
];

export const medicines = [
  { name: "Vitamin D3", dose: "1 kapsula", time: "08:00", stock: 24, adherence: 96 },
  { name: "Omega-3", dose: "1 kapsula", time: "08:00", stock: 18, adherence: 92 },
  { name: "Magniy B6", dose: "1 tabletka", time: "21:30", stock: 12, adherence: 88 },
];

export const meals = [
  { title: "Nonushta", menu: "Tuxum, suli yormasi, ko'k choy", kcal: 420, protein: 28 },
  { title: "Tushlik", menu: "Tovuq filesi, guruch, salat", kcal: 560, protein: 42 },
  { title: "Kechki ovqat", menu: "Baliq, sabzavot, qatiq", kcal: 480, protein: 36 },
];

export const walkingWeek = [
  { day: "Du", steps: 6200 },
  { day: "Se", steps: 8500 },
  { day: "Ch", steps: 7100 },
  { day: "Pa", steps: 9400 },
  { day: "Ju", steps: 7420 },
  { day: "Sh", steps: 10800 },
  { day: "Ya", steps: 6800 },
];

export const hospitals = [
  {
    id: 1,
    name: "Respublika Kardiologiya Markazi",
    type: "Kardiologiya",
    address: "Osiyo ko'chasi 4, Toshkent",
    phone: "+998 71 237 70 27",
    lat: 41.2995,
    lng: 69.2401,
    open: "08:00 - 18:00",
    eta: "11 daqiqa",
  },
  {
    id: 2,
    name: "Shoshilinch Tibbiy Yordam Markazi",
    type: "Shoshilinch yordam",
    address: "Farg'ona yo'li 2, Toshkent",
    phone: "+998 71 277 00 07",
    lat: 41.2856,
    lng: 69.3012,
    open: "24/7",
    eta: "18 daqiqa",
  },
  {
    id: 3,
    name: "Akfa Medline",
    type: "Xususiy klinika",
    address: "Amir Temur ko'chasi 107B, Toshkent",
    phone: "+998 71 200 09 09",
    lat: 41.3201,
    lng: 69.2567,
    open: "08:00 - 20:00",
    eta: "14 daqiqa",
  },
  {
    id: 4,
    name: "TTA Klinikasi",
    type: "Umumiy klinika",
    address: "Farabi ko'chasi 2, Toshkent",
    phone: "+998 71 214 52 53",
    lat: 41.3045,
    lng: 69.2634,
    open: "08:00 - 17:00",
    eta: "9 daqiqa",
  },
];

export const doctors = [
  { id: "dr-usmonova", name: "Dr. Malika Usmonova", specialty: "Kardiolog", status: "Online", next: "Bugun 16:30", rating: 4.9 },
  { id: "dr-tursunov", name: "Dr. Aziz Tursunov", specialty: "Endokrinolog", status: "Band", next: "Ertaga 10:00", rating: 4.8 },
  { id: "dr-rahimov", name: "Dr. Dilshod Rahimov", specialty: "Terapevt", status: "Online", next: "Juma 09:15", rating: 4.7 },
  { id: "dr-karimova", name: "Dr. Sevara Karimova", specialty: "Psixolog", status: "Online", next: "Bugun 18:00", rating: 4.9 },
];

export const appointmentSlots = [
  { date: "2026-05-15", time: "09:00", status: "Bo'sh" },
  { date: "2026-05-15", time: "16:30", status: "Tavsiya" },
  { date: "2026-05-16", time: "10:00", status: "Bo'sh" },
  { date: "2026-05-17", time: "14:15", status: "Bo'sh" },
];

export const patientQueue = [
  { name: "Sardor Karimov", age: 29, risk: "Past", signal: "Bosim barqaror", lastCheck: "Bugun 08:45" },
  { name: "Madina Soliyeva", age: 34, risk: "O'rta", signal: "Uyqu va stress yuqori", lastCheck: "Bugun 11:20" },
  { name: "Bekzod Aliyev", age: 41, risk: "Yuqori", signal: "Ko'krak og'rig'i belgilangan", lastCheck: "12 daqiqa oldin" },
];

export const mentalTests = [
  {
    id: "phq2",
    title: "PHQ-2 kayfiyat skriningi",
    type: "Depressiv simptomlar",
    disclaimer: "Bu diagnostika emas, faqat self-screening natijasi.",
    questions: [
      "Oxirgi 2 haftada qiziqish yoki zavqlanish kamayganmi?",
      "Oxirgi 2 haftada tushkunlik, umidsizlik yoki ezilish ko'p bo'ldimi?",
    ],
    interpretation: [
      { max: 1, tone: "mint", label: "Past signal", text: "Hozircha kuchli signal yo'q. Uyqu va jismoniy faollikni davom ettiring." },
      { max: 3, tone: "amber", label: "Kuzatish kerak", text: "Kayfiyat kundaligini yuriting va yaqin kunlarda psixolog bilan maslahatni ko'rib chiqing." },
      { max: 6, tone: "rose", label: "Mutaxassis tavsiyasi", text: "Psixolog yoki psixiatr bilan suhbat rejalashtiring. O'zingizga zarar yetkazish fikri bo'lsa zudlik bilan yordam so'rang." },
    ],
  },
  {
    id: "gad2",
    title: "GAD-2 xavotir skriningi",
    type: "Anksiyete signal",
    disclaimer: "Natija shifokor bahosini almashtirmaydi.",
    questions: [
      "Oxirgi 2 haftada asabiylik yoki xavotirni nazorat qilish qiyin bo'ldimi?",
      "Turli narsalar haqida ortiqcha tashvishlanish tez-tez bo'ldimi?",
    ],
    interpretation: [
      { max: 1, tone: "mint", label: "Past signal", text: "Nafas mashqlari va uyqu gigiyenasini davom ettiring." },
      { max: 3, tone: "amber", label: "O'rta signal", text: "Stress triggerlarini yozib boring, psixologik maslahat foydali bo'lishi mumkin." },
      { max: 6, tone: "rose", label: "Yuqori signal", text: "Mutaxassis bilan suhbatni kechiktirmang, ayniqsa kundalik hayotga ta'sir qilsa." },
    ],
  },
];

export const medicalPrograms = [
  { title: "Profilaktik check-up", audience: "Oddiy foydalanuvchi", items: "Qon bosimi, BMI, uyqu, stress" },
  { title: "Kardiometabolik nazorat", audience: "Bemor", items: "Bosim, puls, glukoza, dori adherence" },
  { title: "Doctor command center", audience: "Shifokor", items: "Risk queue, qabul, maslahat, follow-up" },
];

export const surveyQuestions = [
  "Bugun nafas qisishi yoki ko'krakda og'riq sezdingizmi?",
  "Oxirgi 24 soatda dorilarni to'liq qabul qildingizmi?",
  "Uyqu sifatingiz 7 soatdan kam bo'ldimi?",
  "Bugun kamida 20 daqiqa faol harakat qildingizmi?",
  "Kayfiyat va stress darajangiz nazoratdami?",
];

export const insightCards = [
  {
    title: "AI xulosasi",
    text: "Puls va uyqu ritmi yaxshi. Bugun suv miqdorini 300 ml oshirsangiz, health score 90+ ga chiqadi.",
  },
  {
    title: "Shifokor signali",
    text: "Qon bosimi barqaror. Keyingi profilaktik ko'rik: 7 kun ichida.",
  },
];
