'use client';

/**
 * One-time phone number verification widget.
 * Shown to users who signed up via email/Google and haven't linked a phone yet.
 * Phone is needed for: SMS notifications, seller SMS OTP, Tier upgrade.
 */
import { useState } from 'react';
import { Phone, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Props {
  currentPhone?: string | null;
  onVerified?: (phone: string) => void;
}

function OtpRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} type="text" inputMode="numeric" maxLength={1}
          value={value[i] ?? ''}
          onChange={e => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1);
            const arr = value.padEnd(6, ' ').split(''); arr[i] = ch;
            onChange(arr.join('').trimEnd());
            if (ch && i < 5) (document.getElementById(`pv-otp-${i + 1}`) as HTMLInputElement)?.focus();
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace') {
              const arr = value.padEnd(6, ' ').split(''); arr[i] = '';
              onChange(arr.join('').trimEnd());
              if (i > 0) (document.getElementById(`pv-otp-${i - 1}`) as HTMLInputElement)?.focus();
            }
          }}
          id={`pv-otp-${i}`}
          className="text-center disp"
          style={{
            width: 44, height: 48, fontSize: 20, fontWeight: 700, borderRadius: 10,
            border: `1.5px solid ${value[i] ? 'var(--nm-green)' : 'var(--nm-line)'}`,
            background: value[i] ? 'var(--nm-green-soft)' : 'var(--nm-card)',
            color: 'var(--nm-ink)', outline: 'none',
          }} />
      ))}
    </div>
  );
}

export default function PhoneVerificationWidget({ currentPhone, onVerified }: Props) {
  const [phase, setPhase] = useState<'idle' | 'entering' | 'otp' | 'done'>('idle');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Already verified
  if (currentPhone && currentPhone.length === 10) {
    return (
      <div className="flex items-center gap-3 nm-card" style={{ padding: '14px 18px' }}>
        <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--nm-green-soft)', color: 'var(--nm-green)' }}>
          <CheckCircle size={18} />
        </span>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nm-ink)', margin: 0 }}>Phone verified</p>
          <p style={{ fontSize: 12.5, color: 'var(--nm-muted)', margin: 0 }}>+91 {currentPhone} · SMS notifications active</p>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex items-center gap-3 nm-card" style={{ padding: '14px 18px', background: 'var(--nm-green-soft)', borderColor: 'var(--nm-green)' }}>
        <CheckCircle size={20} style={{ color: 'var(--nm-green)' }} />
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nm-green)', margin: 0 }}>Phone verified! SMS notifications are now active.</p>
      </div>
    );
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) { toast.error('Enter a valid 10-digit number'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-phone/send', { phone });
      setPhase('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to send OTP');
    } finally { setLoading(false); }
  }

  async function confirmOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.replace(/\s/g, '').length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-phone/confirm', { phone, otp: otp.replace(/\s/g, '') });
      toast.success('Phone verified!');
      setPhase('done');
      onVerified?.(phone);
    } catch { toast.error('Invalid OTP. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="nm-card" style={{ padding: 20 }}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--nm-gold-soft)', color: 'var(--nm-gold-ink)' }}>
          <Phone size={16} />
        </span>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>Verify your phone number</p>
          <p style={{ fontSize: 12, color: 'var(--nm-muted)', margin: 0 }}>One-time setup · enables SMS alerts + account upgrade</p>
        </div>
      </div>

      {phase === 'idle' && (
        <button onClick={() => setPhase('entering')} className="nm-btn-gold w-full" style={{ fontSize: 13.5, padding: '10px' }}>
          Add & verify phone number
        </button>
      )}

      {phase === 'entering' && (
        <form onSubmit={sendOtp} className="flex flex-col gap-3">
          <div className="flex" style={{ gap: 0 }}>
            <span className="flex items-center px-3 flex-shrink-0"
              style={{ background: 'var(--nm-panel)', border: '1px solid var(--nm-line)', borderRight: 'none', borderRadius: '12px 0 0 12px', fontSize: 13.5, color: 'var(--nm-muted)', fontWeight: 600 }}>
              🇮🇳 +91
            </span>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Mobile number" className="nm-input"
              style={{ borderRadius: '0 12px 12px 0', borderLeft: 'none' }} autoFocus />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPhase('idle')} className="nm-btn-secondary flex-1" style={{ fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={loading || phone.length < 10} className="nm-btn-primary flex-1" style={{ fontSize: 13 }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} Send OTP
            </button>
          </div>
        </form>
      )}

      {phase === 'otp' && (
        <form onSubmit={confirmOtp} className="flex flex-col gap-3">
          <p style={{ fontSize: 13, color: 'var(--nm-muted)', margin: 0 }}>OTP sent to +91 {phone}</p>
          <OtpRow value={otp} onChange={setOtp} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setPhase('entering')} className="nm-btn-secondary flex-1" style={{ fontSize: 13 }}>Back</button>
            <button type="submit" disabled={loading || otp.replace(/\s/g, '').length < 6} className="nm-btn-primary flex-1" style={{ fontSize: 13 }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} Verify
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
