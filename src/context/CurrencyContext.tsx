'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'USD' | 'TZS';

interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
  flag: string;
  /** Conversion rate relative to USD (1 USD = X of this currency).
   *  To update rates: change the number next to the currency below.
   *  Example: if 1 USD = 2,600 TSh today, set TZS rate to 2600.
   */
  rate: number;
}

// ─────────────────────────────────────────────────────────────────
//  CONVERSION RATES  —  update these numbers to change prices site-wide
//  All rates are: how many units of the currency equal 1 USD
// ─────────────────────────────────────────────────────────────────
const CURRENCIES: Record<Currency, CurrencyInfo> = {
  TZS: { code: 'TZS', name: 'Tanzanian Shilling',   symbol: 'TSh', flag: '🇹🇿', rate: 2600   },
  USD: { code: 'USD', name: 'US Dollar',             symbol: '$',   flag: '🇺🇸', rate: 1      },
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  currencies: typeof CURRENCIES;
  format: (usdAmount: number) => string;
  convert: (usdAmount: number) => number;
  rate: number;
  info: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'TZS', setCurrency: () => {},
  currencies: CURRENCIES,
  format: (n) => `TSh${Math.round(n * 2600).toLocaleString()}`, convert: (n) => n * 2600,
  rate: 2600, info: CURRENCIES.TZS,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('TZS');
  // Live rates fetched from admin-configured database values (fallback to hardcoded defaults)
  const [liveRates, setLiveRates] = useState<Partial<Record<Currency, number>>>({});

  useEffect(() => {
    const saved = localStorage.getItem('bb_currency') as Currency;
    if (saved && CURRENCIES[saved]) setCurrencyState(saved);
    else setCurrencyState('TZS');

    // Load admin-configured rates from the database
    fetch('/api/currency-rates')
      .then(r => r.json())
      .then(data => { if (data.rates) setLiveRates(data.rates); })
      .catch(() => {}); // silently fall back to hardcoded defaults
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('bb_currency', c);
  };

  const info = CURRENCIES[currency];
  // Use live rate from DB if available, otherwise fall back to hardcoded default
  const rate = liveRates[currency] ?? info.rate;

  const convert = (usdAmount: number) => usdAmount * rate;

  const format = (usdAmount: number) => {
    const amount = usdAmount * rate;
    if (rate >= 100) return `${info.symbol}${Math.round(amount).toLocaleString()}`;
    return `${info.symbol}${amount.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencies: CURRENCIES, format, convert, rate, info }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() { return useContext(CurrencyContext); }
