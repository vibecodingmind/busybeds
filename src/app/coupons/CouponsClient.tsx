'use client';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Hotel {
  name: string; city: string; country: string; slug: string;
  coverImage: string | null; starRating: number; address: string | null;
  discountPercent: number;
}
interface CouponData {
  id: string; code: string; qrDataUrl: string | null;
  discountPercent: number; guestName: string | null;
  status: string; generatedAt: string; expiresAt: string; redeemedAt: string | null;
  hotel: Hotel;
}
interface Props { coupons: CouponData[]; ownerName: string; ownerAvatar: string | null; }

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  active:    { label: 'Active',    dot: '#22C55E', bg: '#F0FDF4', text: '#15803D',  border: '#BBF7D0' },
  expired:   { label: 'Expired',   dot: '#9CA3AF', bg: '#F9FAFB', text: '#6B7280',  border: '#E5E7EB' },
  redeemed:  { label: 'Redeemed',  dot: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8',  border: '#BFDBFE' },
  cancelled: { label: 'Cancelled', dot: '#EF4444', bg: '#FEF2F2', text: '#B91C1C',  border: '#FCA5A5' },
};

const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'active',    label: 'Active'    },
  { id: 'expired',   label: 'Expired'   },
  { id: 'redeemed',  label: 'Redeemed'  },
  { id: 'cancelled', label: 'Cancelled' },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtCode(code: string) {
  return `BB-${code.slice(0, 4)}-${code.slice(4)}`;
}
function stars(n: number) { return '★'.repeat(Math.max(0, Math.min(5, n))); }

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(expiresAt: string, status: string) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (status !== 'active') { setLabel(''); return; }
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setLabel('Expired'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setLabel(`${d}d ${h}h left`);
      else if (h > 0) setLabel(`${h}h ${m}m left`);
      else setLabel(`${m}m left`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [expiresAt, status]);
  return label;
}

