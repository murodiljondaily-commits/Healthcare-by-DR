import { ArrowRight, Bell, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import { AuthShell } from "../../components/AuthShell.jsx";
import { Button } from "../../components/Button.jsx";
import { useI18n } from "../../i18n/index.jsx";

export function Onboarding({ onRegister, onLogin }) {
  const { t } = useI18n();
  const features = [
    { icon: HeartPulse, title: t("onb.f1.title"), text: t("onb.f1.text") },
    { icon: Bell, title: t("onb.f2.title"), text: t("onb.f2.text") },
    { icon: ShieldCheck, title: t("onb.f3.title"), text: t("onb.f3.text") },
  ];

  return (
    <AuthShell eyebrow={t("onb.eyebrow")} title={t("onb.title")} subtitle={t("onb.subtitle")}>
      <div className="grid select-grid">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <article className="select-card" key={item.title}>
              <span className="select-icon">
                <Icon size={23} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <span className="tiny">{item.text}</span>
              </span>
              <Sparkles size={18} color="#0f766e" />
            </article>
          );
        })}
      </div>

      <div className="auth-actions">
        <Button onClick={onRegister}>
          {t("onb.start")} <ArrowRight size={18} />
        </Button>
        <Button variant="secondary" onClick={onLogin}>
          {t("onb.login")}
        </Button>
      </div>
    </AuthShell>
  );
}
