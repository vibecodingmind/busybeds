'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function CouponHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/coupon-redemption')
      .then(r => r.json())
      .then(d => setHistory(d.redemptionHistory || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Your Coupon Redemption History</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : history.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-5xl mb-4">🎫</div>
            <p className="text-gray-600 dark:text-gray-400">No redeemed coupons yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(coupon => (
              <div key={coupon.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{coupon.hotel?.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{coupon.hotel?.city}, {coupon.hotel?.country}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-pink-600 font-semibold">{coupon.discountPercent}% off</span>
                    <span className="text-gray-500">Code: {coupon.code.slice(-6)}</span>
                    {coupon.redeemedAt && (
                      <span className="text-green-600">✅ {new Date(coupon.redeemedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    coupon.status === 'redeemed' ? 'bg-green-100 text-green-700' :
                    coupon.status === 'expired' ? 'bg-gray-100 text-gray-600' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {coupon.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
