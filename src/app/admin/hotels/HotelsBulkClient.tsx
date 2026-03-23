'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Hotel {
  id: string; name: string; city: string; country: string;
  status: string; discountPercent: number; createdAt: string;
  isFeatured?: boolean;
  owner?: { fullName: string; email: string };
}

interface Props { initialHotels: Hotel[]; }

export default function HotelsBulkClient({ initialHotels }: Props) {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>(initialHotels);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const deleteHotel = async (hotel: Hotel) => {
    if (!confirm(`Delete "${hotel.name}"? This cannot be undone.`)) return;
    setDeleting(hotel.id);
    try {
      const res = await fetch(`/api/admin/hotels/${hotel.id}`, { method: 'DELETE' });
      if (res.ok) {
        setHotels(prev => prev.filter(h => h.id !== hotel.id));
        setMsg(`✓ "${hotel.name}" deleted`);
        setTimeout(() => setMsg(''), 4000);
      } else {
        const d = await res.json();
        setMsg(`✗ ${d.error || 'Delete failed'}`);
      }
    } catch {
      setMsg('✗ Network error');
    }
    setDeleting(null);
  };

  const toggleFeatured = async (hotel: Hotel) => {
    setToggling(hotel.id);
    try {
      const res = await fetch(`/api/admin/hotels/${hotel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !hotel.isFeatured }),
      });
      if (res.ok) {
        setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, isFeatured: !h.isFeatured } : h));
        setMsg(`✓ "${hotel.name}" ${!hotel.isFeatured ? 'featured' : 'unfeatured'}`);
        setTimeout(() => setMsg(''), 4000);
      } else {
        const d = await res.json();
        setMsg(`✗ ${d.error || 'Toggle failed'}`);
      }
    } catch {
      setMsg('✗ Network error');
    }
    setToggling(null);
  };

  const filtered = hotels.filter(h => {
    const matchStatus = filter === 'all' || h.status === filter;
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(h => h.id)));
    }
  };

  const bulkAction = async (action: string) => {
    if (selected.size === 0) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/hotels/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      const data = await res.json();
      if (res.ok) {
        setHotels(prev => prev.map(h => selected.has(h.id) ? { ...h, status: action } : h));
        setMsg(`✓ ${data.updated} hotels updated to "${action}"`);
        setSelected(new Set());
      } else {
        setMsg(`✗ ${data.error}`);
      }
    } catch (e: any) {
      setMsg(`✗ ${e.message}`);
    }
    setLoading(false);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-600',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {['all', 'pending', 'active', 'inactive', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1 text-xs opacity-70">
                ({s === 'all' ? hotels.length : hotels.filter(h => h.status === s).length})
              </span>
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hotels…"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            {[
              { action: 'active', label: '✓ Approve', cls: 'bg-green-500 hover:bg-green-600' },
              { action: 'rejected', label: '✗ Reject', cls: 'bg-red-500 hover:bg-red-600' },
              { action: 'inactive', label: '⏸ Deactivate', cls: 'bg-gray-500 hover:bg-gray-600' },
            ].map(({ action, label, cls }) => (
              <button key={action} onClick={() => bulkAction(action)} disabled={loading}
                className={`px-3 py-1.5 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${cls}`}>
                {label}
              </button>
            ))}
            <button onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Clear
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
              <th className="px-4 py-3 w-10">
                <input type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-[#FF385C] focus:ring-[#FF385C]" />
              </th>
              {['Hotel', 'Location', 'Status', 'Discount', 'Owner', 'Added', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.map(hotel => (
              <tr key={hotel.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${selected.has(hotel.id) ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(hotel.id)} onChange={() => toggleSelect(hotel.id)}
                    className="rounded border-gray-300 text-[#FF385C] focus:ring-[#FF385C]" />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/hotels/${hotel.id}`} className="font-medium text-gray-900 dark:text-white hover:text-[#FF385C] transition-colors">
                    {hotel.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{hotel.city}, {hotel.country}</td>
                <td className="px-4 py-3">{statusBadge(hotel.status)}</td>
                <td className="px-4 py-3 font-semibold text-pink-500">{hotel.discountPercent}%</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  <div>{hotel.owner?.fullName || '—'}</div>
                  <div className="text-gray-400">{hotel.owner?.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(hotel.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => { setSelected(new Set([hotel.id])); bulkAction('active'); }} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => { setSelected(new Set([hotel.id])); bulkAction('rejected'); }} className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                      Reject
                    </button>
                    <button
                      onClick={() => toggleFeatured(hotel)}
                      disabled={toggling === hotel.id}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors disabled:opacity-40 ${hotel.isFeatured ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'}`}>
                      {toggling === hotel.id ? '…' : hotel.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <Link href={`/admin/hotels/${hotel.id}/edit`}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteHotel(hotel)}
                      disabled={deleting === hotel.id}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-40">
                      {deleting === hotel.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No hotels found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
