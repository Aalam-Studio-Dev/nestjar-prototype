import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { convertForDisplay, type RatePair } from '@/domain/exchange';
import {
  formatMoney,
  isCurrencyCode,
  type CurrencyCode,
  type FormatOptions,
  type Minor,
} from '@/domain/money';

const STORAGE_KEY = 'nestjar.display-currency';

interface DisplayCurrencyValue {
  readonly currency: CurrencyCode | null;
  readonly setCurrency: (currency: CurrencyCode) => void;
}

const DisplayCurrencyContext = createContext<DisplayCurrencyValue | null>(null);

function readStored(): CurrencyCode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && isCurrencyCode(value) ? value : null;
  } catch {
    return null;
  }
}

/** The currency the couple is viewing totals in. A per-viewer preference. */
export function DisplayCurrencyProvider({ children }: { readonly children: ReactNode }) {
  const [currency, setState] = useState<CurrencyCode | null>(readStored);
  const setCurrency = useCallback((next: CurrencyCode) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A preference that fails to persist is still applied for this visit.
    }
  }, []);
  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);
  return (
    <DisplayCurrencyContext.Provider value={value}>{children}</DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(baseCurrency: CurrencyCode) {
  const context = useContext(DisplayCurrencyContext);
  if (!context) throw new Error('useDisplayCurrency must be used inside <DisplayCurrencyProvider>');
  return {
    currency: context.currency ?? baseCurrency,
    setCurrency: context.setCurrency,
  };
}

/**
 * Returns a formatter for base-currency amounts in whichever currency the
 * viewer has chosen. All budget figures on screen go through this.
 */
export function useMoneyFormatter(baseCurrency: CurrencyCode, rates: readonly RatePair[]) {
  const { currency } = useDisplayCurrency(baseCurrency);
  return useCallback(
    (amount: Minor, options?: FormatOptions) =>
      formatMoney(convertForDisplay(amount, baseCurrency, currency, rates), currency, options),
    [baseCurrency, currency, rates],
  );
}
