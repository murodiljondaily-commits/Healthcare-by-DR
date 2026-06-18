import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALES, translations } from "./translations.js";

const STORAGE_KEY = "mediself.locale";

function getInitialLocale() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES.includes(saved)) return saved;
    const nav = (navigator.language || "uz").slice(0, 2);
    if (LOCALES.includes(nav)) return nav;
  } catch {
    /* ignore */
  }
  return "uz";
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    } catch {
      /* ignore */
    }
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (LOCALES.includes(next)) setLocaleState(next);
  }, []);

  // t(key, fallback?) -> returns the translated string, falling back to uz,
  // then the provided fallback, then the key itself.
  const t = useCallback(
    (key, fallback) => {
      const dict = translations[locale] || translations.uz;
      if (key in dict) return dict[key];
      if (key in translations.uz) return translations.uz[key];
      return fallback !== undefined ? fallback : key;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback if a component is rendered outside the provider.
    return {
      locale: "uz",
      setLocale: () => {},
      t: (key, fallback) => translations.uz[key] ?? fallback ?? key,
    };
  }
  return ctx;
}
