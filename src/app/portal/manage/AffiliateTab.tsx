'use client';
import { useState } from 'react';

interface AffiliateLink {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
}

interface Props {
  hotelId: string;
  initialLinks: AffiliateLink[];
}

const PLATFORM_MAP: Record<string, { label: string; icon: string }> = {
  booking_com: { label: 'Booking.com', icon: '🏨' },
  airbnb: { label: 'Airbnb', icon: '🏠' },
  expedia: { label: 'Expedia', icon: '✈️' },
  agoda: { label: 'Agoda', icon: '🌏' },
  tripadvisor: { label: 'TripAdvisor', icon: '🦉' },
};

const PLATFORMS = Object.entries(PLATFORM_MAP).map(([key, value]) => ({
  id: key,
  label: value.label,
  icon: value.icon,
}));

export default function AffiliateTab({ hotelId, initialLinks }: Props) {
  const [links, setLinks] = useState<AffiliateLink[]>(initialLinks || []);
  const [platform, setPlatform] = useState('booking_com');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deleting, setDeleting] = useState<string | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAddLink = async () => {
    if (!url.trim()) {
      showMessage('error', 'Please enter a URL');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/portal/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, url }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage('error', data.error || 'Failed to add link');
        return;
      }

      setLinks(prev => [...prev, data.link]);
      setPlatform('booking_com');
      setUrl('');
      showMessage('success', 'Link added successfully');
    } catch (error) {
      showMessage('error', 'Error adding link');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    setDeleting(linkId);
    try {
      const res = await fetch(`/api/portal/affiliates?linkId=${linkId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        showMessage('error', 'Failed to delete link');
        return;
      }

      setLinks(prev => prev.filter(l => l.id !== linkId));
      showMessage('success', 'Link removed');
    } catch (error) {
      showMessage('error', 'Error deleting link');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Affiliate Links</h2>

      {/* Current Links */}
      {links.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Current Links</h3>
          {links.map(link => {
            const platformInfo = PLATFORM_MAP[link.platform];
            return (
              <div key={link.id} className="card p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">{platformInfo?.icon || '🔗'}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">
                      {platformInfo?.label || link.platform}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{link.url}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  disabled={deleting === link.id}
                  className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  {deleting === link.id ? '...' : '✕'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Link Form */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Add Affiliate Link</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Platform</label>
            <select
              className="input"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              {PLATFORMS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Affiliate Link URL</label>
            <input
              className="input"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>
          <button
            onClick={handleAddLink}
            disabled={adding || !url.trim()}
            className="w-full btn-primary disabled:opacity-50"
          >
            {adding ? 'Adding...' : '+ Add Link'}
          </button>
        </div>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
