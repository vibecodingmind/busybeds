'use client';

interface Props {
  dailyRedemptions: { date: string; count: number }[];
  topHotels: { name: string; redeemed: number }[];
  revenueByPlan: { plan: string; count: number }[];
  monthlySignups: { month: string; count: number }[];
}

export default function AnalyticsCharts({
  dailyRedemptions,
  topHotels,
  revenueByPlan,
  monthlySignups,
}: Props) {
  // Helper to get max value for scaling
  const getMax = (data: number[]) => Math.max(...data, 1);

  // Daily Redemptions
  const dailyMax = getMax(dailyRedemptions.map(d => d.count));
  const dailyPercents = dailyRedemptions.map(d => (d.count / dailyMax) * 100);

  // Top Hotels
  const hotelsMax = getMax(topHotels.map(h => h.redeemed));
  const hotelsPercents = topHotels.map(h => (h.redeemed / hotelsMax) * 100);

  // Monthly Signups
  const signupsMax = getMax(monthlySignups.map(m => m.count));
  const signupsPercents = monthlySignups.map(m => (m.count / signupsMax) * 100);

  return (
    <div className="space-y-6">
      {/* Daily Redemptions Chart */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4" style={{ color: '#1A3C5E' }}>
          Daily Redemptions (14 days)
        </h2>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-2" style={{ minWidth: '100%' }}>
            {dailyRedemptions.map((item, idx) => {
              const percent = dailyPercents[idx] || 0;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-2 font-medium">
                    {item.count}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t rounded transition-all hover:opacity-80"
                    style={{
                      background: 'linear-gradient(to top, #0E7C7B, #1A3C5E)',
                      height: `${Math.max(percent, 5)}px`,
                      minHeight: '5px',
                    }}
                  />
                  <div className="text-xs text-gray-400 mt-2 text-center break-words max-w-full">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Hotels Chart */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4" style={{ color: '#1A3C5E' }}>
          Top Hotels by Redemptions
        </h2>
        <div className="space-y-4">
          {topHotels.map((hotel, idx) => {
            const percent = hotelsPercents[idx] || 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium text-gray-700 truncate flex-1">
                    {hotel.name}
                  </div>
                  <div className="text-gray-500 ml-2 whitespace-nowrap">
                    {hotel.redeemed}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      background: 'linear-gradient(to right, #0E7C7B, #1A3C5E)',
                      width: `${percent}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription Plans Stats */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4" style={{ color: '#1A3C5E' }}>
          Active Subscriptions by Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenueByPlan.map((plan, idx) => {
            const colors = [
              { bg: '#E0F2F1', text: '#00695C' }, // teal light
              { bg: '#ECEFF1', text: '#1A3C5E' }, // navy light
              { bg: '#FFF3E0', text: '#E65100' }, // gold light
            ];
            const color = colors[idx % 3];
            return (
              <div
                key={idx}
                className="p-4 rounded-lg text-center"
                style={{ background: color.bg, color: color.text }}
              >
                <div className="text-sm font-medium opacity-80 mb-1">
                  {plan.plan}
                </div>
                <div className="text-3xl font-bold">
                  {plan.count}
                </div>
                <div className="text-xs opacity-60 mt-1">subscribers</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Signups Chart */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4" style={{ color: '#1A3C5E' }}>
          Monthly Signups
        </h2>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-3" style={{ minWidth: '100%' }}>
            {monthlySignups.map((item, idx) => {
              const percent = signupsPercents[idx] || 0;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-2 font-medium">
                    {item.count}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t rounded transition-all hover:opacity-80"
                    style={{
                      background: 'linear-gradient(to top, #0E7C7B, #1A3C5E)',
                      height: `${Math.max(percent, 5)}px`,
                      minHeight: '5px',
                    }}
                  />
                  <div className="text-xs text-gray-400 mt-2 text-center truncate w-full">
                    {new Date(item.month + '-01').toLocaleDateString('en-US', {
                      month: 'short',
                      year: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
