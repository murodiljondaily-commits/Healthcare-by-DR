export function ProgressRing({ value, label, sublabel, tone = "teal" }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`progress-ring progress-${tone}`}
      style={{ "--progress": `${clamped}%` }}
      role="img"
      aria-label={`${label}: ${clamped}%`}
    >
      <div>
        <strong>{label}</strong>
        <span>{sublabel}</span>
      </div>
    </div>
  );
}
