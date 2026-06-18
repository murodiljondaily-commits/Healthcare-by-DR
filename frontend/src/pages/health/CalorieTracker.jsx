import { Apple, Flame, Plus, Trash2, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { MetricCard } from "../../components/MetricCard.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { ProgressRing } from "../../components/ProgressRing.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

const TARGET = 2200;

export function CalorieTracker({ go }) {
  const { t } = useI18n();
  const toast = useToast();
  const [meals, setMeals] = useState([]);
  const [form, setForm] = useState({ title: "", menu: "", kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setMeals(await api.meals());
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [meals]);

  const add = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.addMeal({
        title: form.title,
        menu: form.menu,
        kcal: Number(form.kcal) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
      });
      setForm({ title: "", menu: "", kcal: 0, protein: 0, carbs: 0, fat: 0 });
      toast.success(t("common.saved"));
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteMeal(id);
      setMeals((cur) => cur.filter((m) => m.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={t("cal.title")}
        subtitle={t("cal.subtitle")}
        icon={Apple}
        go={go}
        action={
          <Button size="sm" onClick={() => document.getElementById("meal-title")?.focus()}>
            <Plus size={17} /> {t("cal.add")}
          </Button>
        }
      />

      <section className="hero-panel">
        <ProgressRing value={Math.round((totals.kcal / TARGET) * 100)} label={totals.kcal} sublabel={t("cal.today")} tone="mint" />
        <div className="grid grid-2">
          <MetricCard label={t("cal.protein")} value={totals.protein} unit="g" helper={t("cal.good")} tone="mint" icon={Utensils} />
          <MetricCard label={t("cal.carbs")} value={totals.carbs} unit="g" helper={t("cal.controlled")} tone="blue" icon={Apple} />
          <MetricCard label={t("cal.fat")} value={totals.fat} unit="g" helper={t("ht.normal")} tone="amber" icon={Flame} />
          <MetricCard label={t("cal.left")} value={Math.max(0, TARGET - totals.kcal)} unit="kcal" helper={t("cal.target")} tone="teal" icon={Plus} />
        </div>
      </section>

      <article className="card">
        <h2>{t("cal.meals")}</h2>
        {meals.length === 0 ? (
          <div className="empty-state">
            <Apple size={28} />
            <p>{t("cal.empty")}</p>
          </div>
        ) : (
          <div className="list">
            {meals.map((meal) => (
              <div className="list-row" key={meal.id}>
                <div className="list-row__main">
                  <strong>{meal.title}</strong>
                  <span>{meal.menu}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <StatusPill tone="teal">{meal.kcal} kcal</StatusPill>
                  <button className="icon-btn" type="button" onClick={() => remove(meal.id)} style={{ width: 34, height: 34 }} aria-label={t("common.delete")}>
                    <Trash2 size={15} color="var(--rose)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="form-panel">
        <h2>{t("cal.add")}</h2>
        <form onSubmit={add}>
          <div className="form-grid two">
            <label className="field">
              <span>{t("cal.field.title")}</span>
              <input id="meal-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </label>
            <label className="field">
              <span>{t("cal.field.menu")}</span>
              <input value={form.menu} onChange={(e) => setForm((f) => ({ ...f, menu: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("cal.field.kcal")}</span>
              <input type="number" min="0" value={form.kcal} onChange={(e) => setForm((f) => ({ ...f, kcal: e.target.value }))} />
            </label>
            <label className="field">
              <span>{t("cal.protein")} (g)</span>
              <input type="number" min="0" value={form.protein} onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))} />
            </label>
          </div>
          <div className="auth-actions">
            <Button type="submit" disabled={saving}>
              {saving ? <span className="spinner spinner-light" /> : <Plus size={17} />} {t("cal.add")}
            </Button>
          </div>
        </form>
      </article>
    </div>
  );
}
