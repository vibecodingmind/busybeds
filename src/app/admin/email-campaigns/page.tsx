'use client';
import { useState, useEffect } from 'react';

export default function AdminEmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipientCount, setRecipientCount] = useState('0');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/email-campaigns')
      .then(r => r.json())
      .then(d => setCampaigns(d.campaigns || []))
      .finally(() => setLoading(false));
  }, []);

  const createCampaign = async () => {
    if (!title || !content) return alert('Fill in all fields');
    setCreating(true);
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, recipientCount: parseInt(recipientCount) }),
      });
      const data = await res.json();
      setCampaigns([data.campaign, ...campaigns]);
      setTitle('');
      setContent('');
      setRecipientCount('0');
      alert('Campaign created!');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Email Campaigns</h1>
        <p className="text-gray-500">Create and track email marketing campaigns</p>
      </div>

      {/* Create Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 space-y-6">
        <h2 className="text-xl font-semibold">New Campaign</h2>

        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Summer Flash Sales"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Campaign email content..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Expected Recipients</label>
          <input
            type="number"
            value={recipientCount}
            onChange={e => setRecipientCount(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <button
          onClick={createCampaign}
          disabled={creating}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-6">Recent Campaigns</h2>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No campaigns yet</div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {c.recipientCount} recipients • {c._count?.trackingEvents || 0} opens
                  </div>
                </div>
                <div className="text-xs text-gray-500">{new Date(c.sentAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
