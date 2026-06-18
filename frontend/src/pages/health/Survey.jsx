import { ClipboardCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

export function Survey({ go }) {
  const { t } = useI18n();
  const toast = useToast();
  const questions = [t("sv.q1"), t("sv.q2"), t("sv.q3"), t("sv.q4"), t("sv.q5")];
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  const yesCount = Object.values(answers).filter(Boolean).length;
  const risk = yesCount <= 1 ? "low" : yesCount <= 3 ? "medium" : "high";
  const tone = risk === "low" ? "mint" : risk === "medium" ? "amber" : "rose";

  const save = async () => {
    setSaving(true);
    try {
      const arr = questions.map((_q, i) => Boolean(answers[i]));
      await api.submitSurvey(arr);
      toast.success(t("sv.saved"));
      go("dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={t("sv.title")}
        subtitle={t("sv.subtitle")}
        icon={ClipboardCheck}
        go={go}
        action={<StatusPill tone={tone}>{t(`sv.risk.${risk}`)} {t("sv.risk")}</StatusPill>}
      />

      <article className="form-panel">
        <h2>{t("sv.questions")}</h2>
        <div className="list">
          {questions.map((question, index) => (
            <label className="list-row" key={question}>
              <span className="list-row__main">
                <strong>{question}</strong>
                <span>{t("sv.markyes")}</span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(answers[index])}
                onChange={(e) => setAnswers((cur) => ({ ...cur, [index]: e.target.checked }))}
              />
            </label>
          ))}
        </div>
        <div className="auth-actions">
          <Button onClick={save} disabled={saving}>
            {saving ? <span className="spinner spinner-light" /> : <ShieldCheck size={17} />} {t("sv.save")}
          </Button>
        </div>
      </article>
    </div>
  );
}
