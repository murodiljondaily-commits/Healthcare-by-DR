import { ArrowRight, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { AuthShell } from "../../components/AuthShell.jsx";
import { Button } from "../../components/Button.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { OtpVerify } from "./OtpVerify.jsx";

export function Login({ go }) {
  const { t } = useI18n();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpStage, setOtpStage] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ email, password });
      if (result.requires_verification) {
        setOtpStage({ email, devOtp: result.dev_otp });
        return;
      }
      toast.success(result.message || t("login.submit"));
      go(result.user.role === "doctor" ? "doctor" : "dashboard");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (otpStage) {
    return (
      <OtpVerify
        email={otpStage.email}
        devOtp={otpStage.devOtp}
        onVerified={() => go("dashboard")}
        onBack={() => setOtpStage(null)}
      />
    );
  }

  return (
    <AuthShell eyebrow={t("login.eyebrow")} title={t("login.title")} subtitle={t("login.subtitle")}>
      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span>{t("reg.email")}</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@example.com" required />
        </label>
        <label className="field">
          <span>{t("reg.password")}</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>

        {error ? <StatusPill tone="rose">{error}</StatusPill> : null}

        <div className="auth-actions">
          <Button type="submit" disabled={loading}>
            {loading ? <span className="spinner spinner-light" /> : null}
            {t("login.submit")} <ArrowRight size={18} />
          </Button>
          <Button type="button" variant="ghost" onClick={() => go("register")}>
            {t("login.toRegister")}
          </Button>
        </div>

        <p className="muted tiny">{t("login.demo")}</p>

        <div className="grid grid-2">
          <article className="card">
            <Mail size={20} color="#0f766e" />
            <h3>Email OTP</h3>
            <p className="muted">{t("login.otp.text")}</p>
          </article>
          <article className="card">
            <Lock size={20} color="#0f766e" />
            <h3>Secure session</h3>
            <p className="muted">{t("pr.privacy.text")}</p>
          </article>
        </div>
      </form>
    </AuthShell>
  );
}
