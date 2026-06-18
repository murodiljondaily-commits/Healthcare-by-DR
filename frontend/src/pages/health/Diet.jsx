import { Apple, Droplets, Flame, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { MetricCard } from "../../components/MetricCard.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

export function Diet({ go }) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [meals, setMeals] = useState([]);
  const [goal, setGoal] = useState("Balance");
  const [limits, setLimits] = useState(t("diet.limits.default"));
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.meals().then(setMeals).catch(() => {});
  }, []);

  const buildPlan = async () => {
    setLoading(true);
    setPlan("");
    try {
      const prompt = `Diet goal: ${goal}. Restrictions: ${limits}. ${t("diet.build")}.`;
      const res = await api.aiChat({ messages: [{ role: "user", text: prompt }], locale, context: { feature: "diet", goal } });
      setPlan(res.text);
      toast.success(t("common.saved"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={t("diet.title")}
        subtitle={t("diet.subtitle")}
        icon={Utensils}
        go={go}
        action={<Button size="sm" onClick={buildPlan}>{t("diet.update")}</Button>}
      />

      <section className="grid grid-4">
        <MetricCard label={t("diet.target")} value="2200" unit="kcal" helper={t("diet.daily")} tone="teal" icon={Flame} />
        <MetricCard label={t("diet.protein")} value="120" unit="g" helper={t("diet.goal")} tone="mint" icon={Utensils} />
        <MetricCard label={t("diet.water")} value="2.2" unit="L" helper={t("diet.daily")} tone="blue" icon={Droplets} />
        <MetricCard label={t("diet.fiber")} value="28" unit="g" helper={t("diet.optimal")} tone="amber" icon={Apple} />
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>{t("diet.menu")}</h2>
          <div className="list">
            {meals.length === 0 ? (
              <div className="empty-state"><Apple size={26} /><p>{t("cal.empty")}</p></div>
            ) : (
              meals.map((meal) => (
                <div className="list-row" key={meal.id}>
                  <div className="list-row__main">
                    <strong>{meal.title}</strong>
                    <span>{meal.menu}</span>
                  </div>
                  <StatusPill tone="mint">{meal.protein}g protein</StatusPill>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="form-panel">
          <h2>{t("diet.ai")}</h2>
          <div className="form-grid">
            <label className="field">
              <span>{t("diet.goal.label")}</span>
              <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option value="Balance">{t("diet.goal.balance")}</option>
                <option value="Weight loss">{t("diet.goal.loss")}</option>
                <option value="Muscle gain">{t("diet.goal.gain")}</option>
              </select>
            </label>
            <label className="field">
              <span>{t("diet.limits")}</span>
              <textarea value={limits} onChange={(e) => setLimits(e.target.value)} />
            </label>
          </div>
          <div className="auth-actions">
            <Button onClick={buildPlan} disabled={loading}>
              {loading ? <span className="spinner spinner-light" /> : null} {t("diet.build")}
            </Button>
          </div>
          {plan ? (
            <div className="mental-result" style={{ marginTop: 14 }}>
              <p style={{ whiteSpace: "pre-wrap" }}>{plan}</p>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
