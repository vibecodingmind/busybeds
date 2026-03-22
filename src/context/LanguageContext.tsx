'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'en' | 'sw';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    'nav.home': 'Home', 'nav.coupons': 'My Coupons', 'nav.favorites': 'Saved Hotels',
    'nav.profile': 'Profile', 'nav.signin': 'Sign in', 'nav.register': 'Create account',
    'nav.signout': 'Sign Out', 'nav.dashboard': 'Dashboard', 'nav.claim': 'Claim your property',
    'search.placeholder': 'Search by hotel name, city or country…',
    'hotel.discount': 'OFF', 'hotel.book': 'Get Coupon', 'hotel.reviews': 'reviews',
    'hotel.viewall': 'View All Hotels', 'hotel.featured': 'Featured',
    'coupon.active': 'Active', 'coupon.expired': 'Expired', 'coupon.redeemed': 'Redeemed',
    'coupon.share': 'Share', 'coupon.print': 'Print', 'coupon.save': 'Save',
    'sub.subscribe': 'Start Subscription', 'sub.monthly': '/month',
    'common.loading': 'Loading…', 'common.save': 'Save', 'common.cancel': 'Cancel',
    'common.search': 'Search', 'common.filter': 'Filter', 'common.sort': 'Sort',
    'home.title': 'Exclusive Hotel Discounts', 'home.subtitle': 'Subscribe once. Save everywhere.',
  },
  sw: {
    'nav.home': 'Nyumbani', 'nav.coupons': 'Tikiti Zangu', 'nav.favorites': 'Hoteli Zilizohifadhiwa',
    'nav.profile': 'Wasifu', 'nav.signin': 'Ingia', 'nav.register': 'Fungua Akaunti',
    'nav.signout': 'Toka', 'nav.dashboard': 'Dashibodi', 'nav.claim': 'Dai hoteli yako',
    'search.placeholder': 'Tafuta jina la hoteli, mji au nchi…',
    'hotel.discount': 'PUNGUZO', 'hotel.book': 'Pata Tikiti', 'hotel.reviews': 'maoni',
    'hotel.viewall': 'Angalia Hoteli Zote', 'hotel.featured': 'Iliyoangaziwa',
    'coupon.active': 'Inatumika', 'coupon.expired': 'Imeisha', 'coupon.redeemed': 'Ilitumika',
    'coupon.share': 'Shiriki', 'coupon.print': 'Chapisha', 'coupon.save': 'Hifadhi',
    'sub.subscribe': 'Jisajili', 'sub.monthly': '/mwezi',
    'common.loading': 'Inapakia…', 'common.save': 'Hifadhi', 'common.cancel': 'Ghairi',
    'common.search': 'Tafuta', 'common.filter': 'Chuja', 'common.sort': 'Panga',
    'home.title': 'Punguzo za Kipekee za Hoteli', 'home.subtitle': 'Jisajili mara moja. Okoa kila mahali.',
  },
};

const LANG_NAMES: Record<Lang, string> = {
  en: '🇬🇧 English',
  sw: '🇹🇿 Kiswahili',
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  langNames: typeof LANG_NAMES;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en', setLang: () => {}, t: k => k, langNames: LANG_NAMES, isRTL: false as boolean
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('bb_lang') as Lang;
    if (saved && translations[saved]) setLangState(saved);
    else {
      const browser = navigator.language.slice(0, 2) as Lang;
      if (translations[browser]) setLangState(browser);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('bb_lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = 'ltr';
  };

  const t = (key: string) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, langNames: LANG_NAMES, isRTL: false }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() { return useContext(LanguageContext); }
