import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AuthShell } from "../../components/AuthShell.jsx";
import { Button } from "../../components/Button.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { OtpVerify } from "./OtpVerify.jsx";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  birth_date: "",
  gender: "Erkak",
  password: "",
  confirmPassword: "",
};

export function Register({ go }) {
  const { t, locale } = useI18n();
  const { register, verifyEmail } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpStage, setOtpStage] = useState(null); // {email, devOtp}

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.password.length < 6) {
      setError(t("reg.err.short"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("reg.err.match"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await register({
        name: form.name || "User",
        email: form.email,
        phone: form.phone,
        password: form.password,
        gender: form.gender,
        birth_date: form.birth_date,
        role: "patient",
        locale,
      });
      if (result.requires_verification) {
        setOtpStage({ email: form.email, devOtp: result.dev_otp });
      } else {
        toast.success(result.message || t("reg.title"));
        go("profileSelect");
      }
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
        onVerified={() => go("profileSelect")}
        onBack={() => setOtpStage(null)}
      />
    );
  }

  return (
    <AuthShell eyebrow={t("reg.eyebrow")} title={t("reg.title")} subtitle={t("reg.subtitle")}>
      <form className="auth-form" onSubmit={submit}>
        <div className="form-grid two">
          <label className="field">
            <span>{t("reg.name")}</span>
            <input name="name" value={form.name} onChange={update} placeholder="Sardor Karimov" required />
          </label>
          <label className="field">
            <span>{t("reg.phone")}</span>
            <input name="phone" value={form.phone} onChange={update} placeholder="+998 90 123 45 67" required />
          </label>
        </div>

        <label className="field">
          <span>{t("reg.email")}</span>
          <input name="email" value={form.email} onChange={update} type="email" placeholder="email@example.com" required />
        </label>

        <div className="form-grid two">
          <label className="field">
            <span>{t("reg.birth")}</span>
            <input name="birth_date" value={form.birth_date} onChange={update} type="date" required />
          </label>
          <label className="field">
            <span>{t("reg.gender")}</span>
            <select name="gender" value={form.gender} onChange={update}>
              <option value="Erkak">{t("reg.gender.male")}</option>
              <option value="Ayol">{t("reg.gender.female")}</option>
            </select>
          </label>
        </div>

        <div className="form-grid two">
          <label className="field">
            <span>{t("reg.password")}</span>
            <input name="password" value={form.password} onChange={update} type="password" required />
          </label>
          <label className="field">
            <span>{t("reg.confirm")}</span>
            <input name="confirmPassword" value={form.confirmPassword} onChange={update} type="password" required />
          </label>
        </div>

        {error ? <StatusPill tone="rose">{error}</StatusPill> : null}

        <div className="auth-actions">
          <Button type="submit" disabled={loading}>
            {loading ? <span className="spinner spinner-light" /> : null}
            {t("reg.submit")} <ArrowRight size={18} />
          </Button>
          <Button type="button" variant="ghost" onClick={() => go("login")}>
            {t("reg.toLogin")}
          </Button>
        </div>

        <article className="card">
          <ShieldCheck size={20} color="#0f766e" />
          <h3>{t("reg.privacy.title")}</h3>
          <p className="muted">{t("reg.privacy.text")}</p>
        </article>
      </form>
    </AuthShell>
  );
}
