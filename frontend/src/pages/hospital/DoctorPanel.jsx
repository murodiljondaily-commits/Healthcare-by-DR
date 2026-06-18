import { Activity, AlertTriangle, Bot, Calendar, MessageSquareText, Stethoscope, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { MetricCard } from "../../components/MetricCard.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

function TriageModal({ open, title, text, loading, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>{title}</strong>
          <button className="icon-btn" onClick={onClose} aria-label="close" style={{ width: 34, height: 34 }}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="empty-state"><span className="spinner" /></div>
          ) : (
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, margin: 0 }}>{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DoctorPanel({ go }) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [triage, setTriage] = useState({ open: false, loading: false, title: "", text: "" });
  const [advice, setAdvice] = useState({ patientId: "", priority: "normal", message: t("dp.advice.default") });
  const [sending, setSending] = useState(false);

  const load = async () => {
    const [p, s, a] = await Promise.all([
      api.doctorPatients().catch(() => ({ patients: [] })),
      api.doctorStats().catch(() => null),
      api.appointments().catch(() => []),
    ]);
    setPatients(p.patients || []);
    setStats(s);
    setAppointments(Array.isArray(a) ? a : []);
    if (p.patients?.length && !advice.patientId) {
      setAdvice((cur) => ({ ...cur, patientId: p.patients[0].id }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTriage = async (patient) => {
    setTriage({ open: true, loading: true, title: `${t("dp.triage.title")} — ${patient.name}`, text: "" });
    try {
      const res = await api.aiTriage({
        patient_id: patient.id,
        patient_name: patient.name,
        age: patient.age,
        signal: patient.signal,
        locale,
      });
      setTriage((cur) => ({ ...cur, loading: false, text: res.text }));
    } catch (err) {
      setTriage((cur) => ({ ...cur, loading: false, text: t("dp.triage.error") }));
      toast.error(err.message);
    }
  };

  const sendAdvice = async (event) => {
    event.preventDefault();
    if (!advice.patientId) return;
    setSending(true);
    try {
      await api.sendAdvice({
        patient_id: Number(advice.patientId),
        priority: advice.priority,
        message: advice.message,
      });
      toast.success(t("dp.advice.sent"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const updateAppt = async (id, status) => {
    try {
      await api.updateAppointment(id, status);
      toast.success(t(`apt.status.${status}`));
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const riskTone = (key) => (key === "high" ? "rose" : key === "medium" ? "amber" : "mint");

  const todayAppts = useMemo(() => appointments.filter((a) => a.status === "pending"), [appointments]);

  return (
    <div className="page">
      <PageHeader
        title={t("dp.title")}
        subtitle={`${user.name} — ${t("dp.subtitle")}`}
        icon={Stethoscope}
        go={go}
        action={
          <Button size="sm">
            <Calendar size={17} /> {t("dp.schedule")}
          </Button>
        }
      />

      <section className="grid grid-4">
        <MetricCard label={t("dp.patients")} value={String(stats?.patients ?? 0)} helper={t("dp.patients.help")} tone="teal" icon={Users} />
        <MetricCard label={t("dp.highrisk")} value={String(stats?.high_risk ?? 0)} helper={t("dp.highrisk.help")} tone="rose" icon={AlertTriangle} />
        <MetricCard label={t("dp.todayappts")} value={String(stats?.today_appointments ?? 0)} helper={t("apt.online")} tone="blue" icon={Calendar} />
        <MetricCard label={t("dp.accuracy")} value={String(stats?.signal_accuracy ?? 94)} unit="%" helper={t("dp.accuracy.help")} tone="mint" icon={Activity} />
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>{t("dp.signals")}</h2>
          {patients.length === 0 ? (
            <div className="empty-state">
              <Users size={28} />
              <p>{t("dp.signals.empty")}</p>
            </div>
          ) : (
            <div className="list">
              {patients.map((patient) => (
                <div className="list-row" key={patient.id}>
                  <div className="list-row__main">
                    <strong>{patient.name}</strong>
                    <span>
                      {patient.age ? `${patient.age} ${t("dp.years")} · ` : ""}
                      {patient.signal} · {patient.last_check}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      className="icon-btn"
                      title={t("dp.triage.title")}
                      onClick={() => handleTriage(patient)}
                      style={{ width: 32, height: 32 }}
                    >
                      <Bot size={14} color="var(--teal)" />
                    </button>
                    <StatusPill tone={riskTone(patient.risk_key)}>{patient.risk}</StatusPill>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card">
          <h2>{t("apt.mine")}</h2>
          {appointments.length === 0 ? (
            <div className="empty-state">
              <Calendar size={28} />
              <p>{t("apt.empty")}</p>
            </div>
          ) : (
            <div className="list">
              {appointments.slice(0, 6).map((a) => (
                <div className="list-row" key={a.id}>
                  <div className="list-row__main">
                    <strong>{a.patient_name}</strong>
                    <span>{a.specialty} · {a.date} {a.time}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {a.status === "pending" ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => updateAppt(a.id, "confirmed")}>
                          {t("apt.status.confirmed")}
                        </Button>
                      </>
                    ) : (
                      <StatusPill tone={a.status === "confirmed" ? "mint" : a.status === "done" ? "blue" : "rose"}>
                        {t(`apt.status.${a.status}`)}
                      </StatusPill>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <article className="form-panel">
        <h2>{t("dp.advice")}</h2>
        <form onSubmit={sendAdvice}>
          <div className="form-grid two">
            <label className="field">
              <span>{t("dp.advice.patient")}</span>
              <select value={advice.patientId} onChange={(e) => setAdvice((c) => ({ ...c, patientId: e.target.value }))}>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t("dp.advice.priority")}</span>
              <select value={advice.priority} onChange={(e) => setAdvice((c) => ({ ...c, priority: e.target.value }))}>
                <option value="normal">{t("dp.advice.pr.normal")}</option>
                <option value="urgent">{t("dp.advice.pr.urgent")}</option>
                <option value="prevention">{t("dp.advice.pr.prevention")}</option>
              </select>
            </label>
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            <span>{t("dp.advice.label")}</span>
            <textarea value={advice.message} onChange={(e) => setAdvice((c) => ({ ...c, message: e.target.value }))} />
          </label>
          <div className="auth-actions">
            <Button type="submit" disabled={sending || !advice.patientId}>
              {sending ? <span className="spinner spinner-light" /> : <MessageSquareText size={17} />} {t("dp.advice.send")}
            </Button>
          </div>
        </form>
      </article>

      <TriageModal
        open={triage.open}
        loading={triage.loading}
        title={triage.title}
        text={triage.text}
        onClose={() => setTriage({ open: false, loading: false, title: "", text: "" })}
      />
    </div>
  );
}
