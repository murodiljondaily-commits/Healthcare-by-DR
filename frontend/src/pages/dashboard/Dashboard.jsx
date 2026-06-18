import {
  Activity,
  Apple,
  Bot,
  Brain,
  Calendar,
  CalendarCheck,
  Droplets,
  HeartPulse,
  Pill,
  ShieldCheck,
  Stethoscope,
  Timer,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { MetricCard } from "../../components/MetricCard.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { ProgressRing } from "../../components/ProgressRing.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

const metricIcons = [ShieldCheck, HeartPulse, Activity, Droplets];

export function Dashboard({ go }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [summary, setSummary] = useState(null);
  const [advice, setAdvice] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([api.dashboardSummary().catch(() => null), api.myAdvice().catch(() => [])]).then(
      ([s, a]) => {
        if (!active) return;
        setSummary(s);
        setAdvice(Array.isArray(a) ? a : []);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const titleKey =
    user.role === "doctor" ? "dash.title.doctor" : user.role === "person" ? "dash.title.person" : "dash.title.patient";
  const headKey =
    user.role === "doctor" ? "dash.head.doctor" : user.role === "person" ? "dash.head.person" : "dash.head.patient";

  const s = summary || {};
  const score = s.health_score ?? 88;
  const metrics = [
    { label: t("dash.metric.healthscore"), value: String(score), unit: "/100", tone: "mint", helper: `+6 ${t("dash.metric.week")}` },
    { label: t("dash.metric.pulse"), value: String(s.pulse ?? 72), unit: "bpm", tone: "teal", helper: t("dash.metric.normal") },
    { label: t("dash.metric.pressure"), value: s.pressure ?? "120/80", unit: "", tone: "blue", helper: t("dash.metric.stable") },
    { label: t("dash.metric.steps"), value: (s.steps ?? 7420).toLocaleString(), unit: "", tone: "amber", helper: `74${t("dash.metric.target") || "%"}` },
  ];

  const medCount = s.medicine_count ?? 3;

  const quick = [
    { key: "appointments", icon: CalendarCheck, title: t("dash.q.book"), sub: t("dash.q.book.sub") },
    { key: "mental", icon: Brain, title: t("dash.q.mental"), sub: t("dash.q.mental.sub") },
    { key: "medicine", icon: Pill, title: t("dash.q.med"), sub: `${medCount} ${t("dash.q.med.sub")}` },
    { key: "calorie", icon: Apple, title: t("dash.q.cal"), sub: t("dash.q.cal.sub") },
    { key: "walking", icon: Timer, title: t("dash.q.walk"), sub: t("dash.q.walk.sub") },
    { key: "health", icon: Activity, title: t("dash.q.vitals"), sub: t("dash.q.vitals.sub") },
    { key: "diet", icon: Apple, title: t("dash.q.diet"), sub: t("dash.q.diet.sub") },
    { key: "doctor", icon: Calendar, title: t("dash.q.doctor"), sub: t("dash.q.doctor.sub") },
  ];

  const programs = [
    { audience: t("role.person"), title: t("dash.prog.p1"), items: t("dash.prog.p1.items") },
    { audience: t("role.patient"), title: t("dash.prog.p2"), items: t("dash.prog.p2.items") },
    { audience: t("role.doctor"), title: t("dash.prog.p3"), items: t("dash.prog.p3.items") },
  ];

  const priorityTone = (p) => (p === "urgent" ? "rose" : p === "prevention" ? "blue" : "teal");

  return (
    <div className="page">
      <PageHeader
        title={t(titleKey)}
        subtitle={`${user.name.split(" ")[0]}, ${t(headKey)}`}
        icon={HeartPulse}
        action={
          <Button size="sm" onClick={() => go(user.role === "doctor" ? "doctor" : "survey")}>
            <Stethoscope size={17} /> {t("dash.quickcheck")}
          </Button>
        }
      />

      <section className="hero-panel">
        <div className="health-brief">
          <div>
            <StatusPill tone="mint">{t("dash.stable")}</StatusPill>
            <h2>{t("dash.hero")}</h2>
            <p>{t("dash.hero.text")}</p>
            <div className="brief-actions">
              <Button variant="secondary" onClick={() => go("ai")}>
                <Bot size={18} /> {t("dash.ai")}
              </Button>
              <Button variant="secondary" onClick={() => go("appointments")}>
                <CalendarCheck size={18} /> {t("dash.book")}
              </Button>
              <Button variant="ghost" onClick={() => go("mental")}>
                <Brain size={18} /> {t("dash.mental")}
              </Button>
            </div>
          </div>
          <div className="brief-kpis">
            <div>
              <span>{t("dash.kpi.sleep")}</span>
              <strong>{s.sleep ?? 7.2} {t("ht.sleep") === "Uyqu" ? "soat" : "h"}</strong>
            </div>
            <div>
              <span>{t("dash.kpi.water")}</span>
              <strong>{s.water ?? 1.9} L</strong>
            </div>
            <div>
              <span>{t("dash.kpi.med")}</span>
              <strong>{s.medication_adherence ?? 96}%</strong>
            </div>
          </div>
        </div>
        <ProgressRing value={score} label={String(score)} sublabel={t("dash.healthscore")} tone="mint" />
      </section>

      <section className="grid grid-4">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} icon={metricIcons[index]} />
        ))}
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>{t("dash.advice.title")}</h2>
          <div className="list">
            {advice.length === 0 ? (
              <p className="muted">{t("dash.advice.empty")}</p>
            ) : (
              advice.slice(0, 4).map((item) => (
                <div className="list-row" key={item.id}>
                  <div className="list-row__main">
                    <strong>{item.doctor_name}</strong>
                    <span>{item.message}</span>
                  </div>
                  <StatusPill tone={priorityTone(item.priority)}>
                    {t(`dp.advice.pr.${item.priority}`)}
                  </StatusPill>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card">
          <h2>{t("dash.insights")}</h2>
          <div className="list">
            <div className="list-row">
              <div className="list-row__main">
                <strong>{t("dash.ai.summary")}</strong>
                <span>
                  {t("dash.kpi.med")}: {s.medication_adherence ?? 96}% · {t("dash.kpi.sleep")}: {s.sleep ?? 7.2} ·{" "}
                  {t("dash.kpi.water")}: {s.water ?? 1.9} L
                </span>
              </div>
              <ShieldCheck size={22} color="#0f766e" />
            </div>
            <div className="list-row">
              <div className="list-row__main">
                <strong>{t("dash.metric.healthscore")}</strong>
                <span>{score}/100 — {t("dash.stable")}</span>
              </div>
              <Activity size={22} color="#0f766e" />
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-3">
        {quick.map((item) => {
          const Icon = item.icon;
          return (
            <button className="select-card" type="button" key={item.key} onClick={() => go(item.key)}>
              <span className="select-icon">
                <Icon size={22} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <span className="tiny">{item.sub}</span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="grid grid-3">
        {programs.map((program) => (
          <article className="card medical-program" key={program.title}>
            <StatusPill tone="teal">{program.audience}</StatusPill>
            <h3>{program.title}</h3>
            <p className="muted">{program.items}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
