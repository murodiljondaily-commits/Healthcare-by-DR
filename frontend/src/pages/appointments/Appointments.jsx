import { CalendarCheck, Clock, Send, Star, Stethoscope, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

function tomorrowPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function Appointments({ go }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();

  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(null);
  const [date, setDate] = useState(tomorrowPlus(1));
  const [time, setTime] = useState("10:00");
  const [reason, setReason] = useState(t("apt.reason.default"));
  const [appointments, setAppointments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadAppointments = async () => {
    try {
      setAppointments(await api.appointments());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let active = true;
    api
      .doctors()
      .then((data) => {
        if (!active) return;
        setDoctors(data.doctors || []);
        if (data.doctors?.length) setDoctorId(data.doctors[0].id);
      })
      .catch(() => {});
    loadAppointments();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doctor = useMemo(() => doctors.find((d) => d.id === doctorId) || doctors[0], [doctors, doctorId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!doctor) return;
    setSubmitting(true);
    try {
      await api.createAppointment({
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        specialty: doctor.specialty,
        date,
        time,
        reason,
      });
      toast.success(t("apt.sent"));
      await loadAppointments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id) => {
    try {
      await api.cancelAppointment(id);
      toast.info(t("apt.status.cancelled"));
      await loadAppointments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const statusTone = (s) =>
    s === "confirmed" ? "mint" : s === "cancelled" ? "rose" : s === "done" ? "blue" : "amber";

  return (
    <div className="page">
      <PageHeader
        title={t("apt.title")}
        subtitle={t("apt.subtitle")}
        icon={CalendarCheck}
        go={go}
        action={<StatusPill tone="teal">{t("apt.online")}</StatusPill>}
      />

      <section className="grid grid-2">
        <article className="card">
          <h2>{t("apt.choose")}</h2>
          <div className="list">
            {doctors.map((item) => (
              <button
                className={`select-card ${doctorId === item.id ? "active" : ""}`}
                key={item.id}
                type="button"
                onClick={() => setDoctorId(item.id)}
              >
                <span className="select-icon">
                  <Stethoscope size={22} />
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <span className="tiny">{item.specialty}</span>
                </span>
                <StatusPill tone="mint">
                  <Star size={13} /> {item.rating}
                </StatusPill>
              </button>
            ))}
          </div>
        </article>

        <form className="form-panel" onSubmit={submit}>
          <h2>{t("apt.details")}</h2>
          <div className="form-grid">
            <label className="field">
              <span>{t("apt.selected")}</span>
              <input value={doctor ? `${doctor.name} · ${doctor.specialty}` : ""} readOnly />
            </label>
            <div className="form-grid two">
              <label className="field">
                <span>{t("apt.date")}</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="field">
                <span>{t("apt.time")}</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </label>
            </div>
            <label className="field">
              <span>{t("apt.reason")}</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
          </div>
          <div className="auth-actions">
            <Button type="submit" disabled={submitting || !doctor}>
              {submitting ? <span className="spinner spinner-light" /> : <Send size={17} />} {t("apt.submit")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => go("ai")}>
              <Clock size={17} /> {t("apt.triage")}
            </Button>
          </div>
        </form>
      </section>

      <article className="card">
        <h2>{t("apt.mine")}</h2>
        {appointments.length === 0 ? (
          <div className="empty-state">
            <CalendarCheck size={28} />
            <p>{t("apt.empty")}</p>
          </div>
        ) : (
          <div className="list">
            {appointments.map((a) => (
              <div className="list-row" key={a.id}>
                <div className="list-row__main">
                  <strong>{a.doctor_name || a.specialty}</strong>
                  <span>
                    {a.specialty} · {a.date} {a.time} · {a.reason}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <StatusPill tone={statusTone(a.status)}>{t(`apt.status.${a.status}`)}</StatusPill>
                  {a.status === "pending" || a.status === "confirmed" ? (
                    <button className="icon-btn" type="button" onClick={() => cancel(a.id)} aria-label={t("apt.cancel")} style={{ width: 34, height: 34 }}>
                      <X size={15} color="var(--rose)" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
