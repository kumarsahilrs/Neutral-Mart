'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar, { type NavItem } from './Sidebar';
import Topbar from './Topbar';

interface AppShellProps {
  navItems: NavItem[];
  brandSub?: string;
  sidebarFooter?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  noPad?: boolean;
}

export default function AppShell({
  navItems, brandSub, sidebarFooter,
  title, subtitle, actions,
  children, noPad,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--nm-paper)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar items={navItems} sub={brandSub} footer={sidebarFooter} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar items={navItems} sub={brandSub} footer={sidebarFooter} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-4"
            style={{ color: 'var(--nm-muted)' }}
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex-1">
            <Topbar title={title} subtitle={subtitle} actions={actions} />
          </div>
        </div>

        <main style={{ flex: 1, padding: noPad ? 0 : '24px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
