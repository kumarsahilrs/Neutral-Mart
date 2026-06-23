'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('nm_admin_token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  // Avoid rendering (and flashing) dashboard content before the token check runs.
  if (!authed) return null;

  // Each page renders its own <AdminShell> (sidebar + topbar).
  return <>{children}</>;
}
