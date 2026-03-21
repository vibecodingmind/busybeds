'use client';
import { useState } from 'react';

interface Props {
  variant?: 'inline' | 'banner';
}

export default function NewsletterSignup({ variant = 'inline' }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg(data.message || 'You\'re in! Watch your inbox for exclusive deals.');
        setEmail('');
      } else {
        setStatus('error');
        setMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMsg('Connection error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className={`${variant === 'banner' ? 'py-16 px-6 text-center' : ''}`}>
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">You&apos;re subscribed!</p>
            <p className="text-sm text-gray-500">{msg}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <section className="bg-gradient-to-r from-[#FF385C] to-[#BD1E59] py-16 px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Never miss a deal</h2>
        <p className="text-white/80 mb-8 max-w-md mx-auto">Get exclusive hotel discounts delivered to your inbox. Unsubscribe anytime.</p>
        <form onSubmit={submit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-3 bg-white text-[#FF385C] font-semibold rounded-full hover:bg-gray-50 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {status === 'loading' ? 'Subscribing…' : 'Get Deals'}
          </button>
        </form>
        {status === 'error' && <p className="text-white/70 text-sm mt-3">{msg}</p>}
      </section>
    );
  }

  // Inline variant (footer/sidebar)
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-4 py-2 bg-[#FF385C] hover:bg-[#e0334f] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
      >
        {status === 'loading' ? '…' : 'Subscribe'}
      </button>
    </form>
  );
}
