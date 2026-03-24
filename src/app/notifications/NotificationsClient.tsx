'use client';
import { useState, useEffect } from 'react';

interface Notification {
  id: string; title: string; message: string; type: string;
  isRead: boolean; link?: string; createdAt: string;
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => setNotifications(d.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const typeIcon = (type: string) => ({ deal: '🏷️', coupon: '🎫', referral: '👥', points: '⭐' }[type] || '🔔');

  if (loading) return <div className="space-y-3">{Array.from({length: 5}).map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;
  if (notifications.length === 0) return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-5xl mb-4">🔔</div>
      <p>No notifications yet</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {notifications.map(n => (
        <div key={n.id} className={`flex gap-4 p-4 rounded-2xl border transition-colors ${n.isRead ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' : 'bg-pink-50 dark:bg-gray-750 border-pink-100 dark:border-gray-600'}`}>
          <span className="text-2xl">{typeIcon(n.type)}</span>
          <div className="flex-1">
            <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
            <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
          {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#FF385C] mt-2 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}
