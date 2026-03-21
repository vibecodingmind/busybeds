'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'en' | 'fr' | 'sw' | 'ar' | 'pt';

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
  fr: {
    'nav.home': 'Accueil', 'nav.coupons': 'Mes Coupons', 'nav.favorites': 'Hôtels Sauvegardés',
    'nav.profile': 'Profil', 'nav.signin': 'Se connecter', 'nav.register': 'Créer un compte',
    'nav.signout': 'Se déconnecter', 'nav.dashboard': 'Tableau de bord', 'nav.claim': 'Enregistrer votre hôtel',
    'search.placeholder': 'Rechercher par nom d\'hôtel, ville ou pays…',
    'hotel.discount': 'RÉDUCTION', 'hotel.book': 'Obtenir Coupon', 'hotel.reviews': 'avis',
    'hotel.viewall': 'Voir Tous les Hôtels', 'hotel.featured': 'En vedette',
    'coupon.active': 'Actif', 'coupon.expired': 'Expiré', 'coupon.redeemed': 'Utilisé',
    'coupon.share': 'Partager', 'coupon.print': 'Imprimer', 'coupon.save': 'Enregistrer',
    'sub.subscribe': 'S\'abonner', 'sub.monthly': '/mois',
    'common.loading': 'Chargement…', 'common.save': 'Enregistrer', 'common.cancel': 'Annuler',
    'common.search': 'Rechercher', 'common.filter': 'Filtrer', 'common.sort': 'Trier',
    'home.title': 'Réductions Hôtelières Exclusives', 'home.subtitle': 'Abonnez-vous une fois. Économisez partout.',
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
  ar: {
    'nav.home': 'الرئيسية', 'nav.coupons': 'كوبوناتي', 'nav.favorites': 'الفنادق المحفوظة',
    'nav.profile': 'الملف الشخصي', 'nav.signin': 'تسجيل الدخول', 'nav.register': 'إنشاء حساب',
    'nav.signout': 'تسجيل الخروج', 'nav.dashboard': 'لوحة التحكم', 'nav.claim': 'سجّل فندقك',
    'search.placeholder': 'ابحث باسم الفندق، المدينة أو الدولة…',
    'hotel.discount': 'خصم', 'hotel.book': 'احصل على كوبون', 'hotel.reviews': 'تقييمات',
    'hotel.viewall': 'عرض جميع الفنادق', 'hotel.featured': 'مميز',
    'coupon.active': 'نشط', 'coupon.expired': 'منتهي', 'coupon.redeemed': 'مستخدم',
    'coupon.share': 'مشاركة', 'coupon.print': 'طباعة', 'coupon.save': 'حفظ',
    'sub.subscribe': 'اشترك الآن', 'sub.monthly': '/شهر',
    'common.loading': 'جار التحميل…', 'common.save': 'حفظ', 'common.cancel': 'إلغاء',
    'common.search': 'بحث', 'common.filter': 'تصفية', 'common.sort': 'ترتيب',
    'home.title': 'خصومات فندقية حصرية', 'home.subtitle': 'اشترك مرة واحدة. وفّر في كل مكان.',
  },
  pt: {
    'nav.home': 'Início', 'nav.coupons': 'Meus Cupons', 'nav.favorites': 'Hotéis Salvos',
    'nav.profile': 'Perfil', 'nav.signin': 'Entrar', 'nav.register': 'Criar conta',
    'nav.signout': 'Sair', 'nav.dashboard': 'Painel', 'nav.claim': 'Registar o seu hotel',
    'search.placeholder': 'Pesquisar por nome do hotel, cidade ou país…',
    'hotel.discount': 'DESCONTO', 'hotel.book': 'Obter Cupom', 'hotel.reviews': 'avaliações',
    'hotel.viewall': 'Ver Todos os Hotéis', 'hotel.featured': 'Destaque',
    'coupon.active': 'Ativo', 'coupon.expired': 'Expirado', 'coupon.redeemed': 'Utilizado',
    'coupon.share': 'Partilhar', 'coupon.print': 'Imprimir', 'coupon.save': 'Guardar',
    'sub.subscribe': 'Assinar Agora', 'sub.monthly': '/mês',
    'common.loading': 'A carregar…', 'common.save': 'Guardar', 'common.cancel': 'Cancelar',
    'common.search': 'Pesquisar', 'common.filter': 'Filtrar', 'common.sort': 'Ordenar',
    'home.title': 'Descontos Exclusivos em Hotéis', 'home.subtitle': 'Assine uma vez. Poupe em todo o lado.',
  },
};

const LANG_NAMES: Record<Lang, string> = {
  en: '🇬🇧 English', fr: '🇫🇷 Français', sw: '🇹🇿 Kiswahili', ar: '🇸🇦 العربية', pt: '🇵🇹 Português'
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  langNames: typeof LANG_NAMES;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en', setLang: () => {}, t: k => k, langNames: LANG_NAMES, isRTL: false
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
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, langNames: LANG_NAMES, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() { return useContext(LanguageContext); }
