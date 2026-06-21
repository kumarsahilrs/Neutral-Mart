'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { useState } from 'react';
import Brand from './Brand';
import { isAuthenticated, getUser } from '@/lib/auth';

interface TopNavProps {
  searchPlaceholder?: string;
}

export default function TopNav({ searchPlaceholder = 'Search 12,400+ lots — phones, textiles, FMCG…' }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState('');
  const user = isAuthenticated() ? getUser() : null;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/listings?search=${encodeURIComponent(q.trim())}`);
  }

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className="flex items-center flex-shrink-0"
      style={{ height: 76, padding: '0 36px', gap: 26, background: 'var(--nm-deep)', color: '#fff' }}
    >
      <Brand light />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1" style={{ maxWidth: 440 }}>
        <div
          className="flex items-center gap-2.5"
          style={{ background: 'rgba(255,255,255,.1)', borderRadius: 999, padding: '11px 18px' }}
        >
          <Search size={17} style={{ color: 'rgba(255,255,255,.65)', flexShrink: 0 }} strokeWidth={1.8} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="bg-transparent outline-none w-full"
            style={{ fontSize: 14, color: q ? '#fff' : 'rgba(255,255,255,.6)' }}
          />
        </div>
      </form>

      {/* Nav links */}
      <Link
        href="/listings"
        className="no-underline font-display"
        style={{ fontSize: 14.5, fontWeight: 600, color: isActive('/listings') ? '#f4a82a' : 'rgba(255,255,255,.82)', cursor: 'pointer' }}
      >
        Browse Deals
      </Link>
      <Link
        href="/seller-register"
        className="no-underline font-display"
        style={{ fontSize: 14.5, fontWeight: 600, color: 'rgba(255,255,255,.82)' }}
      >
        How it works
      </Link>

      {/* Sell Now CTA */}
      <Link
        href="/seller-register"
        className="nm-btn-gold no-underline"
        style={{ padding: '8px 14px', fontSize: 13 }}
      >
        Sell Now
      </Link>

      {/* Avatar / bell */}
      {user ? (
        <div className="flex items-center gap-2">
          <Link href="/notifications" style={{ color: 'rgba(255,255,255,.7)' }}>
            <Bell size={20} strokeWidth={1.8} />
          </Link>
          <Link href="/dashboard" className="no-underline">
            <span
              className="disp flex items-center justify-center"
              style={{ width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,.16)', color: '#fff', fontWeight: 800, fontSize: 14 }}
            >
              {user.phone?.slice(-2)}
            </span>
          </Link>
        </div>
      ) : (
        <Link href="/login" className="nm-btn-secondary no-underline" style={{ padding: '8px 14px', fontSize: 13 }}>
          Sign in
        </Link>
      )}
    </header>
  );
}
