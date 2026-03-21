import type { Metadata, Viewport } from 'next';
import './globals.css';
import MobileNav from '@/components/MobileNav';
import PWARegister from '@/components/PWARegister';
import CompareBar from '@/components/CompareBar';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { CompareProvider } from '@/context/CompareContext';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Busy Beds — Hotel Discount Coupons',
    template: '%s — Busy Beds',
  },
  description: 'Subscribe once. Get QR discount coupons for hundreds of verified hotels worldwide. Walk in, scan, save.',
  keywords: ['hotel discounts', 'hotel coupons', 'QR coupons', 'travel deals', 'hotel deals'],
  authors: [{ name: 'Busy Beds' }],
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'Busy Beds',
    title: 'Busy Beds — Hotel Discount Coupons',
    description: 'Subscribe once. Get QR discount coupons for hundreds of verified hotels worldwide.',
    url: APP_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Busy Beds' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Busy Beds — Hotel Discount Coupons',
    description: 'Subscribe once. Get QR discount coupons for hundreds of verified hotels worldwide.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
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
              <div id="main-content">
                {children}
              </div>
              <CompareBar />
              <MobileNav />
              <PWARegister />
            </CompareProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
