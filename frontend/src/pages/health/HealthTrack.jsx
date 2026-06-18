import { Activity, Droplets, HeartPulse, Moon, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { MetricCard } from "../../components/MetricCard.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export function HealthTrack({ go }) {
  const { t } = useI18n();
  const toast = useToast();
  const [vitals, setVitals] = useState([]);
  const [form, setForm] = useState({ pulse: 72, pressure: "120/80", sleep: 7.2, water: 1.9, steps: 8000 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setVitals(await api.vitals());
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latest = vitals[vitals.length - 1] || { pulse: 72, pressure: "120/80", sleep: 7.2, water: 1.9 };
  const last7 = vitals.slice(-7);
  const maxPulse = Math.max(80, ...last7.map((v) => v.pulse));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.addVital({
        pulse: Number(form.pulse),
        pressure: form.pressure,
        sleep: Number(form.sleep),
        water: Number(form.water),
        steps: Number(form.steps),
      });
      toast.success(t("ht.saved"));
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={t("ht.title")}
        subtitle={t("ht.subtitle")}
        icon={HeartPulse}
        go={go}
        action={
          <Button size="sm" onClick={() => document.getElementById("vital-pulse")?.focus()}>
            <Plus size={17} /> {t("ht.new")}
          </Button>
        }
      />

      <section className="grid grid-4">
        <MetricCard label={t("ht.pulse")} value={latest.pulse} unit="bpm" helper={t("ht.normal")} tone="teal" icon={HeartPulse} />
        <MetricCard label={t("ht.pressure")} value={latest.pressure} helper={t("ht.optimal")} tone="blue" icon={Activity} />
        <MetricCard label={t("ht.sleep")} value={latest.sleep} unit="h" helper="+0.4h" tone="mint" icon={Moon} />
        <MetricCard label={t("ht.water")} value={latest.water} unit="L" helper="95%" tone="amber" icon={Droplets} />
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>{t("ht.trend")}</h2>
          <div className="bar-chart">
            {last7.map((item, i) => (
              <div key={item.id || i}>
                <span style={{ "--bar": `${(item.pulse / maxPulse) * 150}px` }} />
                <span>{WEEKDAYS[i % 7]}</span>
              </div>
            ))}
          </div>
        </article>

        <form className="form-panel" onSubmit={save}>
          <h2>{t("ht.quick")}</h2>
          <div className="form-grid two">
            <label className="field">
              <span>{t("ht.pulse")}</span>
              <input id="vital-pulse" type="number" value={form.pulse} onChange={(e) => setForm((f) => ({ ...f, pulse: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("ht.pressure")}</span>
              <input value={form.pressure} onChange={(e) => setForm((f) => ({ ...f, pressure: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("ht.sleep")}</span>
              <input type="number" step="0.1" value={form.sleep} onChange={(e) => setForm((f) => ({ ...f, sleep: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("ht.water")}</span>
              <input type="number" step="0.1" value={form.water} onChange={(e) => setForm((f) => ({ ...f, water: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("ht.steps")}</span>
              <input type="number" value={form.steps} onChange={(e) => setForm((f) => ({ ...f, steps: e.target.value }))} />
            </label>
          </div>
          <div className="auth-actions">
            <Button type="submit" disabled={saving}>
              {saving ? <span className="spinner spinner-light" /> : null} {t("common.save")}
            </Button>
            <StatusPill tone="mint">{t("ht.ready")}</StatusPill>
          </div>
        </form>
      </section>
    </div>
  );
}
