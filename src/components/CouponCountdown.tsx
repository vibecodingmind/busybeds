'use client';
import { useState, useEffect } from 'react';

interface Props {
  expiresAt: string; // ISO date string
  status: string;
}

export default function CouponCountdown({ expiresAt, status }: Props) {
  const [remaining, setRemaining] = useState<string | null>(null);
  const [dot, setDot] = useState<string>('');
  const [bgColor, setBgColor] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('');

  useEffect(() => {
    // Don't show countdown for redeemed/expired/cancelled coupons
    if (status !== 'active') {
      setRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const expiresDate = new Date(expiresAt);
      const diffMs = expiresDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        // Expired
        setRemaining('Expired');
        setDot('');
        setBgColor('#fee2e2'); // red-100
        setTextColor('#dc2626'); // red-600
        return;
      }

      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours <= 24) {
        // Red: <= 24 hours
        const hours = diffHours;
        const mins = diffMinutes % 60;
        const secs = diffSeconds % 60;
        setRemaining(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} remaining`);
        setDot('🔴');
        setBgColor('#fee2e2'); // red-100
        setTextColor('#dc2626'); // red-600
      } else if (diffDays <= 3) {
        // Orange: <= 3 days
        const hours = diffHours % 24;
        setRemaining(`${diffDays} day${diffDays > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''} remaining`);
        setDot('🟡');
        setBgColor('#fed7aa'); // orange-100
        setTextColor('#b45309'); // orange-700
      } else {
        // Green: > 3 days
        setRemaining(`${diffDays} day${diffDays > 1 ? 's' : ''} remaining`);
        setDot('🟢');
        setBgColor('#dcfce7'); // green-100
        setTextColor('#166534'); // green-700
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, status]);

  if (remaining === null) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: bgColor, color: textColor }}
    >
      {dot && <span>{dot}</span>}
      {remaining}
    </span>
  );
}
