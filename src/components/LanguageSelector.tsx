'use client';
import { useState } from 'react';
import { useLanguage, Lang } from '@/context/LanguageContext';

export default function LanguageSelector() {
  const { lang, setLang, langNames } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Select language">
        <span>{langNames[lang].split(' ')[0]}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[160px]">
            {(Object.keys(langNames) as Lang[]).map(l => (
              <button key={l} onClick={() => { setLang(l); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left ${lang === l ? 'font-semibold text-[#E8395A]' : 'text-gray-700 dark:text-gray-300'}`}>
                <span className="text-base">{langNames[l].split(' ')[0]}</span>
                <span>{langNames[l].split(' ')[1]}</span>
                {lang === l && <svg className="ml-auto" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
