import { Bell, LogOut, Lock, Settings, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { LOCALE_LABELS, LOCALES } from "../../i18n/translations.js";
import { api } from "../../services/api.js";

export function Profile({ go }) {
  const { t, locale, setLocale } = useI18n();
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: user.name,
    city: user.city,
    role: user.role,
    email: user.email,
    phone: user.phone,
  });
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState({ current_password: "", new_password: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateUser({ name: form.name, city: form.city, role: form.role, phone: form.phone, locale });
      toast.success(t("pr.saved"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPwdSaving(true);
    try {
      await api.changePassword(pwd);
      setPwd({ current_password: "", new_password: "" });
      toast.success(t("pr.pwd.changed"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  const doLogout = async () => {
    await logout();
    go("onboarding");
  };

  return (
    <div className="page">
      <PageHeader
        title={t("pr.title")}
        subtitle={t("pr.subtitle")}
        icon={User}
        go={go}
        action={
          <Button size="sm" variant="danger" onClick={doLogout}>
            <LogOut size={17} /> {t("pr.logout")}
          </Button>
        }
      />

      <section className="profile-banner">
        <div className="avatar">{user.avatar}</div>
        <div>
          <h2>{user.name}</h2>
          <p className="muted">
            {user.email} · {user.phone}
          </p>
        </div>
        <StatusPill tone="teal">{user.plan}</StatusPill>
      </section>

      <section className="grid grid-2">
        <article className="form-panel">
          <h2>{t("pr.info")}</h2>
          <div className="form-grid two">
            <label className="field">
              <span>{t("pr.name")}</span>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("pr.city")}</span>
              <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("pr.role")}</span>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="patient">{t("role.patient")}</option>
                <option value="doctor">{t("role.doctor")}</option>
                <option value="person">{t("role.person")}</option>
              </select>
            </label>
            <label className="field">
              <span>{t("pr.lang")}</span>
              <select value={locale} onChange={(e) => setLocale(e.target.value)}>
                {LOCALES.map((code) => (
                  <option key={code} value={code}>
                    {LOCALE_LABELS[code]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t("pr.email")}</span>
              <input value={form.email} readOnly />
            </label>
            <label className="field">
              <span>{t("pr.phone")}</span>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </label>
          </div>
          <div className="auth-actions">
            <Button onClick={save} disabled={saving}>
              {saving ? <span className="spinner spinner-light" /> : null} {t("pr.save")}
            </Button>
          </div>
        </article>

        <div className="grid" style={{ gap: 14 }}>
          <article className="card">
            <h2>{t("pr.settings")}</h2>
            <div className="list">
              <div className="list-row">
                <div className="list-row__main">
                  <strong>
                    <Bell size={16} /> {t("pr.notif")}
                  </strong>
                  <span>{t("pr.notif.text")}</span>
                </div>
                <StatusPill tone="mint">{t("pr.active")}</StatusPill>
              </div>
              <div className="list-row">
                <div className="list-row__main">
                  <strong>
                    <ShieldCheck size={16} /> {t("pr.privacy")}
                  </strong>
                  <span>{t("pr.privacy.text")}</span>
                </div>
                <StatusPill tone="blue">{t("pr.secure")}</StatusPill>
              </div>
              <div className="list-row">
                <div className="list-row__main">
                  <strong>
                    <Settings size={16} /> {t("pr.mode")}
                  </strong>
                  <span>{t("pr.mode.text")}</span>
                </div>
                <StatusPill tone="teal">{t("pr.ready")}</StatusPill>
              </div>
            </div>
          </article>

          <article className="form-panel">
            <h2>{t("pr.security")}</h2>
            <form onSubmit={changePassword}>
              <div className="form-grid two">
                <label className="field">
                  <span>{t("pr.pwd.current")}</span>
                  <input type="password" value={pwd.current_password} onChange={(e) => setPwd((p) => ({ ...p, current_password: e.target.value }))} required />
                </label>
                <label className="field">
                  <span>{t("pr.pwd.new")}</span>
                  <input type="password" value={pwd.new_password} onChange={(e) => setPwd((p) => ({ ...p, new_password: e.target.value }))} required minLength={6} />
                </label>
              </div>
              <div className="auth-actions">
                <Button type="submit" variant="secondary" disabled={pwdSaving}>
                  {pwdSaving ? <span className="spinner" /> : <Lock size={16} />} {t("pr.pwd.change")}
                </Button>
              </div>
            </form>
          </article>
        </div>
      </section>
    </div>
  );
}
