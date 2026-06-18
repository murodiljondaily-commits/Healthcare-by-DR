import { Brain, HeartHandshake, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { MetricCard } from "../../components/MetricCard.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

const scores = [0, 1, 2, 3];

export function MentalHealth({ go }) {
  const { t } = useI18n();
  const toast = useToast();

  const tests = [
    {
      id: "phq2",
      title: t("mh.phq2.title"),
      type: t("mh.phq2.type"),
      disclaimer: t("mh.phq2.disc"),
      questions: [t("mh.phq2.q1"), t("mh.phq2.q2")],
    },
    {
      id: "gad2",
      title: t("mh.gad2.title"),
      type: t("mh.gad2.type"),
      disclaimer: t("mh.gad2.disc"),
      questions: [t("mh.gad2.q1"), t("mh.gad2.q2")],
    },
  ];

  const [testId, setTestId] = useState(tests[0].id);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const test = tests.find((item) => item.id === testId) || tests[0];

  const total = useMemo(
    () => test.questions.reduce((sum, _q, i) => sum + Number(answers[`${test.id}-${i}`] || 0), 0),
    [answers, test]
  );

  const level = total <= 1 ? "low" : total <= 3 ? "medium" : "high";
  const tone = level === "low" ? "mint" : level === "medium" ? "amber" : "rose";

  const save = async () => {
    setSaving(true);
    try {
      await api.submitMental({ test_id: test.id, score: total });
      toast.success(t("mh.saved"));
      go("appointments");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={t("mh.title")}
        subtitle={t("mh.subtitle")}
        icon={Brain}
        go={go}
        action={<StatusPill tone={tone}>{t(`mh.level.${level}`)}</StatusPill>}
      />

      <section className="grid grid-3">
        <MetricCard label={t("mh.score")} value={total} helper={test.type} tone={tone} icon={Brain} />
        <MetricCard label={t("mh.selfcare")} value="10" unit="min" helper={t("mh.selfcare.help")} tone="mint" icon={HeartHandshake} />
        <MetricCard label={t("mh.redflag")} value="24/7" helper={t("mh.redflag.help")} tone="rose" icon={ShieldAlert} />
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>{t("mh.choose")}</h2>
          <div className="list">
            {tests.map((item) => (
              <button
                className={`select-card ${item.id === testId ? "active" : ""}`}
                type="button"
                key={item.id}
                onClick={() => {
                  setTestId(item.id);
                  setAnswers({});
                }}
              >
                <span className="select-icon">
                  <Brain size={21} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <span className="tiny">{item.type} · {item.disclaimer}</span>
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="form-panel">
          <h2>{test.title}</h2>
          <div className="list">
            {test.questions.map((question, index) => (
              <div className="list-row" key={question}>
                <div className="list-row__main">
                  <strong>{question}</strong>
                  <span>{t("mh.scale")}</span>
                </div>
                <select
                  value={answers[`${test.id}-${index}`] || 0}
                  onChange={(e) => setAnswers((cur) => ({ ...cur, [`${test.id}-${index}`]: e.target.value }))}
                >
                  {scores.map((score) => (
                    <option key={score} value={score}>
                      {score}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mental-result">
            <StatusPill tone={tone}>{t(`mh.level.${level}`)}</StatusPill>
            <p>{t(`mh.text.${level}`)}</p>
            <small>{test.disclaimer} {t("mh.result.disclaimer")}</small>
          </div>
          <div className="auth-actions">
            <Button onClick={save} disabled={saving}>
              {saving ? <span className="spinner spinner-light" /> : null} {t("mh.book")}
            </Button>
            <Button variant="secondary" onClick={() => go("ai")}>
              {t("mh.discuss")}
            </Button>
          </div>
        </article>
      </section>
    </div>
  );
}
