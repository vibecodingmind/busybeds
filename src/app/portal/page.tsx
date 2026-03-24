'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import QrScanner from '@/components/QrScanner';

interface ScanResult {
  valid: boolean;
  reason?: string;
  coupon?: {
    code: string;
    discountPercent: number;
    expiresAt: string;
    redeemedAt?: string;
    hotel: { name: string; city: string };
    user: { fullName: string; email: string };
  };
}

function PortalContent() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Auto-fill if code comes from QR scan
  useEffect(() => {
    const scan = searchParams.get('scan');
    if (scan) setCode(scan);
  }, [searchParams]);

  const scan = async (codeToScan?: string) => {
    const c = codeToScan || code;
    if (!c.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/coupons/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c.trim() }),
      });
      const data = await res.json();
      setResult(data);
      if (data.valid) {
        setHistory(prev => [data, ...prev].slice(0, 10));
        setCode('');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-scan when code comes from URL
  useEffect(() => {
    const scan = searchParams.get('scan');
    if (scan) { setCode(scan); setTimeout(() => scan && scan.length > 0 && document.getElementById('scanBtn')?.click(), 300); }
  }, [searchParams]);

  const handleCameraScan = (scannedCode: string) => {
    setCode(scannedCode);
    setShowScanner(false);
    // Auto-submit the scan
    setTimeout(() => {
      scan(scannedCode);
    }, 100);
  };

  const navItems = [
    { href: '/portal', label: 'Scanner', icon: '🎫' },
    { href: '/portal/manage', label: 'Manage Hotel', icon: '🏨' },
    { href: '/portal/analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: '#1A3C5E' }}>BB</div>
            <span className="font-bold text-sm" style={{ color: '#1A3C5E' }}>Hotel Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon} </span>
                {item.label}
              </Link>
            ))}
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Staff View</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: '#1A3C5E' }}>Coupon Scanner</h1>
          <p className="text-gray-500 text-sm mt-0.5">Scan or enter a guest&apos;s coupon code to validate and apply their discount</p>
        </div>

        {/* Scanner Input */}
        <div className="card p-6">
          <label className="label">Coupon Code</label>
          <div className="flex gap-2">
            <input
              className="input flex-1 font-mono text-sm uppercase"
              placeholder="Enter or paste coupon code..."
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && scan()}
            />
            <button
              id="scanBtn"
              onClick={() => scan()}
              disabled={loading || !code.trim()}
              className="btn-primary px-6 disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full block"></span>
              ) : 'Verify'}
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">
              💡 Tip: QR codes link directly here with the code pre-filled.
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              style={{
                color: '#0E7C7B',
                backgroundColor: 'rgba(14, 124, 123, 0.1)',
                border: '1px solid rgba(14, 124, 123, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(14, 124, 123, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(14, 124, 123, 0.1)';
              }}
            >
              📷 Camera
            </button>
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <QrScanner
            onScan={handleCameraScan}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* Result */}
        {result && (
          <div className={`card p-6 border-2 ${result.valid ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            {result.valid ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">✅</div>
                  <div>
                    <h2 className="font-bold text-green-800 text-lg">Valid — Discount Applied!</h2>
                    <p className="text-green-600 text-sm">Coupon successfully redeemed</p>
                  </div>
                </div>
                {result.coupon && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">Guest</p>
                      <p className="font-semibold text-gray-800">{result.coupon.user.fullName}</p>
                      <p className="text-gray-500 text-xs">{result.coupon.user.email}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-gray-400 text-xs mb-1">Discount</p>
                      <p className="text-3xl font-extrabold text-teal-600">{result.coupon.discountPercent}%</p>
                      <p className="text-gray-400 text-xs">off their stay</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 col-span-2">
                      <p className="text-gray-400 text-xs mb-1">Hotel</p>
                      <p className="font-semibold text-gray-800">{result.coupon.hotel.name}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl">❌</div>
                <div>
                  <h2 className="font-bold text-red-800 text-lg">Invalid Coupon</h2>
                  <p className="text-red-600 text-sm">{result.reason || 'This coupon cannot be accepted'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Redemption History */}
        {history.length > 0 && (
          <div>
            <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-3">Session History</h2>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{h.valid ? '✅' : '❌'}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-700">{h.coupon?.user.fullName || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{h.coupon?.hotel.name}</div>
                    </div>
                  </div>
                  {h.coupon && (
                    <span className="font-bold text-teal-600">{h.coupon.discountPercent}% OFF</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalPage() {
  return <Suspense><PortalContent /></Suspense>;
}
