import { useI18n } from "../i18n/index.jsx";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";

export function AuthShell({ eyebrow, title, subtitle, children }) {
  const { t } = useI18n();
  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-label="MediSelf">
        <div className="auth-topbar">
          <div className="brand-block brand-block-light">
            <span className="brand-mark">M</span>
            <span>
              <strong>MediSelf</strong>
              <small>{t("app.tagline")}</small>
            </span>
          </div>
          <LanguageSwitcher variant="light" />
        </div>
        <div className="auth-score">
          <span>{t("auth.score")}</span>
          <strong>88</strong>
          <small>{t("auth.score.note")}</small>
        </div>
        <div className="auth-grid">
          <span>{t("auth.medication")}</span>
          <strong>96%</strong>
          <span>{t("auth.steps")}</span>
          <strong>7 420</strong>
          <span>{t("auth.sleep")}</span>
          <strong>7.2h</strong>
        </div>
      </section>

      <section className="auth-panel">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
