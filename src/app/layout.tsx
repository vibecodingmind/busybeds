import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import MobileNav from '@/components/MobileNav';
import PWAInstaller from '@/components/PWAInstaller';
import CompareBar from '@/components/CompareBar';
import PromoBanners from '@/components/PromoBanners';
import VerifyEmailBanner from '@/components/VerifyEmailBanner';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { CompareProvider } from '@/context/CompareContext';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // e.g. G-XXXXXXXXXX

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
      <head>
        {/* Google Search Console verification — add your actual content value in Railway env vars */}
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}
      </head>
      <body>
        {/* Google Analytics GA4 — set NEXT_PUBLIC_GA_ID in Railway environment variables */}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname, anonymize_ip: true });
            ` }} />
          </>
        )}
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
              <PWAInstaller />
            </CompareProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
