'use client';
import { useState } from 'react';

export default function SecuritySettings() {
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadData = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/user/export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'busybeds-my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export data. Please try again.');
    }
    setDownloading(false);
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE MY ACCOUNT') return;
    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirm }),
      });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch {}
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Download Your Data</h3>
        <p className="text-sm text-gray-500 mb-4">Export all data we hold about you in JSON format (GDPR right to data portability).</p>
        <button
          onClick={downloadData}
          disabled={downloading}
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {downloading ? 'Preparing...' : 'Download My Data'}
        </button>
      </div>

      {/* Account Deletion */}
      <div className="bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900 rounded-2xl p-6">
        <h3 className="font-semibold text-red-600 mb-1">Delete Account</h3>
        <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors">
            Delete My Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">DELETE MY ACCOUNT</code> to confirm:</p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3">
              <button onClick={deleteAccount} disabled={deleteConfirm !== 'DELETE MY ACCOUNT' || deleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
