'use client';

import { useEffect, useState } from 'react';

interface Package {
  id: string;
  name: string;
  durationDays: number;
  priceMonthly: number;
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

export default function CompSubscription() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [packageId, setPackageId] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/subscriptions/packages');
        const data = await res.json();
        setPackages(data.packages || []);
      } catch (err) {
        setError('Failed to load packages');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !packageId || !reason) {
      setError('Please fill in required fields');
      return;
    }

    try {
      setSubmitting(true);

      // Search for user
      const userRes = await fetch(`/api/admin/users?search=${encodeURIComponent(email)}`);
      const userData = await userRes.json();

      if (!userData.users || userData.users.length === 0) {
        setError('User not found');
        return;
      }

      const user = userData.users[0];
      setFoundUser(user);
      setStep('confirm');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!foundUser) return;

    try {
      setSubmitting(true);

      const res = await fetch('/api/admin/comp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: foundUser.id,
          packageId,
          reason,
          days: durationDays ? parseInt(durationDays) : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to grant subscription');
        setStep('form');
        return;
      }

      setStep('success');
      // Reset form after 2 seconds
      setTimeout(() => {
        setEmail('');
        setPackageId('');
        setDurationDays('');
        setReason('');
        setFoundUser(null);
        setStep('form');
      }, 2000);
    } catch (err) {
      setError('An error occurred');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPackage = packages.find((p) => p.id === packageId);
  const defaultDays = selectedPackage?.durationDays || 0;

  if (step === 'success') {
    return (
      <div className="card p-6 mb-6">
        <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#d4f4e1' }}>
          <p className="text-green-700 text-lg font-semibold">
            Subscription granted to {foundUser?.fullName}
          </p>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-lg mb-6" style={{ color: '#1A3C5E' }}>
          Confirm Comp Subscription
        </h2>

        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm font-medium text-gray-800 mb-2">Found User:</p>
            <p className="text-gray-600">{foundUser?.fullName}</p>
            <p className="text-gray-500 text-sm">{foundUser?.email}</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-800 mb-1">Package:</p>
            <p className="text-gray-600">{selectedPackage?.name}</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-800 mb-1">Duration:</p>
            <p className="text-gray-600">
              {durationDays ? `${durationDays} days` : `${defaultDays} days (package default)`}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-800 mb-1">Reason:</p>
            <p className="text-gray-600">{reason}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep('form')}
            disabled={submitting}
            className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 btn-primary"
          >
            {submitting ? 'Granting...' : 'Confirm & Grant'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6">
      <h2 className="font-bold text-lg mb-6" style={{ color: '#1A3C5E' }}>
        Comp a Subscription
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={submitting}
          />
        </div>

        <div>
          <label className="label block text-sm font-medium text-gray-700 mb-2">
            Package
          </label>
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="input w-full"
            disabled={submitting || packages.length === 0}
          >
            <option value="">Select a package...</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} ({pkg.durationDays} days)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label block text-sm font-medium text-gray-700 mb-2">
            Duration (days) - Optional
          </label>
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder={`Default (use package duration: ${defaultDays} days)`}
            className="input w-full"
            disabled={submitting}
            min="1"
          />
        </div>

        <div>
          <label className="label block text-sm font-medium text-gray-700 mb-2">
            Reason
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Promotional offer, Customer service recovery"
            className="input w-full"
            disabled={submitting}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || loading}
          className="btn-primary w-full"
        >
          {submitting ? 'Searching...' : 'Give Free Subscription'}
        </button>
      </form>
    </div>
  );
}
