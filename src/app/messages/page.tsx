'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [folder, setFolder] = useState('inbox');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/messages?folder=${folder}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .finally(() => setLoading(false));
  }, [folder]);

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setFolder('inbox')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              folder === 'inbox'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
            }`}
          >
            Inbox ({messages.filter((m: any) => !m.isRead).length})
          </button>
          <button
            onClick={() => setFolder('sent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              folder === 'sent'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
            }`}
          >
            Sent
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-gray-600 dark:text-gray-400">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg: any) => (
              <div key={msg.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{msg.subject}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{msg.body.slice(0, 80)}...</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-2">
                      <span>{msg.sender?.fullName || msg.recipient?.fullName}</span>
                      <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {!msg.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
