import type { Metadata, Viewport } from 'next';
import './globals.css';
import MobileNav from '@/components/MobileNav';
import PWARegister from '@/components/PWARegister';
import PWAInstaller from '@/components/PWAInstaller';
import CompareBar from '@/components/CompareBar';
import PromoBanners from '@/components/PromoBanners';
import VerifyEmailBanner from '@/components/VerifyEmailBanner';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { CompareProvider } from '@/context/CompareContext';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'BusyBeds — Exclusive Hotel Discounts & Coupons',
    template: '%s | BusyBeds',
  },
  description: 'Find exclusive hotel discounts up to 70% off. Get verified coupons for top hotels in Africa and beyond. Book smarter with BusyBeds.',
  keywords: ['hotel discounts', 'hotel coupons', 'hotel deals', 'BusyBeds', 'Africa hotels', 'cheap hotels'],
  authors: [{ name: 'BusyBeds' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'BusyBeds — Exclusive Hotel Discounts & Coupons',
    description: 'Find exclusive hotel discounts up to 70% off. Get verified coupons for top hotels.',
    siteName: 'BusyBeds',
    type: 'website',
    url: APP_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'BusyBeds Hotel Deals' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BusyBeds — Exclusive Hotel Discounts',
    description: 'Exclusive hotel discounts up to 70% off. Verified coupons for top hotels.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1A3C5E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-to-main">Skip to main content</a>
        <LanguageProvider>
          <CurrencyProvider>
            <CompareProvider>
              <PromoBanners />
              <VerifyEmailBanner />
              <div id="main-content">
                {children}
              </div>
              <CompareBar />
              <MobileNav />
              <PWARegister />
              <PWAInstaller />
            </CompareProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
