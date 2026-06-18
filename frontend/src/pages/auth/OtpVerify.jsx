import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AuthShell } from "../../components/AuthShell.jsx";
import { Button } from "../../components/Button.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

export function OtpVerify({ email, devOtp, onVerified, onBack }) {
  const { t } = useI18n();
  const { verifyEmail } = useAuth();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState(devOtp || "");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await verifyEmail({ email, code });
      toast.success(result.message || t("login.otp.verify"));
      onVerified();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const result = await api.resendOtp({ email });
      setHint(result.dev_otp || "");
      toast.info(result.message || t("login.otp.resend"));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthShell eyebrow={t("login.eyebrow")} title={t("login.otp.title")} subtitle={t("login.otp.text")}>
      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span>{t("login.otp.code")}</span>
          <input
            className="otp-input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="••••••"
            required
          />
        </label>

        {hint ? (
          <StatusPill tone="amber">
            {t("login.otp.devhint")} {hint}
          </StatusPill>
        ) : null}
        {error ? <StatusPill tone="rose">{error}</StatusPill> : null}

        <div className="auth-actions">
          <Button type="submit" disabled={loading || code.length < 4}>
            {loading ? <span className="spinner spinner-light" /> : <ShieldCheck size={18} />}
            {t("login.otp.verify")}
          </Button>
          <Button type="button" variant="secondary" onClick={resend}>
            {t("login.otp.resend")}
          </Button>
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft size={16} /> {t("common.back")}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
