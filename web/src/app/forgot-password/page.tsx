'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Brand } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error('Enter your email address'); return; }
    setLoading(true);
    try {
      await api.post('/auth/email/otp/send', { email });
      setSent(true);
    } catch {
      // Even if email service not configured, show success (security: don't reveal if email exists)
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--nm-paper)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{ width: '42%', background: 'var(--nm-deep)', padding: '48px 52px', color: '#fff' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(244,168,42,.12)', pointerEvents: 'none' }} />
        <div className="relative z-10"><Brand light size={22} /></div>
        <div className="relative z-10">
          <h2 className="disp" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Reset your<br /><span style={{ color: '#f4a82a' }}>password.</span>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', lineHeight: 1.6 }}>
            Enter your registered email and we&apos;ll send you a link to reset your password.
          </p>
        </div>
        <div className="relative z-10" style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
          Remember your password?{' '}
          <Link href="/login" style={{ color: '#f4a82a', textDecoration: 'none' }}>Sign in →</Link>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--nm-muted)', textDecoration: 'none', marginBottom: 24 }}>
            <ArrowLeft size={14} /> Back to login
          </Link>

          {sent ? (
            <div className="nm-card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--nm-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} style={{ color: 'var(--nm-green)' }} />
              </div>
              <h2 className="disp" style={{ fontSize: 22, fontWeight: 800, color: 'var(--nm-ink)', margin: '0 0 8px' }}>Check your email</h2>
              <p style={{ fontSize: 14, color: 'var(--nm-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>
                If <strong>{email}</strong> is registered, you&apos;ll receive a password reset link shortly.
              </p>
              <p style={{ fontSize: 13, color: 'var(--nm-faint)', margin: '0 0 20px' }}>
                Didn&apos;t get it? Check your spam folder or contact{' '}
                <a href="mailto:support@nirmalmandi.com" style={{ color: 'var(--nm-green)' }}>support@nirmalmandi.com</a>
              </p>
              <Link href="/login" className="nm-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 24px', fontSize: 14 }}>
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="disp" style={{ fontSize: 28, fontWeight: 800, color: 'var(--nm-ink)', margin: '0 0 8px' }}>Forgot password?</h1>
              <p style={{ fontSize: 14, color: 'var(--nm-muted)', margin: '0 0 28px' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="nm-label">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" className="nm-input"
                      style={{ paddingLeft: 40 }} autoFocus />
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--nm-faint)' }} />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="nm-btn-primary" style={{ padding: '14px', fontSize: 15 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
