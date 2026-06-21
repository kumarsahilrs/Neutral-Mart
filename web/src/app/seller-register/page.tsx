'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Phone, KeyRound, Loader2, AlertCircle, CheckCircle, Upload,
  RefreshCw, X, ArrowLeft, CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/ui';
import api, { authApi } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';

// ── Types ──────────────────────────────────────────────────────────────────────
interface UploadedDoc {
  file: File | null;
  status: 'idle' | 'uploading' | 'done' | 'error';
  fileUrl: string;
  progress: number;
}
const INITIAL_DOC: UploadedDoc = { file: null, status: 'idle', fileUrl: '', progress: 0 };

const STEPS = ['Phone & OTP', 'Business Details', 'Address', 'Bank Account', 'Documents'];

const BUSINESS_TYPES = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'wholesaler', label: 'Wholesaler' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const OTP_RESEND_SECONDS = 60;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--nm-red)', marginTop: 5 }}>
      <AlertCircle size={12} style={{ flexShrink: 0 }} /> {msg}
    </p>
  );
}

export default function SellerRegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  // Step 1 — Phone & OTP
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 2 — Business Details
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [msmeNumber, setMsmeNumber] = useState('');

  // Step 3 — Business Address
  const [bizLine1, setBizLine1] = useState('');
  const [bizLine2, setBizLine2] = useState('');
  const [bizCity, setBizCity] = useState('');
  const [bizState, setBizState] = useState('');
  const [bizPincode, setBizPincode] = useState('');
  const [warehouseSame, setWarehouseSame] = useState(true);
  const [whLine1, setWhLine1] = useState('');
  const [whLine2, setWhLine2] = useState('');
  const [whCity, setWhCity] = useState('');
  const [whState, setWhState] = useState('');
  const [whPincode, setWhPincode] = useState('');

  // Step 4 — Bank
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [bankVerifying, setBankVerifying] = useState(false);

  // Step 5 — Documents
  const [gstCert, setGstCert] = useState<UploadedDoc>({ ...INITIAL_DOC });
  const [panCard, setPanCard] = useState<UploadedDoc>({ ...INITIAL_DOC });
  const [addressProof, setAddressProof] = useState<UploadedDoc>({ ...INITIAL_DOC });
  const [agreed, setAgreed] = useState(false);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function startResendTimer() {
    setResendTimer(OTP_RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function clearError(key: string) {
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  // ── OTP handlers ──
  async function handleSendOtp() {
    if (!/^[6-9]\d{9}$/.test(phone)) { setErrors({ phone: 'Enter a valid 10-digit Indian mobile number' }); return; }
    clearError('phone');
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      toast.success('OTP sent to +91 ' + phone);
      setOtpSent(true);
      startResendTimer();
    } catch {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) { setErrors({ otp: 'Enter the 6-digit OTP' }); return; }
    clearError('otp');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      const { registered, access_token, refresh_token, user } = res.data.data;
      if (registered && access_token && user && user.role === 'seller') {
        setToken(access_token, refresh_token);
        setUser(user);
        toast.success('Welcome back!');
        window.location.href = '/seller/dashboard';
        return;
      }
      setStep(1);
    } catch {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Validations ──
  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (!businessName.trim()) errs.businessName = 'Business name is required';
    if (!businessType) errs.businessType = 'Please select a business type';
    if (!gstNumber.trim()) errs.gstNumber = 'GST number is required';
    else if (!GST_REGEX.test(gstNumber.trim().toUpperCase())) errs.gstNumber = 'Invalid GST format (e.g. 27AAPFU0939F1ZV)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3(): boolean {
    const errs: Record<string, string> = {};
    if (!bizLine1.trim()) errs.bizLine1 = 'Address is required';
    if (!bizCity.trim()) errs.bizCity = 'City is required';
    if (!bizState) errs.bizState = 'Please select a state';
    if (!/^\d{6}$/.test(bizPincode)) errs.bizPincode = 'Enter a valid 6-digit pincode';
    if (!warehouseSame) {
      if (!whLine1.trim()) errs.whLine1 = 'Warehouse address is required';
      if (!whCity.trim()) errs.whCity = 'City is required';
      if (!whState) errs.whState = 'Please select a state';
      if (!/^\d{6}$/.test(whPincode)) errs.whPincode = 'Enter a valid 6-digit pincode';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep4(): boolean {
    const errs: Record<string, string> = {};
    if (!accountHolder.trim()) errs.accountHolder = 'Account holder name is required';
    if (!accountNumber.trim()) errs.accountNumber = 'Account number is required';
    if (!ifsc.trim()) errs.ifsc = 'IFSC code is required';
    else if (!IFSC_REGEX.test(ifsc.trim().toUpperCase())) errs.ifsc = 'Invalid IFSC format (e.g. SBIN0001234)';
    if (!bankVerified) errs.bankVerify = 'Please verify your bank account before proceeding';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleVerifyBank() {
    if (!accountNumber.trim()) { setErrors({ accountNumber: 'Account number is required' }); return; }
    if (!IFSC_REGEX.test(ifsc.trim().toUpperCase())) { setErrors({ ifsc: 'Invalid IFSC format' }); return; }
    setBankVerifying(true);
    try {
      await api.post('/auth/verify-bank', { account_number: accountNumber.trim(), ifsc: ifsc.trim().toUpperCase() });
      setBankVerified(true);
      clearError('bankVerify');
      toast.success('Account Verified!');
    } catch {
      toast.error('Bank verification failed. Please check the details.');
    } finally {
      setBankVerifying(false);
    }
  }

  async function uploadDocument(file: File, type: string, setter: React.Dispatch<React.SetStateAction<UploadedDoc>>) {
    setter((prev) => ({ ...prev, file, status: 'uploading', progress: 0 }));
    try {
      const res = await api.get<{ data: { uploadUrl: string; fileUrl: string } }>('/auth/kyc-upload-url', { params: { type } });
      const { uploadUrl, fileUrl } = (res.data as unknown as { data: { uploadUrl: string; fileUrl: string } })?.data ?? res.data;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setter((prev) => ({ ...prev, progress: Math.round((e.loaded / e.total) * 100) }));
        };
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error(`Upload failed: ${xhr.status}`)); };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });
      setter((prev) => ({ ...prev, status: 'done', fileUrl, progress: 100 }));
    } catch {
      setter((prev) => ({ ...prev, status: 'error', progress: 0 }));
      toast.error(`Failed to upload ${type}`);
    }
  }

  function handleDocFile(e: React.ChangeEvent<HTMLInputElement>, type: string, setter: React.Dispatch<React.SetStateAction<UploadedDoc>>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { toast.error('Only JPG, PNG, or PDF files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    uploadDocument(file, type, setter);
    e.target.value = '';
  }

  function validateStep5(): boolean {
    const errs: Record<string, string> = {};
    if (gstCert.status !== 'done') errs.gstCert = 'Please upload GST Certificate';
    if (panCard.status !== 'done') errs.panCard = 'Please upload PAN Card';
    if (addressProof.status !== 'done') errs.addressProof = 'Please upload Address Proof';
    if (!agreed) errs.agreed = 'Please accept the Seller Agreement to continue';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleComplete() {
    if (!validateStep5()) return;
    setLoading(true);
    try {
      const res = await api.post<{ data: { access_token: string; refresh_token?: string; user: import('@/lib/auth').AuthUser } }>(
        '/auth/register/seller',
        {
          phone,
          business_name: businessName.trim(),
          business_type: businessType,
          gst_number: gstNumber.trim().toUpperCase(),
          pan_number: panNumber.trim().toUpperCase() || undefined,
          msme_number: msmeNumber.trim() || undefined,
          address_line1: bizLine1.trim(),
          address_line2: bizLine2.trim() || undefined,
          city: bizCity.trim(),
          state: bizState,
          pincode: bizPincode,
          warehouse_same_as_business: warehouseSame,
          warehouse_address_line1: !warehouseSame ? whLine1.trim() : undefined,
          warehouse_address_line2: !warehouseSame ? whLine2.trim() : undefined,
          warehouse_city: !warehouseSame ? whCity.trim() : undefined,
          warehouse_state: !warehouseSame ? whState : undefined,
          warehouse_pincode: !warehouseSame ? whPincode : undefined,
          account_holder_name: accountHolder.trim(),
          bank_account_number: accountNumber.trim(),
          ifsc: ifsc.trim().toUpperCase(),
          gst_certificate_url: gstCert.fileUrl,
          pan_card_url: panCard.fileUrl,
          address_proof_url: addressProof.fileUrl,
          otp_verified_phone: phone,
          language_preference: 'en',
          name: accountHolder.trim(),
        }
      );
      const payload = (res.data as unknown as { data: { access_token: string; refresh_token?: string; user: import('@/lib/auth').AuthUser } })?.data ?? res.data;
      if (payload.access_token && payload.user) { setToken(payload.access_token, payload.refresh_token); setUser(payload.user); }
      setCompleted(true);
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (step === 1 && !validateStep2()) return;
    if (step === 2 && !validateStep3()) return;
    if (step === 3 && !validateStep4()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    setErrors({});
  }

  // ── Doc upload widget ──
  function renderDocUpload(label: string, doc: UploadedDoc, type: string, setter: React.Dispatch<React.SetStateAction<UploadedDoc>>, inputId: string, errorKey: string) {
    return (
      <div>
        <label className="nm-label">{label}</label>
        <div className="relative flex items-center gap-3" style={{
          padding: 13, borderRadius: 12,
          border: doc.status === 'done' ? '1.5px solid var(--nm-green)' : doc.status === 'error' ? '1px solid var(--nm-red-soft)' : '1.5px dashed var(--nm-line)',
          background: doc.status === 'done' ? 'var(--nm-green-soft)' : doc.status === 'error' ? 'var(--nm-red-soft)' : 'var(--nm-panel)',
        }}>
          {doc.status === 'idle' && (
            <>
              <Upload size={20} style={{ color: 'var(--nm-faint)', flexShrink: 0 }} />
              <div>
                <p className="disp" style={{ fontSize: 13, fontWeight: 600, color: 'var(--nm-ink)', margin: 0 }}>Click to upload</p>
                <p style={{ fontSize: 11.5, color: 'var(--nm-faint)', margin: 0 }}>JPG, PNG, PDF — max 5MB</p>
              </div>
              <label htmlFor={inputId} className="absolute inset-0 cursor-pointer">
                <input id={inputId} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(e) => handleDocFile(e, type, setter)} />
              </label>
            </>
          )}
          {doc.status === 'uploading' && (
            <>
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--nm-green)', flexShrink: 0 }} />
              <div className="flex-1">
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--nm-ink)', margin: 0 }}>{doc.file?.name}</p>
                <div style={{ width: '100%', height: 6, background: 'var(--nm-line)', borderRadius: 999, marginTop: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--nm-green)', borderRadius: 999, width: `${doc.progress}%`, transition: 'width .2s' }} />
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--nm-muted)' }}>{doc.progress}%</span>
            </>
          )}
          {doc.status === 'done' && (
            <>
              <CheckCircle size={20} style={{ color: 'var(--nm-green)', flexShrink: 0 }} />
              <p className="flex-1 truncate" style={{ fontSize: 13, fontWeight: 600, color: 'var(--nm-green)' }}>{doc.file?.name ?? 'Uploaded'}</p>
              <button type="button" onClick={() => setter({ ...INITIAL_DOC })} style={{ color: 'var(--nm-faint)', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </>
          )}
          {doc.status === 'error' && (
            <>
              <AlertCircle size={20} style={{ color: 'var(--nm-red)', flexShrink: 0 }} />
              <p className="flex-1" style={{ fontSize: 13, color: 'var(--nm-red)' }}>Upload failed</p>
              <button type="button" onClick={() => { if (doc.file) uploadDocument(doc.file, type, setter); }} className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: 'var(--nm-red)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <RefreshCw size={12} /> Retry
              </button>
            </>
          )}
        </div>
        {errors[errorKey] && <FieldError msg={errors[errorKey]} />}
      </div>
    );
  }

  // ── Completed screen ──
  if (completed) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--nm-paper)', padding: 16 }}>
        <div className="text-center" style={{ maxWidth: 420, width: '100%' }}>
          <div className="flex items-center justify-center mx-auto" style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--nm-green-soft)', marginBottom: 20 }}>
            <CheckCircle size={36} style={{ color: 'var(--nm-green)' }} />
          </div>
          <h1 className="disp" style={{ fontSize: 24, fontWeight: 800, color: 'var(--nm-ink)', marginBottom: 8 }}>Registration submitted!</h1>
          <p style={{ fontSize: 14, color: 'var(--nm-muted)', lineHeight: 1.55, marginBottom: 24 }}>
            We&apos;ll verify your account within 24 hours. You&apos;ll receive a WhatsApp notification once your account is approved.
          </p>
          <div className="nm-card text-left flex flex-col" style={{ padding: 18, gap: 12, marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--nm-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>What happens next</p>
            {[
              'Our team reviews your documents (within 24h)',
              'You receive a WhatsApp notification on +91 ' + phone,
              'Start listing your inventory and grow your business',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="disp flex items-center justify-center flex-shrink-0" style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--nm-green-soft)', color: 'var(--nm-green)', fontSize: 12, fontWeight: 700, marginTop: 1 }}>{i + 1}</div>
                <p style={{ fontSize: 13.5, color: 'var(--nm-ink)', margin: 0 }}>{s}</p>
              </div>
            ))}
          </div>
          <Link href="/" className="nm-btn-primary no-underline">Back to home</Link>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--nm-paper)' }}>
      {/* Slim header */}
      <header className="flex items-center justify-between" style={{ padding: '18px 32px', borderBottom: '1px solid var(--nm-line)' }}>
        <Brand />
        <Link href="/login" className="no-underline" style={{ fontSize: 14, fontWeight: 600, color: 'var(--nm-green)' }}>Sign in →</Link>
      </header>

      <main style={{ maxWidth: 672, margin: '0 auto', padding: '40px 24px 64px' }}>
        <h1 className="disp text-center" style={{ fontSize: 30, fontWeight: 800, color: 'var(--nm-ink)', margin: 0 }}>List your inventory in 4 steps</h1>
        <p className="text-center" style={{ fontSize: 14.5, color: 'var(--nm-muted)', margin: '8px 0 32px' }}>Join thousands of businesses turning dead stock into cash on NirmalMandi.</p>

        {/* Step indicator */}
        <div className="flex items-center justify-between" style={{ marginBottom: 28 }}>
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
                  <div className="flex items-center justify-center" style={{
                    width: 34, height: 34, borderRadius: 999,
                    background: done ? 'var(--nm-green)' : active ? 'var(--nm-deep)' : 'var(--nm-card)',
                    border: done || active ? 'none' : '1.5px solid var(--nm-line)',
                  }}>
                    {done ? <CheckCircle size={18} color="#fff" /> : <span className="num" style={{ fontSize: 14, fontWeight: 700, color: active ? '#fff' : 'var(--nm-faint)' }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6, color: active ? 'var(--nm-ink)' : done ? 'var(--nm-green)' : 'var(--nm-faint)', textAlign: 'center', maxWidth: 70, lineHeight: 1.2 }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, margin: '0 6px', marginBottom: 22, background: i < step ? 'var(--nm-green)' : 'var(--nm-line)' }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form card */}
        <div className="nm-card" style={{ padding: 30 }}>
          {/* Step 1: Phone */}
          {step === 0 && (
            <div className="flex flex-col" style={{ gap: 20 }}>
              <div>
                <h2 className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>Phone verification</h2>
                <p style={{ fontSize: 13.5, color: 'var(--nm-muted)', margin: '2px 0 0' }}>Enter your mobile number to get started</p>
              </div>
              <div>
                <label className="nm-label">Mobile number</label>
                <div className="relative">
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--nm-muted)', fontSize: 14, fontWeight: 600 }}>+91</span>
                  <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError('phone'); }} placeholder="9876543210" className="nm-input" style={{ paddingLeft: 44 }} inputMode="numeric" disabled={otpSent} />
                  <Phone size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--nm-faint)' }} />
                </div>
                <FieldError msg={errors.phone} />
              </div>
              {!otpSent ? (
                <button onClick={handleSendOtp} disabled={loading} className="nm-btn-primary" style={{ width: '100%', opacity: loading ? 0.6 : 1 }}>
                  {loading && <Loader2 size={16} className="animate-spin" />} {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div>
                    <label className="nm-label">
                      6-digit OTP sent to +91 {phone}
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} style={{ marginLeft: 8, fontSize: 12, color: 'var(--nm-green)', background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
                    </label>
                    <div className="relative">
                      <input type="tel" value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError('otp'); }} placeholder="123456" className="nm-input num" style={{ textAlign: 'center', fontSize: 22, letterSpacing: '0.3em', fontWeight: 700 }} inputMode="numeric" autoFocus />
                      <KeyRound size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--nm-faint)' }} />
                    </div>
                    <FieldError msg={errors.otp} />
                  </div>
                  <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="nm-btn-primary" style={{ width: '100%', opacity: loading || otp.length !== 6 ? 0.6 : 1 }}>
                    {loading && <Loader2 size={16} className="animate-spin" />} {loading ? 'Verifying…' : 'Verify OTP'}
                  </button>
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--nm-muted)' }}>Resend OTP in {resendTimer}s</p>
                    ) : (
                      <button type="button" onClick={handleSendOtp} style={{ fontSize: 13, color: 'var(--nm-green)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Resend OTP</button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Business */}
          {step === 1 && (
            <div className="flex flex-col" style={{ gap: 18 }}>
              <div>
                <h2 className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>Business details</h2>
                <p style={{ fontSize: 13.5, color: 'var(--nm-muted)', margin: '2px 0 0' }}>Tell us about your business</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
                <div>
                  <label className="nm-label">Business name *</label>
                  <input type="text" value={businessName} onChange={(e) => { setBusinessName(e.target.value); clearError('businessName'); }} placeholder="ABC Traders Pvt. Ltd." className="nm-input" />
                  <FieldError msg={errors.businessName} />
                </div>
                <div>
                  <label className="nm-label">Business type *</label>
                  <select value={businessType} onChange={(e) => { setBusinessType(e.target.value); clearError('businessType'); }} className="nm-select">
                    <option value="">Select type</option>
                    {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <FieldError msg={errors.businessType} />
                </div>
              </div>
              <div>
                <label className="nm-label">GST number *</label>
                <input type="text" value={gstNumber} onChange={(e) => { setGstNumber(e.target.value.toUpperCase().slice(0, 15)); clearError('gstNumber'); }} placeholder="27AAPFU0939F1ZV" className="nm-input num" maxLength={15} />
                {gstNumber && GST_REGEX.test(gstNumber) && (
                  <p className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--nm-green)', marginTop: 5 }}><CheckCircle size={12} /> Valid GST format</p>
                )}
                <FieldError msg={errors.gstNumber} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
                <div>
                  <label className="nm-label">PAN number <span style={{ color: 'var(--nm-faint)', fontWeight: 400 }}>(optional)</span></label>
                  <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" className="nm-input num" maxLength={10} />
                </div>
                <div>
                  <label className="nm-label">MSME number <span style={{ color: 'var(--nm-faint)', fontWeight: 400 }}>(optional)</span></label>
                  <input type="text" value={msmeNumber} onChange={(e) => setMsmeNumber(e.target.value)} placeholder="UDYAM-XX-00-0000000" className="nm-input" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {step === 2 && (
            <div className="flex flex-col" style={{ gap: 18 }}>
              <div>
                <h2 className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>Business address</h2>
                <p style={{ fontSize: 13.5, color: 'var(--nm-muted)', margin: '2px 0 0' }}>Your registered business address</p>
              </div>
              <div>
                <label className="nm-label">Address line 1 *</label>
                <input type="text" value={bizLine1} onChange={(e) => { setBizLine1(e.target.value); clearError('bizLine1'); }} placeholder="Building / Street" className="nm-input" />
                <FieldError msg={errors.bizLine1} />
              </div>
              <div>
                <label className="nm-label">Address line 2 <span style={{ color: 'var(--nm-faint)', fontWeight: 400 }}>(optional)</span></label>
                <input type="text" value={bizLine2} onChange={(e) => setBizLine2(e.target.value)} placeholder="Area / Landmark" className="nm-input" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
                <div>
                  <label className="nm-label">City *</label>
                  <input type="text" value={bizCity} onChange={(e) => { setBizCity(e.target.value); clearError('bizCity'); }} placeholder="Mumbai" className="nm-input" />
                  <FieldError msg={errors.bizCity} />
                </div>
                <div>
                  <label className="nm-label">Pincode *</label>
                  <input type="text" value={bizPincode} onChange={(e) => { setBizPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError('bizPincode'); }} placeholder="400001" className="nm-input" inputMode="numeric" />
                  <FieldError msg={errors.bizPincode} />
                </div>
              </div>
              <div>
                <label className="nm-label">State *</label>
                <select value={bizState} onChange={(e) => { setBizState(e.target.value); clearError('bizState'); }} className="nm-select">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <FieldError msg={errors.bizState} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer" style={{ paddingTop: 6, borderTop: '1px solid var(--nm-line)' }}>
                <input type="checkbox" checked={warehouseSame} onChange={(e) => setWarehouseSame(e.target.checked)} style={{ accentColor: 'var(--nm-green)', width: 16, height: 16, marginTop: 6 }} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nm-ink)', marginTop: 6 }}>Warehouse same as business address</span>
              </label>
              {!warehouseSame && (
                <div className="flex flex-col" style={{ gap: 14, paddingLeft: 14, borderLeft: '2px solid var(--nm-line)' }}>
                  <p className="disp" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>Warehouse address</p>
                  <div>
                    <label className="nm-label">Address line 1 *</label>
                    <input type="text" value={whLine1} onChange={(e) => { setWhLine1(e.target.value); clearError('whLine1'); }} placeholder="Building / Street" className="nm-input" />
                    <FieldError msg={errors.whLine1} />
                  </div>
                  <div>
                    <label className="nm-label">Address line 2 <span style={{ color: 'var(--nm-faint)', fontWeight: 400 }}>(optional)</span></label>
                    <input type="text" value={whLine2} onChange={(e) => setWhLine2(e.target.value)} placeholder="Area / Landmark" className="nm-input" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
                    <div>
                      <label className="nm-label">City *</label>
                      <input type="text" value={whCity} onChange={(e) => { setWhCity(e.target.value); clearError('whCity'); }} placeholder="City" className="nm-input" />
                      <FieldError msg={errors.whCity} />
                    </div>
                    <div>
                      <label className="nm-label">Pincode *</label>
                      <input type="text" value={whPincode} onChange={(e) => { setWhPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError('whPincode'); }} placeholder="400001" className="nm-input" inputMode="numeric" />
                      <FieldError msg={errors.whPincode} />
                    </div>
                  </div>
                  <div>
                    <label className="nm-label">State *</label>
                    <select value={whState} onChange={(e) => { setWhState(e.target.value); clearError('whState'); }} className="nm-select">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <FieldError msg={errors.whState} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Bank */}
          {step === 3 && (
            <div className="flex flex-col" style={{ gap: 18 }}>
              <div>
                <h2 className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>Bank account</h2>
                <p style={{ fontSize: 13.5, color: 'var(--nm-muted)', margin: '2px 0 0' }}>Your payouts will be credited to this account</p>
              </div>
              <div>
                <label className="nm-label">Account holder name *</label>
                <input type="text" value={accountHolder} onChange={(e) => { setAccountHolder(e.target.value); clearError('accountHolder'); }} placeholder="As per bank records" className="nm-input" />
                <FieldError msg={errors.accountHolder} />
              </div>
              <div>
                <label className="nm-label">Account number *</label>
                <input type="text" value={accountNumber} onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '')); clearError('accountNumber'); setBankVerified(false); }} placeholder="Enter account number" className="nm-input num" inputMode="numeric" />
                <FieldError msg={errors.accountNumber} />
              </div>
              <div>
                <label className="nm-label">IFSC code *</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input type="text" value={ifsc} onChange={(e) => { setIfsc(e.target.value.toUpperCase().slice(0, 11)); clearError('ifsc'); setBankVerified(false); }} placeholder="SBIN0001234" className="nm-input num" maxLength={11} />
                    {ifsc && IFSC_REGEX.test(ifsc) && !bankVerified && (
                      <p className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--nm-green)', marginTop: 5 }}><CheckCircle size={12} /> Valid format</p>
                    )}
                    <FieldError msg={errors.ifsc} />
                  </div>
                  <button type="button" onClick={handleVerifyBank} disabled={bankVerifying || bankVerified} className={bankVerified ? 'nm-btn-soft' : 'nm-btn-primary'} style={{ flexShrink: 0 }}>
                    {bankVerifying ? <Loader2 size={16} className="animate-spin" /> : bankVerified ? <CheckCircle size={16} /> : <CreditCard size={16} />}
                    {bankVerified ? 'Verified' : 'Verify'}
                  </button>
                </div>
              </div>
              {bankVerified && (
                <div className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--nm-green)', background: 'var(--nm-green-soft)', borderRadius: 12, padding: '12px 16px' }}>
                  <CheckCircle size={16} style={{ flexShrink: 0 }} /> Account verified — payouts will be sent here.
                </div>
              )}
              <FieldError msg={errors.bankVerify} />
            </div>
          )}

          {/* Step 5: Documents */}
          {step === 4 && (
            <div className="flex flex-col" style={{ gap: 18 }}>
              <div>
                <h2 className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--nm-ink)', margin: 0 }}>Documents & agreement</h2>
                <p style={{ fontSize: 13.5, color: 'var(--nm-muted)', margin: '2px 0 0' }}>Upload your KYC documents to complete registration</p>
              </div>
              {renderDocUpload('GST Certificate *', gstCert, 'gst_certificate', setGstCert, 'gst-cert-input', 'gstCert')}
              {renderDocUpload('PAN Card *', panCard, 'pan_card', setPanCard, 'pan-card-input', 'panCard')}
              {renderDocUpload('Business Address Proof *', addressProof, 'address_proof', setAddressProof, 'address-proof-input', 'addressProof')}
              <div style={{ padding: 14, borderRadius: 12, border: agreed ? '1.5px solid var(--nm-green)' : '1px solid var(--nm-line)', background: agreed ? 'var(--nm-green-soft)' : 'var(--nm-panel)' }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); clearError('agreed'); }} style={{ accentColor: 'var(--nm-green)', width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--nm-ink)', lineHeight: 1.5 }}>
                    I agree to NirmalMandi&apos;s <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--nm-green)', fontWeight: 600 }}>Seller Agreement</a> and understand that my account is subject to verification before activation.
                  </span>
                </label>
              </div>
              <FieldError msg={errors.agreed} />
              <button onClick={handleComplete} disabled={loading} className="nm-btn-primary" style={{ width: '100%', padding: '14px 24px', fontSize: 15, opacity: loading ? 0.6 : 1 }}>
                {loading && <Loader2 size={18} className="animate-spin" />} {loading ? 'Submitting…' : 'Complete registration'}
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step > 0 && step < 4 && (
          <div className="flex items-center justify-between" style={{ marginTop: 20 }}>
            <button onClick={() => { setStep((s) => Math.max(s - 1, 0)); setErrors({}); }} className="nm-btn-secondary"><ArrowLeft size={16} /> Back</button>
            <button onClick={handleNext} className="nm-btn-primary">Continue to {STEPS[step + 1]}</button>
          </div>
        )}
        {step === 4 && (
          <div style={{ marginTop: 20 }}>
            <button onClick={() => { setStep(3); setErrors({}); }} className="nm-btn-secondary"><ArrowLeft size={16} /> Back</button>
          </div>
        )}

        <p className="text-center" style={{ fontSize: 12, color: 'var(--nm-faint)', marginTop: 24 }}>🔒 encrypted, used only for KYC.</p>
      </main>
    </div>
  );
}
