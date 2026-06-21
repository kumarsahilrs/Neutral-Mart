'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getToken, getUser } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

/**
 * Seller layout is intentionally a thin auth guard.
 * Each seller page renders its own <AppShell> (with the seller NavItems,
 * brandSub and sidebar footer), matching the buyer portal pattern — so the
 * shell chrome lives in the pages, not here. This avoids a double sidebar.
 */
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    const u = getUser();
    if (!token || !u || u.role !== 'seller') {
      router.replace('/login');
      return;
    }
    setUser(u);
  }, [router]);

  if (!mounted || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--nm-paper)' }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--nm-green)' }} />
      </div>
    );
  }

  return <>{children}</>;
}
