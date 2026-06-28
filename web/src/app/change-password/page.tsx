'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { isAuthenticated, getUser } from '@/lib/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const user = getUser();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!isAuthenticated()) router.replace('/login'); }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (form.next !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.patch('/profile/password', { current_password: form.current, new_password: form.next });
      toast.success('Password changed successfully');
      // Route back based on role
      const dest = user?.role === 'seller' ? '/seller/profile' : '/profile';
      router.push(dest);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? 'Failed to change password');
    } finally { setLoading(false); }
  }

  const back = user?.role === 'seller' ? '/seller/settings' : '/profile';

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nm-paper)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href={back} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--nm-muted)', textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="nm-card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--nm-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={20} style={{ color: 'var(--nm-green)' }} />
            </div>
            <div>
              <h1 className="disp" style={{ fontSize: 20, fontWeight: 800, color: 'var(--nm-ink)', margin: 0 }}>Change password</h1>
              <p style={{ fontSize: 13, color: 'var(--nm-muted)', margin: 0 }}>Set a new secure password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'current', label: 'Current password', placeholder: 'Your current password' },
              { key: 'next',    label: 'New password',     placeholder: 'Min 8 characters' },
              { key: 'confirm', label: 'Confirm new password', placeholder: 'Repeat new password' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="nm-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={show[key as keyof typeof show] ? 'text' : 'password'}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="nm-input"
                    style={{ width: '100%', paddingRight: 42 }}
                    required
                  />
                  <button type="button"
                    onClick={() => setShow(s => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nm-faint)' }}>
                    {show[key as keyof typeof show] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading} className="nm-btn-primary" style={{ padding: '13px', fontSize: 15, marginTop: 4 }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Changing password…</> : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
