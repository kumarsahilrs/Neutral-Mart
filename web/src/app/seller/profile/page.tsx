'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Building2,
  Phone,
  CreditCard,
  FileText,
  Loader2,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

interface SellerProfile {
  id: string;
  name: string;
  phone: string;
  business_name: string;
  business_type: string;
  gst_number: string;
  pan_number?: string;
  msme_number?: string;
  state: string;
  city: string;
  address_line1?: string;
  pincode?: string;
  bank_account_last4?: string;
  ifsc?: string;
  kyc_status: string;
  seller_tier: string;
  total_listings: number;
  total_orders: number;
  rating?: number;
  created_at: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-3xl">
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-40" />
            <div className="h-4 bg-gray-200 rounded w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SellerProfilePage() {
  const [localUser, setLocalUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    setLocalUser(getUser());
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller-profile'],
    queryFn: () => api.get<{ data: SellerProfile }>('/seller/profile'),
    select: (res) => (res.data as unknown as { data: SellerProfile })?.data ?? res.data,
    enabled: ready && isAuthenticated(),
    retry: 1,
  });

  useEffect(() => {
    if (error) toast.error('Failed to load profile');
  }, [error]);

  if (!ready || isLoading) return <ProfileSkeleton />;

  const profile = data as SellerProfile | undefined;
  const name = profile?.name ?? localUser?.name ?? '—';
  const businessName = profile?.business_name ?? '—';

  const KYC_CONFIG: Record<string, { label: string; color: string }> = {
    verified: { label: 'Verified', color: 'bg-green-100 text-green-700' },
    pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  };

  const kycStatus = KYC_CONFIG[profile?.kyc_status ?? 'pending'] ?? { label: profile?.kyc_status ?? '—', color: 'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your seller account details</p>
      </div>

      {/* Profile header card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{businessName}</h2>
            <p className="text-sm text-gray-500">{name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${kycStatus.color}`}>
                KYC: {kycStatus.label}
              </span>
              {profile?.seller_tier && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 capitalize">
                  {profile.seller_tier} Seller
                </span>
              )}
              {profile?.msme_number && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  MSME
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        {profile && (
          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{profile.total_listings ?? 0}</p>
              <p className="text-xs text-gray-500">Total Listings</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{profile.total_orders ?? 0}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                {profile.rating ? profile.rating.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
          </div>
        )}

        {/* Detail fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Phone className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Mobile</p>
              <p className="text-sm font-medium text-gray-800">{profile?.phone ?? localUser?.phone ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Building2 className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Business Type</p>
              <p className="text-sm font-medium text-gray-800 capitalize">{profile?.business_type ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">GST Number</p>
              <p className="text-sm font-medium text-gray-800 font-mono">{profile?.gst_number ?? '—'}</p>
            </div>
          </div>

          {profile?.pan_number && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">PAN</p>
                <p className="text-sm font-medium text-gray-800 font-mono">{profile.pan_number}</p>
              </div>
            </div>
          )}

          {(profile?.state || profile?.city) && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Location</p>
                <p className="text-sm font-medium text-gray-800">
                  {[profile.city, profile.state].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}

          {profile?.bank_account_last4 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Bank Account</p>
                <p className="text-sm font-medium text-gray-800">****{profile.bank_account_last4}</p>
                {profile.ifsc && <p className="text-xs text-gray-400 font-mono">{profile.ifsc}</p>}
              </div>
            </div>
          )}

          {profile?.created_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Member Since</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        To update your business details or bank account, please contact support.
      </p>
    </div>
  );
}
