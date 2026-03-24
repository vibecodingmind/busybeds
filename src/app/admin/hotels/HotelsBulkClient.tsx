'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Hotel {
  id: string; name: string; city: string; country: string;
  status: string; discountPercent: number; createdAt: string;
  isFeatured?: boolean;
  partnershipStatus?: 'ACTIVE' | 'INACTIVE' | 'LISTING_ONLY';
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
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Check if hotel can be deleted (must be inactive or rejected)
  const canDelete = (h: Hotel) => h.status === 'inactive' || h.status === 'rejected';

  // Get selected hotels that are deletable
  const selectedDeletable = useMemo(() => 
    hotels.filter(h => selected.has(h.id) && canDelete(h)),
    [hotels, selected]
  );

  // Count of deletable hotels
  const deletableCount = useMemo(() => 
    hotels.filter(h => canDelete(h)).length,
    [hotels]
  );

  const deleteHotel = async (hotel: Hotel) => {
    if (!canDelete(hotel)) {
      setMsg(`✗ Can only delete inactive or rejected hotels`);
      setTimeout(() => setMsg(''), 4000);
      return;
    }
    if (!confirm(`Delete "${hotel.name}"? This cannot be undone.`)) return;
    setDeleting(hotel.id);
    try {
      const res = await fetch(`/api/admin/hotels/${hotel.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setHotels(prev => prev.filter(h => h.id !== hotel.id));
        setSelected(prev => { const next = new Set(prev); next.delete(hotel.id); return next; });
        setMsg(`✓ "${hotel.name}" deleted`);
        setTimeout(() => setMsg(''), 4000);
      } else {
        setMsg(`✗ ${data.error || data.details || 'Delete failed'}`);
      }
    } catch {
      setMsg('✗ Network error');
    }
    setDeleting(null);
  };

  // Bulk delete selected hotels
  const bulkDelete = async () => {
    if (selectedDeletable.length === 0) {
      setMsg(`✗ No deletable hotels selected (must be inactive or rejected)`);
      setTimeout(() => setMsg(''), 4000);
      return;
    }
    if (!confirm(`Delete ${selectedDeletable.length} hotel(s)? This cannot be undone.`)) return;
    
    setBulkDeleteLoading(true);
    try {
      const res = await fetch('/api/admin/hotels/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        setHotels(prev => prev.filter(h => !selected.has(h.id)));
        setSelected(new Set());
        setMsg(`✓ ${data.deleted} hotel(s) deleted`);
        setTimeout(() => setMsg(''), 4000);
      } else {
        setMsg(`✗ ${data.error || data.details || 'Delete failed'}`);
      }
    } catch {
      setMsg('✗ Network error');
    }
    setBulkDeleteLoading(false);
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

  const togglePartnership = async (hotel: Hotel) => {
    setToggling(hotel.id);
    // Cycle through: ACTIVE -> INACTIVE -> LISTING_ONLY -> ACTIVE
    const cycle: Record<string, string> = {
      'ACTIVE': 'INACTIVE',
      'INACTIVE': 'LISTING_ONLY',
      'LISTING_ONLY': 'ACTIVE',
    };
    const newStatus = cycle[hotel.partnershipStatus || 'ACTIVE'] || 'INACTIVE';
    try {
      const res = await fetch(`/api/admin/hotels/${hotel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnershipStatus: newStatus }),
      });
      if (res.ok) {
        setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, partnershipStatus: newStatus as any } : h));
        setMsg(`✓ "${hotel.name}" partnership: ${newStatus}`);
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

  const partnershipBadge = (status?: string) => {
    if (!status || status === 'ACTIVE') return null;
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-orange-100 text-orange-700',
      LISTING_ONLY: 'bg-gray-100 text-gray-600',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Partner',
      INACTIVE: 'Ended',
      LISTING_ONLY: 'Listed',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
  };

  // Select all deletable hotels (inactive or rejected)
  const selectAllDeletable = () => {
    setSelected(new Set(hotels.filter(h => canDelete(h)).map(h => h.id)));
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
        <div className="flex gap-2 items-center">
          <button
            onClick={selectAllDeletable}
            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            Select Deletable ({deletableCount})
          </button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hotels…"
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {selected.size} selected
            {selectedDeletable.length > 0 && (
              <span className="ml-2 text-xs text-red-600 font-normal">({selectedDeletable.length} deletable)</span>
            )}
          </span>
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
            {/* Bulk Delete Button */}
            <button 
              onClick={bulkDelete} 
              disabled={bulkDeleteLoading || selectedDeletable.length === 0}
              className="px-3 py-1.5 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-700 hover:bg-red-800 flex items-center gap-1.5"
              title={selectedDeletable.length === 0 ? 'Select inactive/rejected hotels to delete' : `Delete ${selectedDeletable.length} hotel(s)`}
            >
              {bulkDeleteLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/></svg>
                  Delete ({selectedDeletable.length})
                </>
              )}
            </button>
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
              {['Hotel', 'Location', 'Status', 'Partner', 'Discount', 'Owner', 'Added', 'Actions'].map(h => (
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
                <td className="px-4 py-3">
                  <button
                    onClick={() => togglePartnership(hotel)}
                    disabled={toggling === hotel.id}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-40 ${
                      hotel.partnershipStatus === 'ACTIVE' || !hotel.partnershipStatus 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : hotel.partnershipStatus === 'INACTIVE'
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Click to cycle: Active → Inactive → Listed"
                  >
                    {toggling === hotel.id ? '…' : (
                      !hotel.partnershipStatus || hotel.partnershipStatus === 'ACTIVE' ? 'Partner' 
                      : hotel.partnershipStatus === 'INACTIVE' ? 'Ended'
                      : 'Listed'
                    )}
                  </button>
                </td>
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
                      disabled={deleting === hotel.id || !canDelete(hotel)}
                      title={!canDelete(hotel) ? 'Must be inactive or rejected first' : 'Delete hotel'}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${canDelete(hotel) ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-50 text-gray-400'}`}>
                      {deleting === hotel.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No hotels found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
