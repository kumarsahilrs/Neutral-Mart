'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Check,
  Sparkles,
  Shield,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { aiApi } from '@/lib/api';
import { inventoryApi, type Sector } from '@/lib/api';
import { AppShell, SectionCard } from '@/components/ui';
import { SELLER_NAV, SELLER_BRAND_SUB, SellerSidebarFooter } from '../../_nav';

// ── Types ──────────────────────────────────────────────────────────────────────
interface UploadedImage {
  file: File;
  previewUrl: string;
  imageUrl: string;
  uploadUrl: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
}

interface ListingDraft {
  title: string;
  sector_id: string;
  dead_stock_type: string;
  description: string;
  condition_grade: string;
  lot_type: string;
  total_quantity: string;
  unit: string;
  moq: string;
  price_type: string;
  asking_price: string;
  mrp: string;
  floor_price: string;
  reserve_price: string;
  flash_sale_duration: string;
  must_sell: boolean;
  urgency_days: string;
  images: UploadedImage[];
  self_ship: boolean;
  dispatch_time: string;
  buyer_pickup: boolean;
  pickup_address_line1: string;
  pickup_address_line2: string;
  pickup_city: string;
  pickup_state: string;
  pickup_pincode: string;
  platform_logistics: boolean;
  featured: boolean;
  urgent_badge: boolean;
  urgency: number; // 1-5 urgency selector
}

const INITIAL_DRAFT: ListingDraft = {
  title: '', sector_id: '', dead_stock_type: '', description: '',
  condition_grade: '', lot_type: '', total_quantity: '', unit: 'pieces', moq: '',
  price_type: 'fixed', asking_price: '', mrp: '', floor_price: '', reserve_price: '',
  flash_sale_duration: '24', must_sell: false, urgency_days: '',
  images: [],
  self_ship: true, dispatch_time: '1-2', buyer_pickup: false,
  pickup_address_line1: '', pickup_address_line2: '', pickup_city: '',
  pickup_state: '', pickup_pincode: '', platform_logistics: false,
  featured: false, urgent_badge: false, urgency: 3,
};

const DEAD_STOCK_TYPES = [
  { value: 'overstock', label: 'Overstock' },
  { value: 'returns', label: 'Returns' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'discontinued', label: 'Discontinued' },
  { value: 'samples', label: 'Samples' },
  { value: 'other', label: 'Other' },
];

const CONDITION_GRADES = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
];

const LOT_TYPES = [
  { value: 'full', label: 'Full lot only' },
  { value: 'partial', label: 'Partial lots' },
  { value: 'per_unit', label: 'Per unit' },
];

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed price' },
  { value: 'best_offer', label: 'Best offer' },
  { value: 'auction', label: 'Auction' },
  { value: 'flash_sale', label: 'Flash sale' },
];

const UNITS = ['pieces', 'kg', 'boxes', 'cartons', 'pallets', 'units'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

const URGENCY_LABELS: Record<number, string> = {
  1: 'Low — standard listing',
  2: 'Mild — slight push',
  3: 'Moderate — featured in feed',
  4: 'High — boosted placement',
  5: '🔥 High — eligible for flash sale',
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: 12, color: 'var(--nm-red)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
      <AlertCircle size={12} />{msg}
    </p>
  );
}

