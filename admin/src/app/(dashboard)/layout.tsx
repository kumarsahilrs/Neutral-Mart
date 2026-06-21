'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('nm_admin_token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  // Each page renders its own <AdminShell> (sidebar + topbar).
  return <>{children}</>;
}
