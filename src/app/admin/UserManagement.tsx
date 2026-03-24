'use client';
import { useState } from 'react';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  suspendedAt: string | null;
  suspendedReason?: string;
}

export default function UserManagement({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [acting, setActing] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<{ [key: string]: string }>({});
  const [showReasonInput, setShowReasonInput] = useState<string | null>(null);

  const handleAction = async (userId: string, action: 'suspend' | 'unsuspend', reason?: string) => {
    setActing(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason || null }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, suspendedAt: data.user.suspendedAt, suspendedReason: data.user.suspendedReason } : u))
        );
        setShowReasonInput(null);
        setSuspendReason(prev => ({ ...prev, [userId]: '' }));
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="font-bold text-lg mb-4" style={{ color: '#1A3C5E' }}>Recent Users</h2>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700">
                {u.fullName[0]}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{u.fullName}</div>
                <div className="text-xs text-gray-400">{u.email}</div>
                {u.suspendedAt && u.suspendedReason && (
                  <div className="text-xs text-red-600 mt-1">Reason: {u.suspendedReason}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {u.suspendedAt ? (
                <div className="flex items-center gap-2">
                  <span className="badge bg-red-100 text-red-700 text-xs">Suspended</span>
                  <button
                    onClick={() => handleAction(u.id, 'unsuspend')}
                    disabled={acting === u.id}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {acting === u.id ? '...' : 'Unsuspend'}
                  </button>
                </div>
              ) : (
                <div>
                  {showReasonInput === u.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Reason..."
                        value={suspendReason[u.id] || ''}
                        onChange={e => setSuspendReason(prev => ({ ...prev, [u.id]: e.target.value }))}
                        className="text-xs px-2 py-1 border border-gray-300 rounded-lg"
                      />
                      <button
                        onClick={() => handleAction(u.id, 'suspend', suspendReason[u.id])}
                        disabled={acting === u.id}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {acting === u.id ? '...' : 'OK'}
                      </button>
                      <button
                        onClick={() => setShowReasonInput(null)}
                        className="text-xs text-gray-500 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowReasonInput(u.id)}
                      className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1 rounded-lg transition-colors"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              )}
              <span className={`badge text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'hotel_owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {u.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