// ── Chip helpers ──────────────────────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        border: `1.5px solid ${active ? 'var(--nm-green)' : 'var(--nm-line)'}`,
        background: active ? 'var(--nm-green-soft)' : 'var(--nm-card)',
        color: active ? 'var(--nm-green)' : 'var(--nm-muted)',
        transition: 'all .12s',
      }}
    >
      {children}
    </button>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--nm-ink)', marginBottom: 6 };

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function NewListingPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<ListingDraft>(INITIAL_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<keyof ListingDraft | string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // ── AI Listing Prompt ─────────────────────────────────────────────────────────
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiConversationHistory, setAiConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [showAiPanel, setShowAiPanel] = useState(true);

  async function handleAiPrompt() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiApi.enhanceListing(aiPrompt, aiConversationHistory);
      const data = res.data as unknown as {
        conversational_response?: string;
        extracted_fields?: Record<string, unknown>;
        detected_sector?: string;
        questions?: string[];
      };
      const extracted = data.extracted_fields ?? {};
      const response = data.conversational_response ?? '';

      merge({
        title: (extracted.title as string) || (extracted.product_name as string) || draft.title,
        description: (extracted.description as string) || draft.description,
        dead_stock_type: (extracted.dead_stock_type as string) || draft.dead_stock_type,
        condition_grade: (extracted.condition_grade as string) || draft.condition_grade,
        total_quantity: (extracted.quantity as string) || (extracted.total_quantity as string) || draft.total_quantity,
        unit: (extracted.unit as string) || draft.unit,
        asking_price: (extracted.asking_price as string) || (extracted.price as string) || draft.asking_price,
        mrp: (extracted.mrp as string) || draft.mrp,
      });

      setAiResponse(response);
      setAiConversationHistory(prev => [
        ...prev,
        { role: 'user', content: aiPrompt },
        { role: 'assistant', content: response },
      ]);
      setAiPrompt('');

      if (data.detected_sector && sectors.length > 0) {
        const matched = sectors.find(s =>
          s.slug?.toLowerCase() === (data.detected_sector as string)?.toLowerCase() ||
          s.name?.toLowerCase().includes((data.detected_sector as string)?.toLowerCase())
        );
        if (matched) merge({ sector_id: matched.id });
      }

      toast.success('AI extracted listing details. Review and confirm below.');
    } catch {
      toast.error('AI service unavailable. Fill in the form manually.');
    } finally {
      setAiLoading(false);
    }
  }

  function merge(partial: Partial<ListingDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function clearError(key: string) {
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  // Fetch sectors
  const { data: sectorsData } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => inventoryApi.getSectors(),
    select: (res) => (res.data as unknown as { data: Sector[] })?.data ?? (res.data as unknown as Sector[]),
  });
  const sectors: Sector[] = Array.isArray(sectorsData) ? sectorsData : [];

  // ── Validation (covers all fields in one pass) ─────────────────────────────────
  function validateAll(): boolean {
    const errs: typeof errors = {};

    if (!draft.title.trim() || draft.title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
    if (draft.title.length > 500) errs.title = 'Title must be under 500 characters';
    if (!draft.sector_id) errs.sector_id = 'Please select a category';
    if (!draft.dead_stock_type) errs.dead_stock_type = 'Please select stock type';
    if (draft.description.length > 2000) errs.description = 'Description must be under 2000 characters';

    if (!draft.condition_grade) errs.condition_grade = 'Select a condition grade';
    if (!draft.lot_type) errs.lot_type = 'Select a lot type';
    if (!draft.total_quantity || Number(draft.total_quantity) <= 0) errs.total_quantity = 'Enter a valid quantity';
    if ((draft.lot_type === 'partial' || draft.lot_type === 'per_unit') && (!draft.moq || Number(draft.moq) <= 0)) {
      errs.moq = 'Minimum order quantity is required';
    }

    if (!draft.asking_price || Number(draft.asking_price) <= 0) errs.asking_price = 'Enter a valid asking price';
    if (draft.price_type === 'best_offer' && draft.floor_price && Number(draft.floor_price) >= Number(draft.asking_price)) {
      errs.floor_price = 'Floor price must be less than asking price';
    }

    if (draft.buyer_pickup) {
      if (!draft.pickup_address_line1.trim()) errs.pickup_address_line1 = 'Address is required';
      if (!draft.pickup_city.trim()) errs.pickup_city = 'City is required';
      if (!draft.pickup_state) errs.pickup_state = 'State is required';
      if (!/^\d{6}$/.test(draft.pickup_pincode)) errs.pickup_pincode = 'Enter a valid 6-digit pincode';
    } else {
      if (!draft.pickup_state) errs.pickup_state = 'State is required';
      if (!draft.pickup_city.trim()) errs.pickup_city = 'City is required';
    }

    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields');
    }
    return Object.keys(errs).length === 0;
  }

  // ── Image upload (logic preserved) ─────────────────────────────────────────────
  async function getPresignedUrl(file: File): Promise<{ uploadUrl: string; imageUrl: string }> {
    const res = await api.get<{ data: { uploadUrl: string; imageUrl: string } }>(
      '/listings/upload-url',
      { params: { filename: file.name, filetype: file.type } }
    );
    return (res.data as unknown as { data: { uploadUrl: string; imageUrl: string } })?.data ?? res.data;
  }

  async function uploadFile(img: UploadedImage, idx: number): Promise<void> {
    try {
      const { uploadUrl, imageUrl } = await getPresignedUrl(img.file);
      setDraft((prev) => {
        const images = [...prev.images];
        images[idx] = { ...images[idx], uploadUrl, imageUrl, status: 'uploading', progress: 0 };
        return { ...prev, images };
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', img.file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setDraft((prev) => {
              const images = [...prev.images];
              if (images[idx]) images[idx] = { ...images[idx], progress: pct };
              return { ...prev, images };
            });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(img.file);
      });

      setDraft((prev) => {
        const images = [...prev.images];
        if (images[idx]) images[idx] = { ...images[idx], status: 'done', progress: 100 };
        return { ...prev, images };
      });
    } catch {
      setDraft((prev) => {
        const images = [...prev.images];
        if (images[idx]) images[idx] = { ...images[idx], status: 'error', progress: 0 };
        return { ...prev, images };
      });
    }
  }

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const valid = arr.filter((f) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast.error(`${f.name}: unsupported format`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    const remaining = 20 - draft.images.length;
    const toAdd = valid.slice(0, remaining);
    if (valid.length > remaining) toast.warning(`Only ${remaining} more image${remaining !== 1 ? 's' : ''} can be added (max 20)`);

    if (!toAdd.length) return;

    const newImgs: UploadedImage[] = toAdd.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      imageUrl: '',
      uploadUrl: '',
      status: 'pending',
      progress: 0,
    }));

    setDraft((prev) => {
      const updated = [...prev.images, ...newImgs];
      updated.forEach((img, idx) => {
        if (img.status === 'pending') {
          setTimeout(() => uploadFile(img, idx), 0);
        }
      });
      return { ...prev, images: updated };
    });
  }

  function removeImage(idx: number) {
    setDraft((prev) => {
      const images = [...prev.images];
      URL.revokeObjectURL(images[idx].previewUrl);
      images.splice(idx, 1);
      return { ...prev, images };
    });
  }

  function retryImage(idx: number) {
    const img = draft.images[idx];
    if (!img) return;
    setDraft((prev) => {
      const images = [...prev.images];
      images[idx] = { ...images[idx], status: 'pending', progress: 0 };
      return { ...prev, images };
    });
    setTimeout(() => uploadFile(draft.images[idx], idx), 0);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }, [draft.images.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  // ── Submit (logic preserved) ───────────────────────────────────────────────────
  async function handleGoLive() {
    if (!validateAll()) return;

    const pendingUploads = draft.images.filter((i) => i.status !== 'done' && i.status !== 'error');
    if (pendingUploads.length > 0) {
      toast.error('Please wait for all images to finish uploading');
      return;
    }
    const errorUploads = draft.images.filter((i) => i.status === 'error');
    if (errorUploads.length > 0) {
      toast.error('Some images failed to upload. Please retry or remove them.');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryApi.createListing({
        sector_id: draft.sector_id,
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        dead_stock_type: draft.dead_stock_type,
        condition_grade: draft.condition_grade,
        lot_type: draft.lot_type,
        total_quantity: Number(draft.total_quantity),
        moq: draft.moq ? Number(draft.moq) : undefined,
        unit: draft.unit,
        price_type: draft.price_type,
        asking_price: Number(draft.asking_price),
        floor_price: draft.floor_price ? Number(draft.floor_price) : undefined,
        mrp: draft.mrp ? Number(draft.mrp) : undefined,
        state: draft.pickup_state || '',
        city: draft.pickup_city || '',
        urgency_days: draft.urgency >= 4 ? draft.urgency : (draft.must_sell && draft.urgency_days ? Number(draft.urgency_days) : undefined),
        images: draft.images.filter((i) => i.status === 'done').map((i) => i.imageUrl),
      });
      toast.success('Listing is live!');
      router.push('/seller/listings');
    } catch {
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function saveDraft() {
    try {
      const serializable = { ...draft, images: [] };
      if (typeof window !== 'undefined') localStorage.setItem('nm_listing_draft', JSON.stringify(serializable));
      toast.success('Draft saved');
    } catch {
      toast.error('Could not save draft');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const doneImages = draft.images.filter((i) => i.status === 'done' || i.status === 'uploading');

  return (
    <AppShell
      navItems={SELLER_NAV}
      brandSub={SELLER_BRAND_SUB}
      sidebarFooter={<SellerSidebarFooter />}
      title="New listing"
      subtitle="List your dead inventory"
      actions={
        <div className="flex items-center gap-3">
          <button onClick={saveDraft} className="nm-btn-secondary" style={{ fontSize: 13.5 }}>Save draft</button>
          <button onClick={handleGoLive} disabled={submitting} className="nm-btn-primary flex items-center gap-2" style={{ fontSize: 13.5 }}>
            {submitting && <Loader2 size={15} className="animate-spin" />} Publish
          </button>
        </div>
      }
    >
      {/* AI Listing Assistant */}
      {showAiPanel ? (
        <div
          className="mb-5"
          style={{ borderRadius: 16, border: '1.5px solid rgba(31,107,58,.25)', background: 'var(--nm-green-soft)', overflow: 'hidden' }}
        >
          <div className="flex items-center justify-between" style={{ padding: '12px 18px', borderBottom: '1px solid rgba(31,107,58,.16)' }}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: 'var(--nm-green)' }} />
              <span className="disp" style={{ fontSize: 14, fontWeight: 700, color: 'var(--nm-green)' }}>AI listing assistant</span>
            </div>
            <button onClick={() => setShowAiPanel(false)} style={{ fontSize: 12, color: 'var(--nm-green)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Fill manually instead
            </button>
          </div>
          <div style={{ padding: 18 }}>
            <p style={{ fontSize: 12.5, color: 'var(--nm-green)', marginBottom: 12 }}>
              Describe your dead stock in Hindi or English — AI will fill the form for you.
            </p>
            {aiConversationHistory.length > 0 && (
              <div className="flex flex-col gap-2 mb-3" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {aiConversationHistory.map((msg, i) => (
                  <div key={i} style={{
                    fontSize: 12.5, borderRadius: 10, padding: '8px 12px',
                    background: msg.role === 'user' ? 'var(--nm-green)' : 'var(--nm-card)',
                    color: msg.role === 'user' ? '#fff' : 'var(--nm-muted)',
                    marginLeft: msg.role === 'user' ? 32 : 0, marginRight: msg.role === 'user' ? 0 : 32,
                  }}>
                    {msg.content}
                  </div>
                ))}
              </div>
            )}
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAiPrompt(); }}
              placeholder={aiConversationHistory.length === 0
                ? 'e.g. Mere paas 500 shirts hain size M L XL, brand Levis, Surat godown mein, 3 saal se nahi bike...'
                : 'Reply to AI question...'}
              className="nm-input"
              style={{ width: '100%', resize: 'none', fontSize: 13.5, marginBottom: 12 }}
              rows={3}
            />
            <button
              onClick={handleAiPrompt}
              disabled={aiLoading || !aiPrompt.trim()}
              className="nm-btn-primary w-full flex items-center justify-center gap-2"
              style={{ fontSize: 13.5 }}
            >
              {aiLoading
                ? <><Loader2 size={16} className="animate-spin" /> AI is analyzing…</>
                : <><Sparkles size={16} /> {aiConversationHistory.length === 0 ? 'Generate listing with AI' : 'Send'}</>}
            </button>
            {aiResponse && (
              <div style={{ fontSize: 12.5, color: 'var(--nm-green)', background: 'var(--nm-card)', borderRadius: 10, padding: 12, marginTop: 12, border: '1px solid rgba(31,107,58,.16)' }}>
                <span style={{ fontWeight: 700 }}>AI: </span>{aiResponse}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAiPanel(true)}
          className="w-full flex items-center justify-center gap-2 mb-5"
          style={{ padding: '11px', fontSize: 13.5, color: 'var(--nm-green)', border: '1.5px dashed rgba(31,107,58,.4)', borderRadius: 14, background: 'transparent', cursor: 'pointer' }}
        >
          <Sparkles size={16} /> Use AI to fill this form
        </button>
      )}

      {/* Two-column form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column (spans 2) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Basics */}
          <SectionCard title="Basics">
            <div className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  value={draft.title}
                  onChange={(e) => { merge({ title: e.target.value }); clearError('title'); }}
                  placeholder="e.g. 500 units Nike T-shirts - Overstock clearance"
                  className="nm-input"
                  style={{ width: '100%' }}
                  maxLength={500}
                />
                <FieldError msg={errors.title} />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => { merge({ description: e.target.value }); clearError('description'); }}
                  placeholder="Describe the product, condition, any defects, why it's being sold…"
                  rows={4}
                  maxLength={2000}
                  className="nm-input"
                  style={{ width: '100%', resize: 'none' }}
                />
                <FieldError msg={errors.description} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select
                    value={draft.sector_id}
                    onChange={(e) => { merge({ sector_id: e.target.value }); clearError('sector_id'); }}
                    className="nm-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select category…</option>
                    {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <FieldError msg={errors.sector_id} />
                </div>
                <div>
                  <label style={labelStyle}>Stock type *</label>
                  <select
                    value={draft.dead_stock_type}
                    onChange={(e) => { merge({ dead_stock_type: e.target.value }); clearError('dead_stock_type'); }}
                    className="nm-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select type…</option>
                    {DEAD_STOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <FieldError msg={errors.dead_stock_type} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Price type</label>
                <select
                  value={draft.price_type}
                  onChange={(e) => merge({ price_type: e.target.value })}
                  className="nm-select"
                  style={{ width: '100%' }}
                >
                  {PRICE_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Pricing & quantity */}
          <SectionCard title="Pricing & quantity">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Asking price (₹) *</label>
                  <input
                    type="number"
                    value={draft.asking_price}
                    onChange={(e) => { merge({ asking_price: e.target.value }); clearError('asking_price'); }}
                    placeholder="0"
                    min="1"
                    className="nm-input"
                    style={{ width: '100%' }}
                  />
                  <FieldError msg={errors.asking_price} />
                </div>
                <div>
                  <label style={labelStyle}>MRP (₹)</label>
                  <input
                    type="number"
                    value={draft.mrp}
                    onChange={(e) => merge({ mrp: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="nm-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label style={labelStyle}>Total quantity *</label>
                  <input
                    type="number"
                    value={draft.total_quantity}
                    onChange={(e) => { merge({ total_quantity: e.target.value }); clearError('total_quantity'); }}
                    placeholder="0"
                    min="1"
                    className="nm-input"
                    style={{ width: '100%' }}
                  />
                  <FieldError msg={errors.total_quantity} />
                </div>
                <div>
                  <label style={labelStyle}>Unit</label>
                  <select
                    value={draft.unit}
                    onChange={(e) => merge({ unit: e.target.value })}
                    className="nm-select"
                    style={{ width: '100%' }}
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>MOQ</label>
                  <input
                    type="number"
                    value={draft.moq}
                    onChange={(e) => { merge({ moq: e.target.value }); clearError('moq'); }}
                    placeholder="e.g. 10"
                    min="1"
                    className="nm-input"
                    style={{ width: '100%' }}
                  />
                  <FieldError msg={errors.moq} />
                </div>
              </div>

              {draft.price_type === 'best_offer' && (
                <div>
                  <label style={labelStyle}>Floor price (₹)</label>
                  <input
                    type="number"
                    value={draft.floor_price}
                    onChange={(e) => { merge({ floor_price: e.target.value }); clearError('floor_price'); }}
                    placeholder="Minimum acceptable price"
                    min="1"
                    className="nm-input"
                    style={{ width: '100%' }}
                  />
                  <FieldError msg={errors.floor_price} />
                </div>
              )}

              <div>
                <label style={labelStyle}>Condition grade *</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_GRADES.map((g) => (
                    <Chip key={g.value} active={draft.condition_grade === g.value} onClick={() => { merge({ condition_grade: g.value }); clearError('condition_grade'); }}>
                      Grade {g.label}
                    </Chip>
                  ))}
                </div>
                <FieldError msg={errors.condition_grade} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Stock type</label>
                  <select
                    value={draft.dead_stock_type}
                    onChange={(e) => { merge({ dead_stock_type: e.target.value }); clearError('dead_stock_type'); }}
                    className="nm-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select type…</option>
                    {DEAD_STOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Lot type *</label>
                  <select
                    value={draft.lot_type}
                    onChange={(e) => { merge({ lot_type: e.target.value }); clearError('lot_type'); }}
                    className="nm-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select lot type…</option>
                    {LOT_TYPES.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                  </select>
                  <FieldError msg={errors.lot_type} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Photos */}
          <SectionCard title="Photos">
            <div className="flex flex-wrap gap-3">
              {doneImages.map((img, idx) => {
                const realIdx = draft.images.indexOf(img);
                return (
                  <div key={realIdx} className="relative" style={{ width: 120, height: 120 }}>
                    <div style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--nm-line)', background: 'var(--nm-panel)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt={`Upload ${realIdx + 1}`} className="w-full h-full object-cover" />
                      {img.status === 'uploading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(20,73,42,.5)' }}>
                          <Loader2 size={18} className="animate-spin" style={{ color: '#fff' }} />
                          <span style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{img.progress}%</span>
                        </div>
                      )}
                      {img.status === 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ background: 'rgba(182,68,42,.6)' }}>
                          <X size={18} style={{ color: '#fff' }} />
                          <button onClick={(e) => { e.stopPropagation(); retryImage(realIdx); }} style={{ color: '#fff', fontSize: 11, background: 'rgba(255,255,255,.2)', borderRadius: 6, padding: '2px 6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <RefreshCw size={11} /> Retry
                          </button>
                        </div>
                      )}
                      {img.status === 'done' && (
                        <div className="absolute flex items-center justify-center" style={{ top: 6, right: 6, width: 20, height: 20, borderRadius: 999, background: 'var(--nm-green)' }}>
                          <Check size={12} style={{ color: '#fff' }} />
                        </div>
                      )}
                      {realIdx === 0 && (
                        <div className="absolute" style={{ top: 6, left: 6, background: 'var(--nm-green)', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>Cover</div>
                      )}
                    </div>
                    <button
                      onClick={() => removeImage(realIdx)}
                      style={{ position: 'absolute', bottom: 6, right: 6, width: 22, height: 22, borderRadius: 999, background: 'var(--nm-red)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}

              {draft.images.length < 20 && (
                <div
                  onDrop={handleDrop}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center"
                  style={{
                    width: 120, height: 120, borderRadius: 12, cursor: 'pointer',
                    border: `1.5px dashed ${isDragging ? 'var(--nm-green)' : 'var(--nm-line)'}`,
                    background: isDragging ? 'var(--nm-green-soft)' : 'var(--nm-panel)',
                    color: isDragging ? 'var(--nm-green)' : 'var(--nm-faint)',
                  }}
                >
                  <Upload size={20} />
                  <span style={{ fontSize: 11, marginTop: 6 }}>Drop / browse</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
                  />
                </div>
              )}
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--nm-faint)', marginTop: 10 }}>
              {draft.images.length}/20 images · JPEG, PNG, WebP · Max 5MB each · First image is the cover.
            </p>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Location */}
          <SectionCard title="Location">
            <div className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>State *</label>
                <select
                  value={draft.pickup_state}
                  onChange={(e) => { merge({ pickup_state: e.target.value }); clearError('pickup_state'); }}
                  className="nm-select"
                  style={{ width: '100%' }}
                >
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <FieldError msg={errors.pickup_state} />
              </div>
              <div>
                <label style={labelStyle}>City *</label>
                <input
                  value={draft.pickup_city}
                  onChange={(e) => { merge({ pickup_city: e.target.value }); clearError('pickup_city'); }}
                  placeholder="City"
                  className="nm-input"
                  style={{ width: '100%' }}
                />
                <FieldError msg={errors.pickup_city} />
              </div>
              <div>
                <label style={labelStyle}>Pincode</label>
                <input
                  value={draft.pickup_pincode}
                  onChange={(e) => { merge({ pickup_pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }); clearError('pickup_pincode'); }}
                  placeholder="110001"
                  inputMode="numeric"
                  className="nm-input"
                  style={{ width: '100%' }}
                />
                <FieldError msg={errors.pickup_pincode} />
              </div>
            </div>
          </SectionCard>

          {/* Urgency */}
          <SectionCard title="Urgency">
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => merge({ urgency: n })}
                  className="num flex items-center justify-center"
                  style={{
                    width: 44, height: 44, borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${draft.urgency === n ? 'var(--nm-gold)' : 'var(--nm-line)'}`,
                    background: draft.urgency === n ? 'var(--nm-gold)' : 'var(--nm-card)',
                    color: draft.urgency === n ? '#fff' : 'var(--nm-muted)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {draft.urgency >= 5 && <Flame size={15} style={{ color: 'var(--nm-gold)' }} />}
              <p style={{ fontSize: 12.5, fontWeight: 600, color: draft.urgency >= 4 ? 'var(--nm-gold-ink)' : 'var(--nm-muted)', margin: 0 }}>
                {URGENCY_LABELS[draft.urgency]}
              </p>
            </div>
          </SectionCard>

          {/* GSTIN note */}
          <div style={{ background: 'var(--nm-green-soft)', borderRadius: 14, padding: 16 }}>
            <div className="flex items-start gap-2.5">
              <Shield size={16} style={{ color: 'var(--nm-green)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--nm-green)', margin: 0, lineHeight: 1.45 }}>
                Your GSTIN is verified on file. A compliant tax invoice is generated automatically for every sale — no extra paperwork.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
