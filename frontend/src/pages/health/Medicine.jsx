import { Bell, Check, Clock, Pill, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { MetricCard } from "../../components/MetricCard.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

export function Medicine({ go }) {
  const { t } = useI18n();
  const toast = useToast();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", dose: "1 tabletka", time: "08:00", stock: 30 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await api.medicines();
      setMedicines(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    if (medicines.length === 0) return { adherence: 0, today: 0, next: "—", nextName: "" };
    const adherence = Math.round(medicines.reduce((s, m) => s + m.adherence, 0) / medicines.length);
    const sorted = [...medicines].sort((a, b) => a.time.localeCompare(b.time));
    return { adherence, today: medicines.length, next: sorted[0].time, nextName: sorted[0].name };
  }, [medicines]);

  const add = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.addMedicine({ ...form, stock: Number(form.stock) || 0 });
      setForm({ name: "", dose: "1 tabletka", time: "08:00", stock: 30 });
      toast.success(t("med.create"));
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const take = async (id) => {
    try {
      const updated = await api.takeMedicine(id);
      setMedicines((cur) => cur.map((m) => (m.id === id ? updated : m)));
      toast.success(t("med.take"));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteMedicine(id);
      setMedicines((cur) => cur.filter((m) => m.id !== id));
      toast.success(t("common.delete"));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={t("med.title")}
        subtitle={t("med.subtitle")}
        icon={Pill}
        go={go}
        action={
          <Button size="sm" onClick={() => document.getElementById("med-name")?.focus()}>
            <Plus size={17} /> {t("med.add")}
          </Button>
        }
      />

      <section className="grid grid-3">
        <MetricCard label={t("med.adherence")} value={String(stats.adherence)} unit="%" helper={t("med.adherence.help")} tone="mint" icon={Check} />
        <MetricCard label={t("med.today")} value={String(stats.today)} helper={t("med.active")} tone="teal" icon={Pill} />
        <MetricCard label={t("med.next")} value={stats.next} helper={stats.nextName} tone="amber" icon={Clock} />
      </section>

      <article className="card">
        <h2>{t("med.active")}</h2>
        {loading ? (
          <div className="empty-state"><span className="spinner" /></div>
        ) : medicines.length === 0 ? (
          <div className="empty-state">
            <Pill size={28} />
            <p>{t("med.empty")}</p>
          </div>
        ) : (
          <div className="list">
            {medicines.map((item) => (
              <div className="list-row" key={item.id}>
                <div className="list-row__main">
                  <strong>{item.name}</strong>
                  <span>
                    {item.dose} · {item.time} · {item.stock} {t("med.left")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <StatusPill tone={item.adherence >= 90 ? "mint" : "amber"}>{item.adherence}%</StatusPill>
                  <Button size="sm" variant="secondary" onClick={() => take(item.id)}>
                    <Check size={15} /> {t("med.take")}
                  </Button>
                  <button className="icon-btn" type="button" onClick={() => remove(item.id)} aria-label={t("common.delete")} style={{ width: 36, height: 36 }}>
                    <Trash2 size={15} color="var(--rose)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="form-panel">
        <h2>{t("med.new")}</h2>
        <form onSubmit={add}>
          <div className="form-grid two">
            <label className="field">
              <span>{t("med.field.name")}</span>
              <input id="med-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("med.field.name.ph")} required />
            </label>
            <label className="field">
              <span>{t("med.field.dose")}</span>
              <input value={form.dose} onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("med.field.time")}</span>
              <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("med.field.stock")}</span>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
            </label>
          </div>
          <div className="auth-actions">
            <Button type="submit" disabled={saving}>
              {saving ? <span className="spinner spinner-light" /> : <Bell size={17} />} {t("med.create")}
            </Button>
          </div>
        </form>
      </article>
    </div>
  );
}
