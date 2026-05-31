'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import { getToken, getUser, removeToken } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller/listings', label: 'My Listings', icon: Package },
  { href: '/seller/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/seller/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/seller/payouts', label: 'Payouts', icon: Wallet },
  { href: '/seller/profile', label: 'Profile', icon: User },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  function handleLogout() {
    removeToken();
    router.push('/');
  }

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-base font-bold text-gray-900 block leading-tight">
              Nirmal<span className="text-primary-600">Mandi</span>
            </span>
            <span className="text-xs text-gray-500 font-medium">Seller Portal</span>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
            {(user.name ?? 'S').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {(user as AuthUser & { business_name?: string }).business_name ?? user.name}
            </p>
            <p className="text-xs text-gray-500">Seller Account</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/seller/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Add New Listing CTA */}
      <div className="p-3 border-t border-gray-100">
        <Link
          href="/seller/listings/new"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Listing
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full mt-1"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white flex flex-col border-r border-gray-200 shadow-xl">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">
              Nirmal<span className="text-primary-600">Mandi</span>
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
