import { createContext, useContext, useState, type ReactNode } from "react";

const STORAGE_KEY = "ny_currency";
type Currency = "TZS" | "USD";

// Static approximate rate — there's no live FX feed wired up, so this is a
// reference conversion only, not authoritative pricing.
const TZS_PER_USD = 2600;

function readStored(): Currency {
  return localStorage.getItem(STORAGE_KEY) === "USD" ? "USD" : "TZS";
}

interface CurrencyContextValue {
  currency: Currency;
  toggle: () => void;
  format: (amountTZS: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(readStored);

  function toggle() {
    setCurrency((prev) => {
      const next = prev === "TZS" ? "USD" : "TZS";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  function format(amountTZS: number): string {
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amountTZS / TZS_PER_USD);
    }
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      maximumFractionDigits: 0,
    }).format(amountTZS);
  }

  return <CurrencyContext.Provider value={{ currency, toggle, format }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
