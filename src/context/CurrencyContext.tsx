'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'TZS';

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
  USD: { code: 'USD', name: 'US Dollar',            symbol: '$',   flag: '🇺🇸', rate: 1      },
  EUR: { code: 'EUR', name: 'Euro',                  symbol: '€',   flag: '🇪🇺', rate: 0.92   },
  GBP: { code: 'GBP', name: 'British Pound',        symbol: '£',   flag: '🇬🇧', rate: 0.79   },
  TZS: { code: 'TZS', name: 'Tanzanian Shilling',   symbol: 'TSh', flag: '🇹🇿', rate: 2600   },
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
  currency: 'USD', setCurrency: () => {},
  currencies: CURRENCIES,
  format: (n) => `$${n}`, convert: (n) => n,
  rate: 1, info: CURRENCIES.USD,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');

  useEffect(() => {
    const saved = localStorage.getItem('bb_currency') as Currency;
    if (saved && CURRENCIES[saved]) setCurrencyState(saved);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('bb_currency', c);
  };

  const info = CURRENCIES[currency];
  const rate = info.rate;

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
