/**
 * Display-only conversion from stored PHP amounts.
 * Rates are indicative; update periodically. Payment remains in PHP (Xendit).
 */

export const BASE_CURRENCY = "PHP" as const;

export type SupportedCurrency = "PHP" | "USD" | "EUR" | "GBP" | "AUD" | "SGD" | "JPY" | "KRW" | "AED" | "CAD";

/** How many PHP equal one unit of foreign currency (e.g. 1 USD ≈ 58 PHP). */
export const PHP_PER_UNIT: Record<SupportedCurrency, number> = {
  PHP: 1,
  USD: 58,
  EUR: 63,
  GBP: 74,
  AUD: 38,
  SGD: 43,
  JPY: 0.38,
  KRW: 0.042,
  AED: 15.8,
  CAD: 41,
};

export const CURRENCY_OPTIONS: ReadonlyArray<{ value: SupportedCurrency; label: string }> = [
  { value: "PHP", label: "PHP" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "AUD", label: "AUD" },
  { value: "SGD", label: "SGD" },
  { value: "JPY", label: "JPY" },
  { value: "KRW", label: "KRW" },
  { value: "AED", label: "AED" },
  { value: "CAD", label: "CAD" },
];

export const DEFAULT_DISPLAY_CURRENCY: SupportedCurrency = "PHP";

export const CURRENCY_STORAGE_KEY = "jp-currency";

function localeForCurrency(code: SupportedCurrency): string {
  switch (code) {
    case "PHP":
      return "en-PH";
    case "USD":
      return "en-US";
    case "EUR":
      return "de-DE";
    case "GBP":
      return "en-GB";
    case "AUD":
      return "en-AU";
    case "SGD":
      return "en-SG";
    case "JPY":
      return "ja-JP";
    case "KRW":
      return "ko-KR";
    case "AED":
      return "ar-AE";
    case "CAD":
      return "en-CA";
    default:
      return "en-US";
  }
}

export function convertFromPhp(amountPhp: number, targetCurrency: SupportedCurrency): number {
  if (!Number.isFinite(amountPhp)) {
    return 0;
  }
  if (targetCurrency === "PHP") {
    return amountPhp;
  }
  const rate = PHP_PER_UNIT[targetCurrency];
  if (!rate || rate <= 0) {
    return amountPhp;
  }
  return amountPhp / rate;
}

export function formatPhpCharge(amountPhp: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPhp);
}

export function formatDisplayMoney(amountPhp: number, currency: SupportedCurrency): string {
  const converted = convertFromPhp(amountPhp, currency);
  const locale = localeForCurrency(currency);
  const maxDigits = currency === "JPY" || currency === "KRW" ? 0 : 2;
  const minDigits = currency === "JPY" || currency === "KRW" ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(converted);
}

/** Whole units only — suitable for per-day card highlights (amounts are indicative when converted). */
export function formatDayRateFromPhp(amountPhp: number, currency: SupportedCurrency): string {
  const converted = convertFromPhp(amountPhp, currency);
  const locale = localeForCurrency(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(converted);
}

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return Object.prototype.hasOwnProperty.call(PHP_PER_UNIT, value);
}
