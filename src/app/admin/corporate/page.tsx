'use client';
import { useState, useEffect, useCallback } from 'react';

interface Member { id: string; fullName: string; email: string; }
interface CorporateAccount {
  id: string;
  companyName: string;
  industry?: string;
  country: string;
  contactEmail: string;
  contactPhone?: string;
  maxSeats: number;
  status: string;
  notes?: string;
  createdAt: string;
  adminUser: { id: string; fullName: string; email: string };
  members: Member[];
  subscriptions: Array<{ id: string; expiresAt: string; package: { name: string } }>;
}

interface Stats {
  total: number; active: number; pending: number; suspended: number;
  totalSeats: number; totalMembers: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AccountRow({ account, onAction }: { account: CorporateAccount; onAction: (id: string, action: string, extra?: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [seats, setSeats] = useState(String(account.maxSeats));
  const [editSeats, setEditSeats] = useState(false);
  const activeSub = account.subscriptions[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{account.companyName}</h3>
            <StatusBadge status={account.status} />
            {activeSub && (
              <span className="text-[11px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">{activeSub.package.name}</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {account.industry && `${account.industry} · `}{account.country} · {account.contactEmail}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Admin: {account.adminUser.fullName} ({account.adminUser.email}) ·
            {account.members.length}/{account.maxSeats} seats ·
            Applied {new Date(account.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button onClick={() => setOpen(o => !o)}
          className="text-gray-400 hover:text-gray-600 transition ml-2">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-4 flex flex-wrap gap-2">
        {account.status === 'pending' && (
          <button onClick={() => onAction(account.id, 'active')}
            className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition">
            ✓ Approve
          </button>
        )}
        {account.status === 'active' && (
          <button onClick={() => onAction(account.id, 'suspended')}
            className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-200 transition">
            Suspend
          </button>
        )}
        {account.status === 'suspended' && (
          <button onClick={() => onAction(account.id, 'active')}
            className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition">
            Reactivate
          </button>
        )}

        {/* Seat editor */}
        {editSeats ? (
          <div className="flex items-center gap-2">
            <input type="number" min="2" max="500" value={seats}
              onChange={e => setSeats(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button onClick={() => { onAction(account.id, account.status, { maxSeats: Number(seats) }); setEditSeats(false); }}
              className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition">
              Save
            </button>
            <button onClick={() => setEditSeats(false)}
              className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditSeats(true)}
            className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
            ✎ Edit Seats
          </button>
        )}
      </div>

      {/* Expanded: Members */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Team Members ({account.members.length})</p>
          {account.members.length === 0 ? (
            <p className="text-sm text-gray-400">No members yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {account.members.map(m => (
                <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {m.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {account.notes && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{account.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCorporatePage() {
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/admin/corporate?status=${statusFilter}` : '/api/admin/corporate';
      const res = await fetch(url);
      const data = await res.json();
      setAccounts(data.accounts || []);
      setStats(data.stats || null);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string, newStatus: string, extra?: Record<string, unknown>) => {
    await fetch('/api/admin/corporate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus, ...extra }),
    });
    fetchData();
  };

  const FILTERS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Corporate Accounts</h1>
        <p className="text-gray-500 mt-1">Manage group &amp; corporate subscriptions</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Active', value: stats.active, color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
            { label: 'Suspended', value: stats.suspended, color: 'text-red-600' },
            { label: 'Total Seats', value: stats.totalSeats, color: 'text-blue-600' },
            { label: 'Members', value: stats.totalMembers, color: 'text-violet-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              statusFilter === f.value
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f.label}
            {f.value === '' && stats && ` (${stats.total})`}
            {f.value === 'pending' && stats && ` (${stats.pending})`}
            {f.value === 'active' && stats && ` (${stats.active})`}
            {f.value === 'suspended' && stats && ` (${stats.suspended})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-gray-600 font-medium">No corporate accounts yet</p>
          <p className="text-gray-400 text-sm mt-1">Applications will appear here once companies apply at /corporate</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map(a => (
            <AccountRow key={a.id} account={a} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
