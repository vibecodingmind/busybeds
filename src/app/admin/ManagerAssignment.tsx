'use client';

import { useEffect, useState } from 'react';

interface Manager {
  id: string;
  user: { id: string; fullName: string; email: string };
  hotel: { id: string; name: string; city: string };
  assignedAt: string;
}

interface Hotel {
  id: string;
  name: string;
  city: string;
}

export default function ManagerAssignment() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [managersRes, hotelsRes] = await Promise.all([
          fetch('/api/admin/managers'),
          fetch('/api/hotels'),
        ]);

        const managersData = await managersRes.json();
        const hotelsData = await hotelsRes.json();

        setManagers(managersData.managers || []);
        setHotels(hotelsData.hotels || []);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !hotelId) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setAssigning(true);

      // First, search for the user by email
      const userRes = await fetch(`/api/admin/users?search=${encodeURIComponent(email)}`);
      const userData = await userRes.json();

      if (!userData.users || userData.users.length === 0) {
        setError('User not found');
        return;
      }

      const user = userData.users[0];

      // Assign as manager
      const assignRes = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, hotelId }),
      });

      if (!assignRes.ok) {
        const errData = await assignRes.json();
        setError(errData.error || 'Failed to assign manager');
        return;
      }

      const managerData = await assignRes.json();

      // Refresh managers list
      const refreshRes = await fetch('/api/admin/managers');
      const refreshData = await refreshRes.json();
      setManagers(refreshData.managers || []);

      setSuccess(`${user.fullName} assigned as manager for ${managerData.manager.hotel.name}`);
      setEmail('');
      setHotelId('');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (managerId: string) => {
    if (!confirm('Remove this manager assignment?')) return;

    try {
      setRemoving(managerId);
      const res = await fetch(`/api/admin/managers?managerId=${managerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setError('Failed to remove manager');
        return;
      }

      // Refresh list
      const refreshRes = await fetch('/api/admin/managers');
      const refreshData = await refreshRes.json();
      setManagers(refreshData.managers || []);
      setSuccess('Manager assignment removed');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="font-bold text-lg mb-6" style={{ color: '#1A3C5E' }}>
        Hotel Manager Assignments
      </h2>

      {/* Assign Manager Form */}
      <div className="mb-8 p-5 rounded-xl" style={{ backgroundColor: '#f5f9fc' }}>
        <h3 className="font-semibold text-gray-800 mb-4">Assign Manager</h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="label block text-sm font-medium text-gray-700 mb-2">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="input w-full"
              disabled={assigning}
            />
          </div>

          <div>
            <label className="label block text-sm font-medium text-gray-700 mb-2">
              Hotel
            </label>
            <select
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="input w-full"
              disabled={assigning || hotels.length === 0}
            >
              <option value="">Select a hotel...</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name} ({hotel.city})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={assigning}
            className="btn-primary w-full"
          >
            {assigning ? 'Assigning...' : 'Assign as Manager'}
          </button>
        </form>
      </div>

      {/* Managers Table */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">Current Managers</h3>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : managers.length === 0 ? (
          <p className="text-gray-400 text-sm">No managers assigned yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottomColor: '#0E7C7B' }} className="border-b-2">
                  <th className="text-left p-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Hotel</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-gray-800">{manager.user.fullName}</td>
                    <td className="p-3 text-gray-600">{manager.user.email}</td>
                    <td className="p-3 text-gray-600">
                      {manager.hotel.name} ({manager.hotel.city})
                    </td>
                    <td className="text-right p-3">
                      <button
                        onClick={() => handleRemove(manager.id)}
                        disabled={removing === manager.id}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                      >
                        {removing === manager.id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
