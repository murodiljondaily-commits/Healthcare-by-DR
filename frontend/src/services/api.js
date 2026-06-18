// Central API client for the MediSelf backend.
// - Stores access/refresh tokens in localStorage
// - Attaches the Bearer token to every request
// - Transparently refreshes the access token on 401 and retries once

const API_BASE = import.meta.env.VITE_API_URL || "";

const ACCESS_KEY = "mediself.access";
const REFRESH_KEY = "mediself.refresh";

export const tokenStore = {
  get access() {
    try {
      return window.localStorage.getItem(ACCESS_KEY) || "";
    } catch {
      return "";
    }
  },
  get refresh() {
    try {
      return window.localStorage.getItem(REFRESH_KEY) || "";
    } catch {
      return "";
    }
  },
  set({ access_token, refresh_token }) {
    try {
      if (access_token) window.localStorage.setItem(ACCESS_KEY, access_token);
      if (refresh_token) window.localStorage.setItem(REFRESH_KEY, refresh_token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
  },
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function rawRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && tokenStore.access) {
    headers.Authorization = `Bearer ${tokenStore.access}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function tryRefresh() {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) {
      tokenStore.clear();
      return false;
    }
    const data = await res.json();
    tokenStore.set(data);
    return true;
  } catch {
    return false;
  }
}

export async function request(path, options = {}) {
  let res = await rawRequest(path, options);

  // Auto-refresh once on 401 for authenticated requests.
  if (res.status === 401 && options.auth !== false && tokenStore.refresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawRequest(path, options);
    }
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!res.ok) {
    const message = (data && (data.detail || data.error)) || `API error ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return data;
}

export const api = {
  // --- auth ---
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload, auth: false }),
  verifyEmail: (payload) => request("/api/auth/verify-email", { method: "POST", body: payload, auth: false }),
  resendOtp: (payload) => request("/api/auth/resend-otp", { method: "POST", body: payload, auth: false }),
  me: () => request("/api/auth/me"),
  updateMe: (payload) => request("/api/auth/me", { method: "PATCH", body: payload }),
  changePassword: (payload) => request("/api/auth/change-password", { method: "POST", body: payload }),
  logout: (refresh_token) =>
    request("/api/auth/logout", { method: "POST", body: { refresh_token }, auth: false }),

  // --- dashboard ---
  dashboardSummary: () => request("/api/dashboard/summary"),

  // --- medicines ---
  medicines: () => request("/api/medicines"),
  addMedicine: (payload) => request("/api/medicines", { method: "POST", body: payload }),
  takeMedicine: (id) => request(`/api/medicines/${id}/take`, { method: "POST" }),
  deleteMedicine: (id) => request(`/api/medicines/${id}`, { method: "DELETE" }),

  // --- appointments ---
  doctors: () => request("/api/doctors", { auth: false }),
  appointments: () => request("/api/appointments"),
  createAppointment: (payload) => request("/api/appointments", { method: "POST", body: payload }),
  updateAppointment: (id, status) =>
    request(`/api/appointments/${id}`, { method: "PATCH", body: { status } }),
  cancelAppointment: (id) => request(`/api/appointments/${id}`, { method: "DELETE" }),

  // --- health ---
  vitals: () => request("/api/vitals"),
  addVital: (payload) => request("/api/vitals", { method: "POST", body: payload }),
  meals: () => request("/api/meals"),
  addMeal: (payload) => request("/api/meals", { method: "POST", body: payload }),
  deleteMeal: (id) => request(`/api/meals/${id}`, { method: "DELETE" }),
  submitSurvey: (answers) => request("/api/survey", { method: "POST", body: { answers } }),
  submitMental: (payload) => request("/api/mental", { method: "POST", body: payload }),

  // --- doctor ---
  doctorPatients: () => request("/api/doctor/patients"),
  doctorStats: () => request("/api/doctor/stats"),
  sendAdvice: (payload) => request("/api/doctor/advice", { method: "POST", body: payload }),
  myAdvice: () => request("/api/doctor/my-advice"),

  // --- ai ---
  aiChat: (payload) => request("/api/ai/chat", { method: "POST", body: payload }),
  aiTriage: (payload) => request("/api/ai/triage", { method: "POST", body: payload }),
};

export { ApiError };
