export function StatusPill({ children, tone = "teal" }) {
  return <span className={`status-pill status-${tone}`}>{children}</span>;
}
