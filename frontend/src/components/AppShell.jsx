import { Bot, Brain, CalendarCheck, HeartPulse, Home, Hospital, Pill, Stethoscope, User } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";

const navigation = [
  { key: "dashboard", labelKey: "nav.dashboard", icon: Home, match: ["dashboard"] },
  { key: "appointments", labelKey: "nav.appointments", icon: CalendarCheck, match: ["appointments"] },
  { key: "mental", labelKey: "nav.mental", icon: Brain, match: ["mental"] },
  { key: "health", labelKey: "nav.health", icon: HeartPulse, match: ["health", "walking", "calorie", "diet", "survey"] },
  { key: "medicine", labelKey: "nav.medicine", icon: Pill, match: ["medicine"] },
  { key: "hospital", labelKey: "nav.hospital", icon: Hospital, match: ["hospital"] },
  { key: "doctor", labelKey: "nav.doctor", icon: Stethoscope, match: ["doctor"], roles: ["doctor"] },
  { key: "ai", labelKey: "nav.ai", icon: Bot, match: ["ai"] },
  { key: "profile", labelKey: "nav.profile", icon: User, match: ["profile"] },
];

export function AppShell({ screen, go, children }) {
  const { user } = useAuth();
  const { t } = useI18n();
  if (!user) return null;

  const visibleNavigation = navigation.filter((item) => !item.roles || item.roles.includes(user.role));
  const isActive = (item) => item.match.includes(screen);
  const roleModeKey =
    user.role === "doctor" ? "role.doctor.mode" : user.role === "person" ? "role.person.mode" : "role.patient.mode";
  const careLine =
    user.role === "doctor" ? `7 ${t("rail.care.doctor")}` : t("rail.care.patient");

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <button className="brand-block" type="button" onClick={() => go("dashboard")}>
          <span className="brand-mark">+</span>
          <span>
            <strong>MediSelf</strong>
            <small>{t("app.tagline")}</small>
          </span>
        </button>

        <nav className="rail-nav" aria-label="MediSelf">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={isActive(item) ? "active" : ""}
                type="button"
                onClick={() => go(item.key)}
              >
                <Icon size={20} />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="rail-care">
          <span>{t(roleModeKey)}</span>
          <strong>{careLine}</strong>
          <small>{t("rail.care.ai")}</small>
        </div>

        <div className="rail-lang">
          <LanguageSwitcher variant="light" />
        </div>

        <div className="rail-user">
          <div className="avatar">{user.avatar || "MS"}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.plan}</small>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <div className="mobile-brand">
          <button className="brand-block" type="button" onClick={() => go("dashboard")}>
            <span className="brand-mark">+</span>
            <span>
              <strong>MediSelf</strong>
              <small>{user.city}</small>
            </span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LanguageSwitcher />
            <div className="avatar">{user.avatar || "MS"}</div>
          </div>
        </div>
        <div className="screen-frame" key={screen}>
          {children}
        </div>
      </main>

      <nav className="bottom-nav" aria-label="MediSelf">
        {visibleNavigation.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={isActive(item) ? "active" : ""}
              type="button"
              onClick={() => go(item.key)}
              aria-label={t(item.labelKey)}
            >
              <Icon size={21} />
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
