import { Check, HeartPulse, ShieldPlus, Stethoscope } from "lucide-react";
import { useState } from "react";
import { AuthShell } from "../../components/AuthShell.jsx";
import { Button } from "../../components/Button.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";

export function ProfileSelect({ go }) {
  const { t } = useI18n();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState(user?.role || "patient");
  const [loading, setLoading] = useState(false);

  const roles = [
    { key: "patient", title: t("role.patient"), text: t("ps.patient.text"), icon: HeartPulse },
    { key: "doctor", title: t("role.doctor"), text: t("ps.doctor.text"), icon: Stethoscope },
    { key: "person", title: t("role.person"), text: t("ps.person.text"), icon: ShieldPlus },
  ];

  const finish = async () => {
    setLoading(true);
    try {
      await updateUser({ role });
      go(role === "doctor" ? "doctor" : "dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell eyebrow={t("ps.eyebrow")} title={t("ps.title")} subtitle={t("ps.subtitle")}>
      <div className="select-grid">
        {roles.map((item) => {
          const Icon = item.icon;
          const active = role === item.key;
          return (
            <button
              key={item.key}
              className={`select-card ${active ? "active" : ""}`}
              type="button"
              onClick={() => setRole(item.key)}
            >
              <span className="select-icon">
                <Icon size={23} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <span className="tiny">{item.text}</span>
              </span>
              {active ? (
                <StatusPill tone="teal">
                  <Check size={14} /> {t("ps.selected")}
                </StatusPill>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="auth-actions">
        <Button onClick={finish} disabled={loading}>
          {loading ? <span className="spinner spinner-light" /> : null}
          {t("ps.continue")}
        </Button>
      </div>
    </AuthShell>
  );
}