// ─── Coupon ticket (visual + print) ───────────────────────────────────────────
function CouponCard({ coupon, ownerName, forPrint = false }: { coupon: CouponData; ownerName: string; forPrint?: boolean }) {
  const displayName = coupon.guestName || ownerName;
  const meta = STATUS_META[coupon.status] || STATUS_META.expired;

  return (
    <div
      id="coupon-card"
      className="coupon-card-inner mx-auto"
      style={{
        width: forPrint ? '100%' : 320,
        maxWidth: 340,
        background: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #F0F0F0',
        boxShadow: forPrint ? 'none' : '0 8px 32px rgba(0,0,0,0.10)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E7C7B 100%)', padding: '11px 16px 9px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="white" opacity="0.9"/>
              <path d="M9 22V12h6v10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>BUSY BEDS</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Exclusive Hotel Coupon</div>
          </div>
          <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.18)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: 0.5 }}>
            {meta.label.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Perforated edge */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '0 -1px', height: 12, overflow: 'hidden' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F9FAFB', border: '1px solid #E5E7EB', flexShrink: 0 }} />
        <div style={{ flex: 1, borderTop: '2px dashed #E5E7EB' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F9FAFB', border: '1px solid #E5E7EB', flexShrink: 0 }} />
      </div>

      {/* Hotel info */}
      <div style={{ padding: '8px 16px 10px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {coupon.hotel.coverImage ? (
            <img src={coupon.hotel.coverImage} alt="" style={{ width: 40, height: 40, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 7, background: 'linear-gradient(135deg,#1A3C5E,#0E7C7B)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}>🏨</span>
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1A3C5E', lineHeight: 1.3 }}>{coupon.hotel.name}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>📍 {coupon.hotel.city}, {coupon.hotel.country}</div>
            <div style={{ fontSize: 10, color: '#F59E0B', marginTop: 1 }}>{stars(coupon.hotel.starRating)}</div>
          </div>
        </div>
        {coupon.guestName && (
          <div style={{ marginTop: 6, background: '#F5F3FF', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#7C3AED', fontWeight: 600 }}>
            👥 This coupon is for: {coupon.guestName}
          </div>
        )}
      </div>

      {/* Discount + validity */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #F3F4F6', background: coupon.status === 'active' ? '#F0FDFA' : '#FAFAFA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: coupon.status === 'active' ? 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' : '#9CA3AF',
            color: 'white', fontWeight: 900, fontSize: 22,
            padding: '6px 12px', borderRadius: 9, lineHeight: 1, letterSpacing: -0.5,
            display: 'flex', alignItems: 'baseline', gap: 3,
          }}>
            {coupon.discountPercent}%
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0 }}>OFF</span>
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
            <div>🎉 Save {coupon.discountPercent}% on your stay</div>
            <div style={{ color: '#374151', fontWeight: 600 }}>Valid: {fmtDate(coupon.expiresAt)}</div>
            <div style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'monospace', letterSpacing: 0.5 }}>ID: {fmtCode(coupon.code)}</div>
          </div>
        </div>
        {coupon.status === 'redeemed' && coupon.redeemedAt && (
          <div style={{ marginTop: 6, background: '#EFF6FF', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#1D4ED8', fontWeight: 600 }}>
            ✓ Redeemed on {fmtDate(coupon.redeemedAt)}
          </div>
        )}
      </div>

      {/* QR Code */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', textAlign: 'center' }}>
        {coupon.qrDataUrl ? (
          <>
            <div style={{ display: 'inline-block', padding: 7, border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white' }}>
              <img src={coupon.qrDataUrl} alt="QR Code" style={{ width: 104, height: 104, display: 'block' }} />
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 5 }}>📲 Scan at hotel reception</div>
          </>
        ) : (
          <div style={{ fontSize: 10, color: '#9CA3AF', padding: '12px 0' }}>QR code not available</div>
        )}
        <div style={{ background: '#F9FAFB', borderRadius: 7, padding: '6px 12px', marginTop: 7 }}>
          <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>COUPON CODE</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: 3, color: '#1A3C5E' }}>{coupon.code}</div>
        </div>
      </div>

      {/* Perforated edge */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '0 -1px', height: 12, overflow: 'hidden' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F9FAFB', border: '1px solid #E5E7EB', flexShrink: 0 }} />
        <div style={{ flex: 1, borderTop: '2px dashed #E5E7EB' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F9FAFB', border: '1px solid #E5E7EB', flexShrink: 0 }} />
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 16px 12px', background: '#FAFAFA' }}>
        <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.8 }}>
          <div>👤 Guest: <strong>{displayName}</strong></div>
          <div>🔒 Single-use only — cannot be reused</div>
          <div style={{ color: '#F59E0B' }}>⚠️ Screenshots are not valid — QR scan required</div>
        </div>
        <div style={{ marginTop: 7, paddingTop: 6, borderTop: '1px solid #E5E7EB', fontSize: 9, color: '#D1D5DB', textAlign: 'center' }}>
          Powered by BusyBeds · busybeds.com · Generated {fmtDate(coupon.generatedAt)}
        </div>
      </div>
    </div>
  );
}

// ─── Coupon list item ─────────────────────────────────────────────────────────
function CouponListItem({ coupon, isSelected, onClick }: { coupon: CouponData; isSelected: boolean; onClick: () => void }) {
  const meta     = STATUS_META[coupon.status] || STATUS_META.expired;
  const countdown = useCountdown(coupon.expiresAt, coupon.status);
  const isActive  = coupon.status === 'active';

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-150 rounded-2xl overflow-hidden"
      style={{
        border: isSelected ? '2px solid #0E7C7B' : '1.5px solid #F0F0F0',
        background: isSelected ? '#F0FDFA' : 'white',
        boxShadow: isSelected ? '0 0 0 3px rgba(14,124,123,0.08)' : 'none',
      }}
    >
      {/* Hotel cover strip */}
      {coupon.hotel.coverImage && (
        <div className="relative h-16 overflow-hidden">
          <img
            src={coupon.hotel.coverImage}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: isActive ? 'none' : 'grayscale(60%) brightness(0.85)' }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)' }} />
          {/* Discount badge */}
          <div
            className="absolute top-2 left-3 px-2 py-0.5 rounded-lg text-white font-extrabold text-xs"
            style={{ background: isActive ? 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' : 'rgba(0,0,0,0.45)' }}
          >
            {coupon.discountPercent}% OFF
          </div>
          {/* Status pill top-right */}
          <div
            className="absolute top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.dot, display: 'inline-block', flexShrink: 0 }} />
            {meta.label}
          </div>
          {/* Hotel name overlay */}
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-white text-xs font-bold truncate leading-tight drop-shadow-sm">{coupon.hotel.name}</p>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Fallback icon when no cover image */}
        {!coupon.hotel.coverImage && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: isActive ? 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' : '#E5E7EB' }}
          >
            🏨
          </div>
        )}

        <div className="flex-1 min-w-0">
          {!coupon.hotel.coverImage && (
            <p className="text-sm font-semibold text-gray-900 truncate">{coupon.hotel.name}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-xs text-gray-400">{coupon.hotel.city}, {coupon.hotel.country}</span>
            {coupon.guestName && (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                👥 {coupon.guestName}
              </span>
            )}
          </div>
          {countdown && (
            <p className="text-[10px] text-orange-500 font-semibold mt-0.5">⏱ {countdown}</p>
          )}
        </div>

        {/* Arrow */}
        <svg className="flex-shrink-0" width="14" height="14" fill="none" viewBox="0 0 24 24"
          stroke={isSelected ? '#0E7C7B' : '#D1D5DB'} strokeWidth={2}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}

// ─── Action buttons ────────────────────────────────────────────────────────────
function CouponActions({ coupon, ownerName }: { coupon: CouponData; ownerName: string }) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const text = `🎫 BusyBeds Coupon\n${coupon.hotel.name} · ${coupon.hotel.city}\n${coupon.discountPercent}% OFF\nCode: ${coupon.code}\nValid until: ${fmtDate(coupon.expiresAt)}\n\nbusybeds.com`;
    if (navigator.share) {
      try { await navigator.share({ title: `BusyBeds ${coupon.discountPercent}% off coupon`, text, url: 'https://busybeds.com' }); return; }
      catch { /* fallthrough */ }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const displayName = coupon.guestName || ownerName;
    const starsStr = '★'.repeat(coupon.hotel.starRating);
    const printHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>BusyBeds Coupon – ${coupon.hotel.name}</title>
<style>
  @page { size: A5; margin: 14mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Arial, sans-serif; background: #fff; display:flex; justify-content:center; align-items:flex-start; }
  .card { width: 100%; max-width: 110mm; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; }
  .header { background: linear-gradient(135deg,#1A3C5E,#0E7C7B); color: white; padding: 10px 14px 8px; display:flex; align-items:center; gap:8px; }
  .logo-box { width:24px;height:24px;border-radius:5px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .logo-name { font-weight: 900; font-size: 14px; }
  .logo-sub  { font-size: 9px; opacity: 0.75; margin-top: 1px; }
  .status-pill { margin-left:auto; background:rgba(255,255,255,0.18); font-size:8px; font-weight:700; padding:2px 7px; border-radius:20px; letter-spacing:0.5px; }
  .perf { display:flex; align-items:center; }
  .perf-circle { width:11px;height:11px;border-radius:50%;background:#f9fafb;border:1px solid #e5e7eb;flex-shrink:0; }
  .perf-line { flex:1;border-top:1.5px dashed #e5e7eb; }
  .section { padding: 8px 14px; border-bottom: 1px solid #f3f4f6; }
  .hotel-row { display:flex; gap:8px; align-items:center; }
  .hotel-img { width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0; }
  .hotel-icon{ width:36px;height:36px;border-radius:6px;background:linear-gradient(135deg,#1A3C5E,#0E7C7B);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0; }
  .hotel-name { font-weight: 700; font-size: 12px; color: #1A3C5E; line-height:1.3; }
  .hotel-loc  { font-size: 10px; color: #6B7280; margin-top: 2px; }
  .stars      { color: #F59E0B; font-size: 10px; margin-top: 1px; }
  .guest-tag  { background: #f5f3ff; color: #7C3AED; font-size: 9px; font-weight: 700; padding: 3px 7px; border-radius: 5px; margin-top: 5px; display:inline-block; }
  .disc-row   { display:flex; align-items:center; gap:10px; }
  .discount   { font-weight: 900; font-size: 22px; color: #0E7C7B; line-height: 1; }
  .disc-off   { font-size: 10px; font-weight:700; }
  .validity   { font-size: 10px; color: #374151; line-height: 1.7; }
  .validity strong { color:#1A3C5E; }
  .qr-wrap    { text-align: center; padding: 8px 14px; border-bottom: 1px solid #f3f4f6; }
  .qr-wrap img{ width: 90px; height: 90px; border: 1.5px solid #e5e7eb; border-radius: 6px; padding: 3px; }
  .code-box   { background: #f9fafb; border-radius: 5px; padding: 5px 10px; margin-top: 6px; text-align:center; display:inline-block; min-width:120px; }
  .code-label { font-size: 8px; color: #9ca3af; }
  .code-text  { font-family: monospace; font-weight: 700; font-size: 12px; letter-spacing: 2px; color: #1A3C5E; }
  .scan-hint  { font-size:9px; color:#9ca3af; margin-top:4px; }
  .footer     { padding: 7px 14px 10px; background: #fafafa; font-size: 9.5px; color: #374151; line-height: 1.8; }
  .footer-meta{ margin-top: 6px; padding-top: 5px; border-top: 1px solid #e5e7eb; font-size: 8px; color: #d1d5db; text-align: center; }
  .redeemed-tag { background:#eff6ff; color:#1D4ED8; font-size:9px; font-weight:700; padding:3px 7px; border-radius:5px; margin-top:5px; display:inline-block; }
</style></head><body>
<div class="card">
  <div class="header">
    <div class="logo-box">🏠</div>
    <div><div class="logo-name">BUSY BEDS</div><div class="logo-sub">Exclusive Hotel Coupon</div></div>
    <div class="status-pill">${(STATUS_META[coupon.status]?.label || 'Active').toUpperCase()}</div>
  </div>
  <div class="perf"><div class="perf-circle"></div><div class="perf-line"></div><div class="perf-circle"></div></div>
  <div class="section">
    <div class="hotel-row">
      ${coupon.hotel.coverImage ? `<img class="hotel-img" src="${coupon.hotel.coverImage}" alt="" />` : '<div class="hotel-icon">🏨</div>'}
      <div>
        <div class="hotel-name">${coupon.hotel.name}</div>
        <div class="hotel-loc">📍 ${coupon.hotel.city}, ${coupon.hotel.country}</div>
        <div class="stars">${starsStr}</div>
      </div>
    </div>
    ${coupon.guestName ? `<div class="guest-tag">👥 For: ${coupon.guestName}</div>` : ''}
  </div>
  <div class="section">
    <div class="disc-row">
      <div style="background:linear-gradient(135deg,#1A3C5E,#0E7C7B);color:white;padding:5px 10px;border-radius:7px;display:inline-flex;align-items:baseline;gap:3px;">
        <span class="discount">${coupon.discountPercent}%</span><span class="disc-off">OFF</span>
      </div>
      <div class="validity">
        🎉 Save ${coupon.discountPercent}% on your stay<br/>
        Valid Until: <strong>${fmtDate(coupon.expiresAt)}</strong><br/>
        <span style="color:#9ca3af;font-family:monospace;font-size:9px;">ID: ${fmtCode(coupon.code)}</span>
      </div>
    </div>
    ${coupon.status === 'redeemed' && coupon.redeemedAt ? `<div class="redeemed-tag">✓ Redeemed on ${fmtDate(coupon.redeemedAt)}</div>` : ''}
  </div>
  <div class="qr-wrap">
    ${coupon.qrDataUrl ? `<img src="${coupon.qrDataUrl}" alt="QR Code" />` : '<p style="color:#9ca3af;font-size:11px;padding:10px 0;">QR not available</p>'}
    <div><div class="code-box"><div class="code-label">COUPON CODE</div><div class="code-text">${coupon.code}</div></div></div>
    <div class="scan-hint">📲 Scan at hotel reception</div>
  </div>
  <div class="perf"><div class="perf-circle"></div><div class="perf-line"></div><div class="perf-circle"></div></div>
  <div class="footer">
    👤 Guest: <strong>${displayName}</strong><br/>
    🔒 Single-use only — cannot be reused<br/>
    <span style="color:#F59E0B;">⚠️ Screenshots not valid — QR required</span>
    <div class="footer-meta">Powered by BusyBeds · busybeds.com · Generated ${fmtDate(coupon.generatedAt)}</div>
  </div>
</div>
</body></html>`;
    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) return;
    w.document.write(printHtml);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  const handleSaveImage = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const displayName = coupon.guestName || ownerName;
      const W = 360, H = 510;
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);

      const rr = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };
      const line = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      };

      // White card bg
      ctx.fillStyle = '#FFFFFF';
      rr(0, 0, W, H, 16); ctx.fill();

      // Teal header
      const hgrad = ctx.createLinearGradient(0, 0, W, 64);
      hgrad.addColorStop(0, '#1A3C5E'); hgrad.addColorStop(1, '#0E7C7B');
      ctx.fillStyle = hgrad;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(W - 14, 0);
      ctx.quadraticCurveTo(W, 0, W, 14); ctx.lineTo(W, 64); ctx.lineTo(0, 64);
      ctx.lineTo(0, 14); ctx.quadraticCurveTo(0, 0, 14, 0); ctx.closePath(); ctx.fill();

      // Logo icon box
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      rr(14, 12, 26, 26, 5); ctx.fill();
      ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.fillText('BB', 19, 29);

      // Header text
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 15px Arial'; ctx.fillText('BUSY BEDS', 50, 27);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '10px Arial'; ctx.fillText('Exclusive Hotel Coupon', 50, 42);

      // Status pill
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      const sLabel = (STATUS_META[coupon.status]?.label || 'Active').toUpperCase();
      ctx.font = 'bold 9px Arial';
      const sw = ctx.measureText(sLabel).width;
      rr(W - sw - 22, 22, sw + 16, 16, 8); ctx.fill();
      ctx.fillStyle = 'white'; ctx.fillText(sLabel, W - sw - 14, 33);

      let y = 76;
      ctx.fillStyle = '#1A3C5E'; ctx.font = 'bold 13px Arial';
      ctx.fillText('🏨 ' + coupon.hotel.name, 16, y); y += 18;
      ctx.fillStyle = '#6B7280'; ctx.font = '11px Arial';
      ctx.fillText('📍 ' + coupon.hotel.city + ', ' + coupon.hotel.country, 16, y); y += 16;
      ctx.fillStyle = '#F59E0B'; ctx.font = '10px Arial';
      ctx.fillText('★'.repeat(coupon.hotel.starRating), 16, y); y += 6;
      if (coupon.guestName) {
        ctx.fillStyle = '#F5F3FF'; rr(16, y, W - 32, 19, 5); ctx.fill();
        ctx.fillStyle = '#7C3AED'; ctx.font = 'bold 10px Arial';
        ctx.fillText('👥 For: ' + coupon.guestName, 24, y + 13); y += 26;
      }

      ctx.strokeStyle = '#F3F4F6'; ctx.lineWidth = 1;
      line(0, y, W, y); y += 10;

      // Discount badge (smaller)
      const discColor = coupon.status === 'active' ? '#0E7C7B' : '#9CA3AF';
      const dgrad = ctx.createLinearGradient(0, y, 0, y + 36);
      if (coupon.status === 'active') { dgrad.addColorStop(0, '#1A3C5E'); dgrad.addColorStop(1, '#0E7C7B'); }
      ctx.fillStyle = coupon.status === 'active' ? dgrad : '#9CA3AF';
      rr(16, y, 80, 34, 7); ctx.fill();
      ctx.fillStyle = 'white'; ctx.font = 'bold 22px Arial';
      ctx.fillText(coupon.discountPercent + '%', 22, y + 24);
      ctx.font = 'bold 10px Arial'; ctx.fillText('OFF', 22 + ctx.measureText(coupon.discountPercent + '%').width - 2, y + 22);

      // Validity text beside badge
      ctx.fillStyle = '#6B7280'; ctx.font = '10px Arial';
      ctx.fillText('🎉 Save ' + coupon.discountPercent + '% on your stay', 106, y + 12);
      ctx.fillStyle = '#374151'; ctx.font = 'bold 10px Arial';
      ctx.fillText('Valid: ' + fmtDate(coupon.expiresAt), 106, y + 26);
      ctx.fillStyle = '#9CA3AF'; ctx.font = '9px Arial';
      ctx.fillText('ID: ' + fmtCode(coupon.code), 106, y + 38);
      y += 48;

      ctx.strokeStyle = '#F3F4F6'; ctx.lineWidth = 1;
      line(0, y, W, y); y += 10;

      const drawRest = (qrImg?: HTMLImageElement) => {
        ctx.strokeStyle = '#F3F4F6'; ctx.lineWidth = 1;
        line(0, y, W, y);
        const qrSize = 100, qrX = (W - qrSize) / 2;
        if (qrImg) {
          ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1.5;
          rr(qrX - 7, y + 6, qrSize + 14, qrSize + 14, 8); ctx.stroke();
          ctx.drawImage(qrImg, qrX, y + 6, qrSize, qrSize); y += qrSize + 22;
        } else {
          ctx.fillStyle = '#F3F4F6'; rr(qrX, y + 6, qrSize, qrSize, 8); ctx.fill();
          ctx.fillStyle = '#9CA3AF'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
          ctx.fillText('QR not available', W / 2, y + 58); ctx.textAlign = 'left';
          y += qrSize + 22;
        }
        ctx.fillStyle = '#F9FAFB'; rr(36, y, W - 72, 34, 7); ctx.fill();
        ctx.fillStyle = '#9CA3AF'; ctx.font = '8px Arial'; ctx.textAlign = 'center';
        ctx.fillText('COUPON CODE', W / 2, y + 11);
        ctx.fillStyle = '#1A3C5E'; ctx.font = 'bold 13px monospace';
        ctx.fillText(coupon.code, W / 2, y + 25);
        ctx.textAlign = 'left'; y += 44;
        ctx.fillStyle = '#9CA3AF'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
        ctx.fillText('📲 Scan at hotel reception', W / 2, y);
        ctx.textAlign = 'left'; y += 14;
        ctx.strokeStyle = '#F3F4F6'; ctx.lineWidth = 1;
        line(0, y, W, y); y += 12;
        ctx.fillStyle = '#374151'; ctx.font = '10px Arial';
        ctx.fillText('👤 Guest: ' + displayName, 16, y); y += 18;
        ctx.fillText('🔒 Single-use only', 16, y); y += 18;
        ctx.fillStyle = '#F59E0B';
        ctx.fillText('⚠️ Screenshots not valid', 16, y); y += 18;
        ctx.fillStyle = '#D1D5DB'; ctx.font = '8px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Powered by BusyBeds · ' + fmtDate(coupon.generatedAt), W / 2, y + 3);
        const link = document.createElement('a');
        link.download = `busybeds-${coupon.code}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setSaving(false);
      };

      if (coupon.qrDataUrl) {
        const img = new Image();
        img.onload = () => drawRest(img);
        img.onerror = () => drawRest();
        img.src = coupon.qrDataUrl;
      } else {
        drawRest();
      }
    } catch (e) {
      console.error('Image save failed', e);
      setSaving(false);
    }
  }, [coupon, ownerName, saving]);

  const sharePageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${coupon.code}`;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `🎫 *BusyBeds Exclusive Coupon*\n\n` +
      `🏨 *${coupon.hotel.name}*\n` +
      `📍 ${coupon.hotel.city}, ${coupon.hotel.country}\n\n` +
      `💰 *${coupon.discountPercent}% OFF* your stay!\n` +
      `🎟️ Code: \`${coupon.code}\`\n` +
      `📅 Valid until: ${fmtDate(coupon.expiresAt)}\n\n` +
      `👉 View & share coupon: ${sharePageUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyShareLink = async () => {
    await navigator.clipboard.writeText(sharePageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenPdf = () => {
    window.open(`/api/coupons/pdf?code=${encodeURIComponent(coupon.code)}`, '_blank');
  };

  return (
    <div className="space-y-2 mt-4">
      {/* Top row: WhatsApp + Copy Code */}
      <div className="flex gap-2">
        {/* WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: '#25D366' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Share on WhatsApp
        </button>

        {/* Copy Code */}
        <button
          onClick={handleCopyCode}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl border-2 hover:bg-gray-50 transition-colors"
          style={{ borderColor: copied ? '#22C55E' : '#E5E7EB', color: copied ? '#16A34A' : '#374151' }}
        >
          {copied
            ? <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
            : <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path strokeLinecap="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy Code</>
          }
        </button>
      </div>

      {/* Bottom row: Share + Print + PDF + Save */}
      <div className="flex gap-2">
        {/* Share Page */}
        <button
          onClick={handleCopyShareLink}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border-2 hover:bg-gray-50 transition-colors"
          style={{ borderColor: copied ? '#22C55E' : '#E5E7EB', color: copied ? '#16A34A' : '#374151' }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
          {copied ? 'Copied!' : 'Share'}
        </button>

        {/* PDF Download */}
        <button
          onClick={handleOpenPdf}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border-2 hover:bg-red-50 transition-colors"
          style={{ borderColor: '#FECACA', color: '#DC2626' }}
          title="Open print-ready PDF coupon in new tab"
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            <path strokeLinecap="round" d="M9 13h6m-3-3v6"/>
          </svg>
          PDF
        </button>

        {/* Print */}
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border-2 hover:bg-gray-50 transition-colors"
          style={{ borderColor: '#E5E7EB', color: '#374151' }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9"/><path strokeLinecap="round" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print
        </button>

        {/* Save Image */}
        <button
          onClick={handleSaveImage}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border-2 hover:bg-gray-50 transition-colors disabled:opacity-60"
          style={{ borderColor: '#E5E7EB', color: '#374151' }}
        >
          {saving
            ? <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            : <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          }
          {saving ? '…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CouponsClient({ coupons, ownerName, ownerAvatar }: Props) {
  const [tab, setTab]                   = useState<TabId>('all');
  const [selectedId, setSelectedId]     = useState<string | null>(coupons[0]?.id ?? null);
  const [mobileDetail, setMobileDetail] = useState(false);

  const filtered = useMemo(() => {
    if (tab === 'all') return coupons;
    return coupons.filter(c => c.status === tab);
  }, [coupons, tab]);

  const selected = useMemo(() => coupons.find(c => c.id === selectedId) ?? null, [coupons, selectedId]);

  const tabCount = (id: TabId) => id === 'all' ? coupons.length : coupons.filter(c => c.status === id).length;
  const activeCount   = coupons.filter(c => c.status === 'active').length;
  const redeemedCount = coupons.filter(c => c.status === 'redeemed').length;

  const handleSelect = (id: string) => { setSelectedId(id); setMobileDetail(true); };

  const initials = ownerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (coupons.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div
            className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl mb-5"
            style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
          >
            🎫
          </div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#1A3C5E' }}>No coupons yet</h2>
          <p className="text-gray-400 text-sm mb-8">Browse hotels and generate your first exclusive discount coupon</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
          >
            🏨 Browse Hotels
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>

      {/* ── Hero banner ───────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.07]" style={{ background: 'white' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-[0.06]" style={{ background: 'white' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: title + user */}
            <div className="flex items-center gap-4">
              {ownerAvatar ? (
                <img src={ownerAvatar} alt="" className="w-11 h-11 rounded-2xl object-cover border-2 shadow-md flex-shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
              ) : (
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)' }}
                >
                  {initials}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">My Coupons</h1>
                <p className="text-white/55 text-xs mt-0.5">{ownerName}</p>
              </div>
            </div>

            {/* Right: CTA */}
            <Link
              href="/"
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Get More Coupons
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { icon: '🎫', value: coupons.length,  label: 'Total'    },
              { icon: '✅', value: activeCount,      label: 'Active'   },
              { icon: '✔️', value: redeemedCount,    label: 'Redeemed' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-white font-extrabold text-lg leading-none">{s.value}</p>
                  <p className="text-white/50 text-[10px] font-medium mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {TABS.map(t => {
            const count = tabCount(t.id);
            if (t.id !== 'all' && count === 0) return null;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                style={isActive
                  ? { background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)', color: 'white', boxShadow: '0 2px 8px rgba(14,124,123,0.25)' }
                  : { background: 'white', color: '#6B7280', border: '1.5px solid #E5E7EB' }
                }
              >
                {t.label}
                <span
                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                  style={isActive
                    ? { background: 'rgba(255,255,255,0.22)', color: 'white' }
                    : { background: '#F3F4F6', color: '#6B7280' }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Two-panel layout */}
        <div className="flex gap-4" style={{ minHeight: 600 }}>

          {/* LEFT: coupon list */}
          <div
            className={`flex flex-col ${mobileDetail ? 'hidden md:flex' : 'flex'} md:flex`}
            style={{ width: '100%', maxWidth: 340, flexShrink: 0 }}
          >
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5" style={{ maxHeight: 640 }}>
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-sm text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                  No {tab} coupons
                </div>
              ) : (
                filtered.map(c => (
                  <CouponListItem
                    key={c.id}
                    coupon={c}
                    isSelected={selectedId === c.id}
                    onClick={() => handleSelect(c.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* RIGHT: detail panel */}
          <div className={`flex-1 min-w-0 ${mobileDetail ? 'flex' : 'hidden md:flex'} flex-col`}>
            {selected ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Hotel hero image banner */}
                <div className="relative h-40 overflow-hidden">
                  {selected.hotel.coverImage ? (
                    <img src={selected.hotel.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }} />
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)' }} />

                  {/* Mobile back button */}
                  <button
                    onClick={() => setMobileDetail(false)}
                    className="md:hidden absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl"
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
                    Back
                  </button>

                  {/* Hotel info overlay */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-white font-extrabold text-base leading-tight drop-shadow">{selected.hotel.name}</h2>
                      <p className="text-white/70 text-xs mt-0.5">
                        📍 {selected.hotel.city}, {selected.hotel.country}
                        {' '}<span className="text-yellow-300">{stars(selected.hotel.starRating)}</span>
                      </p>
                      {selected.guestName && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-purple-200 bg-purple-900/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-purple-400/30">
                          👥 {selected.guestName}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/hotels/${selected.hotel.slug}`}
                      className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm text-white border border-white/25 hover:bg-white/25 transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                </div>

                {/* Coupon card + actions */}
                <div className="p-5">
                  {/* Meta row */}
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const m = STATUS_META[selected.status] || STATUS_META.expired;
                      return (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block' }} />
                          {m.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-gray-400">Expires {fmtDate(selected.expiresAt)}</span>
                    {selected.status === 'active' && (
                      <CountdownBadge expiresAt={selected.expiresAt} />
                    )}
                  </div>

                  {/* The coupon ticket */}
                  <div className="flex justify-center mb-2">
                    <CouponCard coupon={selected} ownerName={ownerName} />
                  </div>

                  {/* Action buttons */}
                  <div className="max-w-sm mx-auto">
                    <CouponActions coupon={selected} ownerName={ownerName} />
                  </div>

                  {/* Bottom meta strip */}
                  <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Generated',  value: fmtDate(selected.generatedAt)           },
                      { label: 'Expires',    value: fmtDate(selected.expiresAt)              },
                      { label: 'Discount',   value: `${selected.discountPercent}% OFF`       },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-xs font-bold text-gray-700">{item.value}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-300">
                <div className="text-center py-16">
                  <div className="text-5xl mb-3 opacity-40">🎫</div>
                  <p className="text-sm font-medium">Select a coupon to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline countdown badge ────────────────────────────────────────────────────
function CountdownBadge({ expiresAt }: { expiresAt: string }) {
  const label = useCountdown(expiresAt, 'active');
  if (!label) return null;
  return (
    <span className="text-xs font-semibold text-orange-500">⏱ {label}</span>
  );
}
