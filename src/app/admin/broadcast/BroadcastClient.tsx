'use client';
import { useState } from 'react';

export default function BroadcastClient() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('system');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type, link: link || undefined }),
      });
      if (res.ok) {
        setSent(true);
        setTitle(''); setMessage(''); setLink('');
        setTimeout(() => setSent(false), 3000);
      }
    } catch {}
    setSending(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Broadcast Message</h1>
      <form onSubmit={send} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
            placeholder="🔥 Flash Sale — 50% off this weekend!" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={3}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
            placeholder="Details about the announcement..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none">
              <option value="system">System</option>
              <option value="deal">Deal</option>
              <option value="coupon">Coupon</option>
              <option value="points">Points</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link (optional)</label>
            <input value={link} onChange={e => setLink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              placeholder="/hotels" />
          </div>
        </div>
        <button type="submit" disabled={sending}
          className="w-full py-3 bg-[#FF385C] hover:bg-[#e0334f] text-white font-semibold rounded-xl transition-colors disabled:opacity-60">
          {sending ? 'Sending…' : sent ? '✓ Sent to all users!' : 'Broadcast to All Users'}
        </button>
      </form>
    </div>
  );
}
