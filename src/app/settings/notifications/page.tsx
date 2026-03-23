'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/notification-preferences')
      .then(r => r.json())
      .then(d => setPrefs(d.preferences));
  }, []);

  const handleChange = (key: string, value: any) => {
    setPrefs({ ...prefs, [key]: value });
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/notification-preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    alert('Preferences saved!');
  };

  if (!prefs) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Notification Preferences</h1>

        <div className="space-y-6 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Email Notifications</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={prefs.emailNewDeals} onChange={e => handleChange('emailNewDeals', e.target.checked)} className="w-5 h-5" />
              <div>
                <div className="font-medium">New Deals in Your Cities</div>
                <div className="text-sm text-gray-500">Get notified about hot new deals</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={prefs.emailWeeklyDigest} onChange={e => handleChange('emailWeeklyDigest', e.target.checked)} className="w-5 h-5" />
              <div>
                <div className="font-medium">Weekly Digest</div>
                <div className="text-sm text-gray-500">Summary of top deals every week</div>
              </div>
            </label>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Other Notifications</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={prefs.pushNotifications} onChange={e => handleChange('pushNotifications', e.target.checked)} className="w-5 h-5" />
              <div>
                <div className="font-medium">Browser Push Notifications</div>
                <div className="text-sm text-gray-500">Real-time alerts in your browser</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={prefs.smsAlerts} onChange={e => handleChange('smsAlerts', e.target.checked)} className="w-5 h-5" />
              <div>
                <div className="font-medium">SMS Alerts</div>
                <div className="text-sm text-gray-500">Get SMS for urgent deals</div>
              </div>
            </label>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Preferences</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select value={prefs.language} onChange={e => handleChange('language', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select value={prefs.timezone} onChange={e => handleChange('timezone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="UTC">UTC</option>
                <option value="EST">Eastern</option>
                <option value="CST">Central</option>
                <option value="PST">Pacific</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Newsletter</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Subscribe to get exclusive hotel discounts delivered to your inbox.</p>
            <NewsletterSignup variant="inline" />
          </div>

          <button onClick={save} disabled={saving} className="w-full py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </>
  );
}
