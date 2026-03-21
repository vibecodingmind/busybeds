'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'USD' | 'TZS' | 'KES' | 'NGN' | 'ZAR' | 'EUR' | 'GBP' | 'UGX' | 'RWF' | 'ETB';

interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
  flag: string;
  rate: number; // vs USD
}

const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar',       symbol: '$',   flag: '🇺🇸', rate: 1 },
  EUR: { code: 'EUR', name: 'Euro',             symbol: '€',   flag: '🇪🇺', rate: 0.92 },
  GBP: { code: 'GBP', name: 'British Pound',   symbol: '£',   flag: '🇬🇧', rate: 0.79 },
  KES: { code: 'KES', name: 'Kenyan Shilling',  symbol: 'KSh', flag: '🇰🇪', rate: 130 },
  TZS: { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿', rate: 2500 },
  NGN: { code: 'NGN', name: 'Nigerian Naira',  symbol: '₦',   flag: '🇳🇬', rate: 1580 },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rate: 18.5 },
  UGX: { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬', rate: 3750 },
  RWF: { code: 'RWF', name: 'Rwandan Franc',   symbol: 'RF',  flag: '🇷🇼', rate: 1300 },
  ETB: { code: 'ETB', name: 'Ethiopian Birr',  symbol: 'Br',  flag: '🇪🇹', rate: 57 },
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
