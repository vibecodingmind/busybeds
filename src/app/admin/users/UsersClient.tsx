'use client';
import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string; fullName: string; email: string; role: string;
  createdAt: string; isBanned: boolean;
  _count: { coupons: number };
  hotelOwner?: { id: string } | null;
}

const ROLES = ['traveler', 'hotel_owner', 'hotel_manager', 'admin'];

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const userAction = async (userId: string, action: string, role?: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? {
          ...u,
          isBanned: data.user.isBanned ?? u.isBanned,
          role: data.user.role ?? u.role,
        } : u));
        setMsg(`✓ User updated`);
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {}
  };

  const roleBadgeClass = (role: string) => {
    const classes: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      hotel_owner: 'bg-blue-100 text-blue-700',
      hotel_manager: 'bg-cyan-100 text-cyan-700',
      traveler: 'bg-gray-100 text-gray-600',
    };
    return classes[role] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm flex-1 max-w-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]" />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none">
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">{total} users total</span>
      </div>

      {msg && <div className="px-4 py-2 bg-green-50 text-green-700 text-sm rounded-xl">{msg}</div>}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 text-left">
              {['User', 'Role', 'Coupons', 'Hotels', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /></td></tr>
              ))
            ) : users.map(user => (
              <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${user.isBanned ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{user.fullName}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <select value={user.role} onChange={e => userAction(user.id, 'set_role', e.target.value)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 focus:outline-none cursor-pointer ${roleBadgeClass(user.role)}`}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user._count.coupons}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.hotelOwner ? '1' : '0'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {user.isBanned ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">Banned</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded-full">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => userAction(user.id, user.isBanned ? 'unban' : 'ban')}
                    className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${
                      user.isBanned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}>
                    {user.isBanned ? 'Unban' : 'Ban'}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">← Prev</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {Math.ceil(total / 50)}</span>
          <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
