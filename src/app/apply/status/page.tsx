'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Application {
  id: string;
  kycStatus: string;
  kycSubmittedAt: string;
  kycReviewedAt?: string;
  kycRejectionReason?: string;
  hotel: { name: string; city: string; country: string; slug: string };
}

const statusConfig = {
  pending:  { icon: '⏳', label: 'Under Review',   cls: 'bg-yellow-100 text-yellow-700', desc: 'Your application has been received and is being reviewed by our team. This usually takes 1–2 business days.' },
  approved: { icon: '✅', label: 'Approved',        cls: 'bg-green-100 text-green-700',  desc: 'Congratulations! Your hotel is now live on Busy Beds. You can access your hotel portal and start managing your listing.' },
  rejected: { icon: '❌', label: 'Not Approved',    cls: 'bg-red-100 text-red-600',      desc: 'Unfortunately your application was not approved at this time.' },
};

export default function ApplicationStatusPage() {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/apply').then(r => r.json()).then(d => {
      if (!d.application) router.replace('/apply');
      else setApp(d.application);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!app) return null;

  const cfg = statusConfig[app.kycStatus as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: '#1A3C5E' }}>BB</div>
            <span className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Busy Beds</span>
          </Link>
        </div>

        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">{cfg.icon}</div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Application {cfg.label}</h1>
          <span className={`badge ${cfg.cls} text-sm mb-4 inline-block`}>{cfg.label}</span>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
            <p className="text-xs text-gray-400 mb-1">Hotel</p>
            <p className="font-semibold text-gray-800">{app.hotel.name}</p>
            <p className="text-sm text-gray-500">{app.hotel.city}, {app.hotel.country}</p>
          </div>

          <p className="text-gray-600 text-sm mb-4">{cfg.desc}</p>

          {app.kycStatus === 'rejected' && app.kycRejectionReason && (
            <div className="bg-red-50 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-red-500 font-semibold mb-1">Reason</p>
              <p className="text-sm text-red-700">{app.kycRejectionReason}</p>
            </div>
          )}

          <div className="text-xs text-gray-400 mb-6">
            Submitted: {new Date(app.kycSubmittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {app.kycReviewedAt && (
              <span className="ml-3">Reviewed: {new Date(app.kycReviewedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {app.kycStatus === 'approved' && (
              <Link href="/portal" className="btn-primary">Go to Hotel Portal →</Link>
            )}
            {app.kycStatus === 'rejected' && (
              <Link href="/apply" className="btn-primary">Resubmit Application</Link>
            )}
            <Link href="/" className="text-sm text-gray-500 hover:text-teal-600">← Back to Hotels</Link>
          </div>
        </div>

        {app.kycStatus === 'pending' && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Questions? Email us at{' '}
            <a href="mailto:support@busybeds.com" className="text-teal-600 hover:underline">support@busybeds.com</a>
          </div>
        )}
      </div>
    </div>
  );
}
