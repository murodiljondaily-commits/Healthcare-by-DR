import { ChevronLeft } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";

export function PageHeader({ title, subtitle, icon: Icon, go, backTo = "dashboard", action }) {
  const { t } = useI18n();
  return (
    <header className="page-header">
      <div className="page-header__main">
        {go ? (
          <button className="icon-btn" type="button" onClick={() => go(backTo)} aria-label={t("common.back")}>
            <ChevronLeft size={21} />
          </button>
        ) : null}
        {Icon ? (
          <div className="page-header__icon">
            <Icon size={24} />
          </div>
        ) : null}
        <div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="page-header__action">{action}</div> : null}
    </header>
  );
}
