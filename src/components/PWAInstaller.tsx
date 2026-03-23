'use client';
import { useEffect, useState } from 'react';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('✅ Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed:', err));
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-40">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">📱</div>
        <div>
          <h3 className="font-semibold">Install Busy Beds</h3>
          <p className="text-xs text-gray-500">Access offline, add to home screen</p>
        </div>
      </div>
      <button
        onClick={handleInstall}
        className="w-full py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-semibold rounded-lg hover:opacity-90"
      >
        Install
      </button>
    </div>
  );
}
