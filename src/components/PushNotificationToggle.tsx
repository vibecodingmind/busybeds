'use client';
import { useState, useEffect } from 'react';

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      setPermission(Notification.permission);
      // Check if already subscribed
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub);
        });
      }).catch(() => {});
    }
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') { setLoading(false); return; }

      const reg = await navigator.serviceWorker.ready;
      // Use a dummy VAPID key if not configured
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBGYIe55Rcjwt1-YFVmU';
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setSubscribed(true);
    } catch (e) {
      console.error('Push subscribe error:', e);
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch('/api/push', { method: 'DELETE' });
      setSubscribed(false);
    } catch (e) {
      console.error('Push unsubscribe error:', e);
    }
    setLoading(false);
  };

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 dark:text-white">Deal Notifications</span>
        <span className="text-xs text-gray-500">{subscribed ? 'On — we\'ll alert you to deals' : 'Get alerts for hot deals & expiring coupons'}</span>
      </div>
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading || permission === 'denied'}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          subscribed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
        } ${loading ? 'opacity-50' : ''}`}
        aria-label="Toggle notifications"
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${subscribed ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
