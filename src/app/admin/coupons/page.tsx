import prisma from '@/lib/prisma';

export const metadata = { title: 'Coupons — BusyBeds Admin' };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { generatedAt: 'desc' },
    take: 200,
    include: {
      hotel: { select: { name: true, city: true } },
      user:  { select: { fullName: true, email: true } },
    },
  });

  const statusCount = {
    active:   coupons.filter(c => c.status === 'active').length,
    redeemed: coupons.filter(c => c.status === 'redeemed').length,
    expired:  coupons.filter(c => c.status === 'expired').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Coupons</h1>
        <p className="text-sm text-gray-500 mt-0.5">{coupons.length} total coupons issued</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active',   count: statusCount.active,   color: 'text-green-700 bg-green-50 border-green-100' },
          { label: 'Redeemed', count: statusCount.redeemed, color: 'text-blue-700 bg-blue-50 border-blue-100' },
          { label: 'Expired',  count: statusCount.expired,  color: 'text-gray-600 bg-gray-50 border-gray-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.color.split(' ').slice(1).join(' ')}`}>
            <p className={`text-3xl font-extrabold ${s.color.split(' ')[0]}`}>{s.count}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">User / Guest</th>
                <th className="px-5 py-3 font-semibold">Hotel</th>
                <th className="px-5 py-3 font-semibold">Discount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Issued</th>
                <th className="px-5 py-3 font-semibold">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-gray-700">{c.code}</td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-gray-800 truncate max-w-[130px]">{c.user.fullName}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[130px]">{c.user.email}</p>
                      {c.guestName && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full">
                          👥 {c.guestName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-gray-700 truncate max-w-[130px]">{c.hotel.name}</p>
                    <p className="text-xs text-gray-400">{c.hotel.city}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{c.discountPercent}% off</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      c.status === 'active'   ? 'bg-green-50 text-green-700' :
                      c.status === 'redeemed' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(c.generatedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No coupons yet</div>}
        </div>
      </div>
    </div>
  );
}
