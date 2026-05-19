"use client";

import { useEffect, useState } from "react";
import CustomSelect from "@/app/components/CustomSelect";
import { useCurrency } from "@/app/components/CurrencyProvider";
import { CURRENCY_OPTIONS, isSupportedCurrency } from "@/lib/currency";

const THEME_STORAGE_KEY = "jp-theme";
const LANGUAGE_STORAGE_KEY = "jp-language";
const GOOGLE_TRANSLATE_SCRIPT_ID = "jp-google-translate-script";
const GOOGLE_TRANSLATE_ROOT_ID = "jp-google-translate-root";
const GOOGLE_TRANSLATE_SELECT = ".goog-te-combo";

type Theme = "light" | "dark";
type LanguageOption = { value: string; label: string };

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "bn", label: "Bengali" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ur", label: "Urdu" },
  { value: "id", label: "Indonesian" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
  { value: "ms", label: "Malay" },
  { value: "tr", label: "Turkish" },
  { value: "vi", label: "Vietnamese" },
  { value: "tl", label: "Tagalog" },
] as const satisfies readonly LanguageOption[];

const DEFAULT_LANGUAGE = "en";
const GOOGLE_TRANSLATE_LANGUAGES = LANGUAGE_OPTIONS.map((option) => option.value).join(",");

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (
          options: { pageLanguage: string; autoDisplay: boolean; includedLanguages: string },
          element: string,
        ) => unknown;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function applyLanguage(language: string) {
  document.documentElement.setAttribute("lang", language);
}

function ensureGoogleTranslateElement() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const translateElement = window.google?.translate?.TranslateElement;
  if (!translateElement) {
    return false;
  }

  if (!document.getElementById(GOOGLE_TRANSLATE_ROOT_ID)) {
    const root = document.createElement("div");
    root.id = GOOGLE_TRANSLATE_ROOT_ID;
    root.className = "jp-google-translate-root";
    root.setAttribute("aria-hidden", "true");
    document.body.appendChild(root);
  }

  if (!document.querySelector(GOOGLE_TRANSLATE_SELECT)) {
    new translateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
        includedLanguages: GOOGLE_TRANSLATE_LANGUAGES,
      },
      GOOGLE_TRANSLATE_ROOT_ID,
    );
  }

  return true;
}

async function loadGoogleTranslateWidget() {
  if (ensureGoogleTranslateElement()) {
    return true;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const existingScript = document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID) as HTMLScriptElement | null;
  if (!existingScript) {
    window.googleTranslateElementInit = () => {
      ensureGoogleTranslateElement();
    };

    const script = document.createElement("script");
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.async = true;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }

  return new Promise<boolean>((resolve) => {
    const startedAt = Date.now();
    const maxWaitMs = 4500;

    const check = () => {
      if (ensureGoogleTranslateElement() && document.querySelector(GOOGLE_TRANSLATE_SELECT)) {
        resolve(true);
        return;
      }

      if (Date.now() - startedAt > maxWaitMs) {
        resolve(false);
        return;
      }

      window.setTimeout(check, 100);
    };

    check();
  });
}

async function applyGoogleLanguage(language: string) {
  const widgetReady = await loadGoogleTranslateWidget();
  if (!widgetReady) {
    return false;
  }

  const select = document.querySelector<HTMLSelectElement>(GOOGLE_TRANSLATE_SELECT);
  if (!select) {
    return false;
  }

  if (!Array.from(select.options).some((option) => option.value === language)) {
    return false;
  }

  if (select.value !== language) {
    select.value = language;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  return true;
}

export default function HeaderPreferences() {
  const { currency, setCurrency } = useCurrency();
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    queueMicrotask(() => {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      const initialTheme: Theme =
        savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? DEFAULT_LANGUAGE;
      const hasSupportedLanguage = LANGUAGE_OPTIONS.some((option) => option.value === savedLanguage);
      const initialLanguage = hasSupportedLanguage ? savedLanguage : DEFAULT_LANGUAGE;

      setTheme(initialTheme);
      setLanguage(initialLanguage);
      applyTheme(initialTheme);
      applyLanguage(initialLanguage);
      setPreferencesReady(true);
    });
  }, []);

  useEffect(() => {
    if (!preferencesReady) {
      return;
    }

    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, preferencesReady]);

  useEffect(() => {
    if (!preferencesReady) {
      return;
    }

    applyLanguage(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    void applyGoogleLanguage(language);
  }, [language, preferencesReady]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }

  function handleLanguageChange(nextLanguage: string) {
    setLanguage(nextLanguage);
  }

  function handleCurrencyChange(next: string) {
    if (isSupportedCurrency(next)) {
      setCurrency(next);
    }
  }

  return (
    <div className="header-preferences" aria-label="Display, currency, and language preferences">
      <button type="button" className="header-pref-trigger" aria-label="Open display and language preferences">
        <svg viewBox="0 0 14 10" aria-hidden="true" className="header-pref-trigger-icon">
          <path d="M9.5 1.75L4.5 5L9.5 8.25" />
        </svg>
      </button>

      <div className="header-pref-panel">
        <button type="button" onClick={toggleTheme} className="header-pref-theme-button" aria-label="Toggle light and dark theme">
          <span className="header-pref-theme-icon" aria-hidden="true">
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24">
                <path d="M12 3.2V1.5M12 22.5v-1.7M5.65 5.65L4.45 4.45M19.55 19.55l-1.2-1.2M3.2 12H1.5M22.5 12h-1.7M5.65 18.35l-1.2 1.2M19.55 4.45l-1.2 1.2M12 17a5 5 0 1 0 0-10a5 5 0 0 0 0 10Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M21 13.1a8.5 8.5 0 1 1-10.1-10a7.2 7.2 0 1 0 10.1 10Z" />
              </svg>
            )}
          </span>
          <span>{theme === "dark" ? "Dark" : "Light"}</span>
        </button>

        <label className="header-pref-currency-label">
          <span className="sr-only">Currency for prices</span>
          <CustomSelect
            className="custom-select--header-currency"
            options={[...CURRENCY_OPTIONS]}
            value={currency}
            onChange={handleCurrencyChange}
            optionsAriaLabel="Choose display currency"
            placeholder="Currency"
          />
        </label>

        <label className="header-pref-language-label">
          <span className="sr-only">Language</span>
          <CustomSelect
            className="custom-select--header-language"
            options={LANGUAGE_OPTIONS.map((option) => option)}
            value={language}
            onChange={handleLanguageChange}
            optionsAriaLabel="Choose language"
            placeholder="Choose language"
          />
        </label>
      </div>
    </div>
  );
}
