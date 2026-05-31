'use client';

import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
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

  return (
    <div className="flex h-screen overflow-hidden bg-nm-bg dark:bg-nm-bg-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-end items-center px-4 py-2 border-b border-nm-border dark:border-nm-border-dark bg-nm-surface dark:bg-nm-surface-dark">
          <ThemeToggle />
        </div>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
