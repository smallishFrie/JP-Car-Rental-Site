"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  CURRENCY_STORAGE_KEY,
  DEFAULT_DISPLAY_CURRENCY,
  formatDayRateFromPhp,
  formatDisplayMoney,
  formatPhpCharge,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  setCurrency: (next: SupportedCurrency) => void;
  formatMoney: (amountPhp: number) => string;
  formatDayRate: (amountPhp: number) => string;
  formatPhpCharge: (amountPhp: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(DEFAULT_DISPLAY_CURRENCY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    queueMicrotask(() => {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved && isSupportedCurrency(saved)) {
        setCurrencyState(saved);
      }
      setReady(true);
    });
  }, []);

  const setCurrency = useCallback((next: SupportedCurrency) => {
    setCurrencyState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENCY_STORAGE_KEY, next);
    }
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") {
      return;
    }
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency, ready]);

  const formatMoney = useCallback((amountPhp: number) => formatDisplayMoney(amountPhp, currency), [currency]);

  const formatDayRate = useCallback((amountPhp: number) => formatDayRateFromPhp(amountPhp, currency), [currency]);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      formatMoney,
      formatDayRate,
      formatPhpCharge,
    }),
    [currency, setCurrency, formatMoney, formatDayRate],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}

export default CurrencyProvider;
