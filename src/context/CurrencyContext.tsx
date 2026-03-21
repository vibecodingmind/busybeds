'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'USD' | 'TZS';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rate: number;
  format: (usdAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const FALLBACK_RATE = 2600;

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [rate, setRate] = useState(FALLBACK_RATE);
  const [mounted, setMounted] = useState(false);

  // Fetch exchange rate on mount
  useEffect(() => {
    const init = async () => {
      try {
        const savedCurrency = localStorage.getItem('bb_currency') as Currency | null;
        if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'TZS')) {
          setCurrencyState(savedCurrency);
        }
      } catch {
        // Silently fail on localStorage access
      }

      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.rates?.TZS) {
            setRate(Math.round(data.rates.TZS));
          }
        }
      } catch {
        // Use fallback rate if fetch fails
        setRate(FALLBACK_RATE);
      }

      setMounted(true);
    };

    init();
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem('bb_currency', newCurrency);
    } catch {
      // Silently fail if localStorage is not available
    }
  };

  const format = (usdAmount: number): string => {
    if (currency === 'USD') {
      return `$${usdAmount.toLocaleString()}`;
    } else {
      return `TZS ${Math.round(usdAmount * rate).toLocaleString()}`;
    }
  };

  const value: CurrencyContextType = {
    currency: mounted ? currency : 'USD',
    setCurrency,
    rate,
    format,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
