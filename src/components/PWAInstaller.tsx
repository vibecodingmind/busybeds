'use client';
import { useEffect, useState } from 'react';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Don't show if dismissed recently
    const dismissedAt = localStorage.getItem('bb_pwa_dismissed_at');
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000) return;

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then(reg => reg.update())
        .catch(() => {});
    }

    // Capture install prompt immediately
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect if user installs
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('bb_pwa_dismissed_at', String(Date.now()));
  };

  if (!showBanner || installed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #E8395A, #FF6B6B)' }} />
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* App icon */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #E8395A 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900">Add BusyBeds to your phone</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Get instant access to hotel discounts & your coupons — works offline too</p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Benefits */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { icon: '⚡', label: 'Fast access' },
              { icon: '📶', label: 'Works offline' },
              { icon: '🔔', label: 'Deal alerts' },
            ].map(b => (
              <div key={b.label} className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-xl">
                <span className="text-base">{b.icon}</span>
                <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 text-sm text-white rounded-xl font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}
            >
              Install Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
