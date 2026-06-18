import { Globe } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { LOCALES } from "../i18n/translations.js";

const SHORT = { uz: "UZ", ru: "RU", en: "EN" };

// Compact segmented language switcher. `variant="light"` for dark backgrounds.
export function LanguageSwitcher({ variant = "default" }) {
  const { locale, setLocale } = useI18n();
  return (
    <div className={`lang-switch lang-switch--${variant}`} role="group" aria-label="Language">
      <Globe size={15} className="lang-switch__icon" />
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-switch__btn ${locale === code ? "active" : ""}`}
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
        >
          {SHORT[code]}
        </button>
      ))}
    </div>
  );
}
