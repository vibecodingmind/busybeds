'use client';
import { useState } from 'react';

export default function AdminSMSPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendSMS = async () => {
    if (!phone || !message) return alert('Fill in all fields');
    setSending(true);
    try {
      await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });
      alert('SMS sent!');
      setPhone('');
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">SMS Management</h1>
        <p className="text-gray-500">Send SMS notifications to users</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Enter SMS message..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="text-xs text-gray-500 mt-2">{message.length} / 160 characters</div>
        </div>

        <button
          onClick={sendSMS}
          disabled={sending}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send SMS'}
        </button>
      </div>
    </div>
  );
}
