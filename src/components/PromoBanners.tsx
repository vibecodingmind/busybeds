'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Banner {
  id: string; title: string; subtitle?: string;
  ctaText: string; ctaUrl: string; bgColor: string; textColor: string;
}

export default function PromoBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/banners')
      .then(r => r.json())
      .then(d => setBanners(d.banners || []))
      .catch(() => {});
    const saved = localStorage.getItem('bb_dismissed_banners');
    if (saved) setDismissed(JSON.parse(saved));
  }, []);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('bb_dismissed_banners', JSON.stringify(next));
  };

  const visible = banners.filter(b => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1">
      {visible.map(banner => (
        <div
          key={banner.id}
          className="relative flex items-center justify-center gap-4 px-6 py-3 text-sm font-medium"
          style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
        >
          <span>{banner.title}</span>
          {banner.subtitle && <span className="opacity-80 hidden sm:inline">— {banner.subtitle}</span>}
          <Link
            href={banner.ctaUrl}
            className="px-3 py-1 rounded-full border text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ borderColor: banner.textColor, color: banner.textColor }}
          >
            {banner.ctaText}
          </Link>
          <button
            onClick={() => dismiss(banner.id)}
            className="absolute right-4 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
