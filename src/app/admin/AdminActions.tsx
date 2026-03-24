'use client';
import Link from 'next/link';

export default function AdminActions() {
  return (
    <Link href="/admin/hotels/new" className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Add Hotel
    </Link>
  );
}
