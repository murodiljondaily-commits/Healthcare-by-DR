import { StatusPill } from "./StatusPill.jsx";

export function MetricCard({ label, value, unit, helper, tone = "teal", icon: Icon }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-card__top">
        <span>{label}</span>
        {Icon ? <Icon size={19} strokeWidth={2.3} /> : null}
      </div>
      <strong>
        {value}
        {unit ? <small>{unit}</small> : null}
      </strong>
      {helper ? <StatusPill tone={tone}>{helper}</StatusPill> : null}
    </article>
  );
}
