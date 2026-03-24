'use client';
import { useState } from 'react';

export default function ResendVerificationBtn() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleResend = async () => {
    setState('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
        ✓ Verification email sent — check your inbox
      </span>
    );
  }

  return (
    <button
      onClick={handleResend}
      disabled={state === 'sending'}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-400 text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-60 flex-shrink-0"
    >
      {state === 'sending' ? 'Sending…' : state === 'error' ? 'Retry resend' : 'Resend email'}
    </button>
  );
}
