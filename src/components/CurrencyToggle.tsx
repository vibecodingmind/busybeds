'use client';
import { useState } from 'react';
import { useCurrency, Currency } from '@/context/CurrencyContext';

export default function CurrencyToggle() {
  const { currency, setCurrency, currencies } = useCurrency();
  const [open, setOpen] = useState(false);
  const info = currencies[currency];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Select currency">
        <span>{info.flag}</span>
        <span className="font-semibold">{currency}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden w-52 max-h-80 overflow-y-auto">
            {(Object.values(currencies) as any[]).map((c) => (
              <button key={c.code} onClick={() => { setCurrency(c.code as Currency); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${currency === c.code ? 'font-semibold text-[#E8395A]' : 'text-gray-700 dark:text-gray-300'}`}>
                <span className="text-base w-6">{c.flag}</span>
                <span className="font-mono font-bold text-xs w-8">{c.code}</span>
                <span className="text-gray-500 text-xs truncate">{c.name}</span>
                {currency === c.code && <svg className="ml-auto flex-shrink-0" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
