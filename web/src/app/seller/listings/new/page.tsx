'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Star,
  Zap,
  Sparkles,
  Mic,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { aiApi } from '@/lib/api';
import { inventoryApi, type Sector } from '@/lib/api';

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
  // Step 1
  title: string;
  sector_id: string;
  dead_stock_type: string;
  description: string;
  // Step 2
  condition_grade: string;
  lot_type: string;
  total_quantity: string;
  unit: string;
  moq: string;
  // Step 3
  price_type: string;
  asking_price: string;
  mrp: string;
  floor_price: string;
  reserve_price: string;
  flash_sale_duration: string;
  must_sell: boolean;
  urgency_days: string;
  // Step 4
  images: UploadedImage[];
  // Step 5
  self_ship: boolean;
  dispatch_time: string;
  buyer_pickup: boolean;
  pickup_address_line1: string;
  pickup_address_line2: string;
  pickup_city: string;
  pickup_state: string;
  pickup_pincode: string;
  platform_logistics: boolean;
  // Step 6
  featured: boolean;
  urgent_badge: boolean;
}

const INITIAL_DRAFT: ListingDraft = {
  title: '',
  sector_id: '',
  dead_stock_type: '',
  description: '',
  condition_grade: '',
  lot_type: '',
  total_quantity: '',
  unit: 'pieces',
  moq: '',
  price_type: 'fixed',
  asking_price: '',
  mrp: '',
  floor_price: '',
  reserve_price: '',
  flash_sale_duration: '24',
  must_sell: false,
  urgency_days: '',
  images: [],
  self_ship: true,
  dispatch_time: '1-2',
  buyer_pickup: false,
  pickup_address_line1: '',
  pickup_address_line2: '',
  pickup_city: '',
  pickup_state: '',
  pickup_pincode: '',
  platform_logistics: false,
  featured: false,
  urgent_badge: false,
};

const STEPS = [
  'Basic Info',
  'Condition & Lot',
  'Pricing',
  'Images',
  'Logistics',
  'Preview & Go Live',
];

const DEAD_STOCK_TYPES = [
  { value: 'overstock', label: 'Overstock' },
  { value: 'returns', label: 'Returns' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'discontinued', label: 'Discontinued' },
  { value: 'samples', label: 'Samples' },
  { value: 'other', label: 'Other' },
];

const CONDITION_GRADES = [
  { value: 'A', label: 'A — Like New', description: 'Unused, perfect condition', color: 'border-green-500 bg-green-50 text-green-800' },
  { value: 'B', label: 'B — Good', description: 'Minor signs of handling', color: 'border-blue-500 bg-blue-50 text-blue-800' },
  { value: 'C', label: 'C — Fair', description: 'Visible wear, fully functional', color: 'border-orange-500 bg-orange-50 text-orange-800' },
  { value: 'D', label: 'D — For Parts', description: 'Damaged, for parts/repair', color: 'border-red-500 bg-red-50 text-red-800' },
];

const LOT_TYPES = [
  { value: 'full', label: 'Full Lot Only', description: 'Buyer must purchase the entire lot' },
  { value: 'partial', label: 'Partial Lots Allowed', description: 'Buyers can purchase portions' },
  { value: 'per_unit', label: 'Per Unit', description: 'Sold individually by unit' },
];

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'best_offer', label: 'Best Offer' },
  { value: 'auction', label: 'Auction' },
  { value: 'flash_sale', label: 'Flash Sale' },
];

const UNITS = ['pieces', 'kg', 'boxes', 'cartons', 'pallets', 'units'];

const DISPATCH_TIMES = [
  { value: 'same_day', label: 'Same Day' },
  { value: '1-2', label: '1-2 Business Days' },
  { value: '3-5', label: '3-5 Business Days' },
  { value: '1_week', label: '1 Week' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />{msg}
    </p>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
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

      // Pre-fill form fields from AI extraction
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

  // ── Validation ────────────────────────────────────────────────────────────────
  function validateStep(s: number): boolean {
    const errs: typeof errors = {};

    if (s === 0) {
      if (!draft.title.trim() || draft.title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
      if (draft.title.length > 500) errs.title = 'Title must be under 500 characters';
      if (!draft.sector_id) errs.sector_id = 'Please select a sector';
      if (!draft.dead_stock_type) errs.dead_stock_type = 'Please select dead stock type';
      if (draft.description.length > 2000) errs.description = 'Description must be under 2000 characters';
    }

    if (s === 1) {
      if (!draft.condition_grade) errs.condition_grade = 'Please select a condition grade';
      if (!draft.lot_type) errs.lot_type = 'Please select a lot type';
      if (!draft.total_quantity || Number(draft.total_quantity) <= 0) errs.total_quantity = 'Enter a valid quantity';
      if ((draft.lot_type === 'partial' || draft.lot_type === 'per_unit') && (!draft.moq || Number(draft.moq) <= 0)) {
        errs.moq = 'Minimum order quantity is required';
      }
    }

    if (s === 2) {
      if (!draft.asking_price || Number(draft.asking_price) <= 0) errs.asking_price = 'Enter a valid asking price';
      if (draft.price_type === 'best_offer' && draft.floor_price && Number(draft.floor_price) >= Number(draft.asking_price)) {
        errs.floor_price = 'Floor price must be less than asking price';
      }
      if (draft.must_sell && (!draft.urgency_days || Number(draft.urgency_days) <= 0)) {
        errs.urgency_days = 'Enter the number of days';
      }
    }

    if (s === 4) {
      if (draft.buyer_pickup) {
        if (!draft.pickup_address_line1.trim()) errs.pickup_address_line1 = 'Address is required';
        if (!draft.pickup_city.trim()) errs.pickup_city = 'City is required';
        if (!draft.pickup_state) errs.pickup_state = 'State is required';
        if (!/^\d{6}$/.test(draft.pickup_pincode)) errs.pickup_pincode = 'Enter a valid 6-digit pincode';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
    setErrors({});
  }

  // ── Image upload ──────────────────────────────────────────────────────────────
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
      // Update with URLs
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
      // Start uploads
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

  function moveImage(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= draft.images.length) return;
    setDraft((prev) => {
      const images = [...prev.images];
      [images[idx], images[newIdx]] = [images[newIdx], images[idx]];
      return { ...prev, images };
    });
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

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleGoLive() {
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
        urgency_days: draft.must_sell && draft.urgency_days ? Number(draft.urgency_days) : undefined,
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

  // ── Derived ────────────────────────────────────────────────────────────────────
  const discountPct =
    draft.mrp && draft.asking_price && Number(draft.mrp) > Number(draft.asking_price)
      ? Math.round(((Number(draft.mrp) - Number(draft.asking_price)) / Number(draft.mrp)) * 100)
      : null;

  const selectedSector = sectors.find((s) => s.id === draft.sector_id);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Create New Listing</h1>
        <p className="text-sm text-gray-500 mt-0.5">List your dead inventory in 6 simple steps</p>
      </div>

      {/* Progress indicator */}
      <div className="card p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={label} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`flex items-center gap-2 text-xs font-medium ${
                    active ? 'text-primary-700' : done ? 'text-green-700' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      done
                        ? 'bg-green-500 border-green-500 text-white'
                        : active
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-6 rounded ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2 sm:hidden">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      </div>

      {/* Step content */}
      <div className="card p-6">
        {/* Step 1 — Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

            {/* AI Prompt Panel */}
            {showAiPanel && (
              <div className="rounded-xl border-2 border-nm-primary/30 bg-nm-primary-pale overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-nm-primary/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-nm-primary" />
                    <span className="text-sm font-semibold text-nm-primary-dark">AI Listing Assistant</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiPanel(false)}
                    className="text-xs text-nm-primary/60 hover:text-nm-primary"
                  >
                    Fill manually instead
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-nm-primary/70">
                    Describe your dead stock in Hindi or English — AI will fill the form for you
                  </p>
                  {aiConversationHistory.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {aiConversationHistory.map((msg, i) => (
                        <div key={i} className={`text-xs rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-nm-primary text-white ml-8' : 'bg-white text-nm-text-muted mr-8'}`}>
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAiPrompt(); }}
                      placeholder={aiConversationHistory.length === 0
                        ? "e.g. Mere paas 500 shirts hain size M L XL, brand Levis, Surat godown mein, 3 saal se nahi bike..."
                        : "Reply to AI question..."}
                      className="flex-1 nm-input resize-none text-sm"
                      rows={3}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAiPrompt}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="nm-btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-60"
                  >
                    {aiLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> AI is analyzing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> {aiConversationHistory.length === 0 ? 'Generate Listing with AI' : 'Send'}</>
                    )}
                  </button>
                  {aiResponse && (
                    <div className="text-xs text-nm-primary-dark bg-white rounded-lg p-3 border border-nm-primary/20">
                      <span className="font-semibold">AI: </span>{aiResponse}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!showAiPanel && (
              <button
                type="button"
                onClick={() => setShowAiPanel(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-nm-primary border border-dashed border-nm-primary/40 rounded-xl hover:bg-nm-primary-pale transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Use AI to fill this form
              </button>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => { merge({ title: e.target.value }); clearError('title'); }}
                placeholder="e.g. 500 units Nike T-shirts - Overstock clearance"
                className="input-field"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-1">
                <FieldError msg={errors.title} />
                <span className={`text-xs ml-auto ${draft.title.length > 480 ? 'text-red-500' : 'text-gray-400'}`}>
                  {draft.title.length}/500
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector <span className="text-red-500">*</span>
              </label>
              <select
                value={draft.sector_id}
                onChange={(e) => { merge({ sector_id: e.target.value }); clearError('sector_id'); }}
                className="input-field appearance-none"
              >
                <option value="">Select sector…</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <FieldError msg={errors.sector_id} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dead Stock Type <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DEAD_STOCK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { merge({ dead_stock_type: t.value }); clearError('dead_stock_type'); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                      draft.dead_stock_type === t.value
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <FieldError msg={errors.dead_stock_type} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 text-xs font-normal">(optional)</span>
              </label>
              <textarea
                value={draft.description}
                onChange={(e) => { merge({ description: e.target.value }); clearError('description'); }}
                placeholder="Describe the product, condition, any defects, why it's being sold, etc."
                rows={4}
                maxLength={2000}
                className="input-field resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <FieldError msg={errors.description} />
                <span className={`text-xs ml-auto ${draft.description.length > 1900 ? 'text-red-500' : 'text-gray-400'}`}>
                  {draft.description.length}/2000
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Condition & Lot */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900">Condition & Lot Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition Grade <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CONDITION_GRADES.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => { merge({ condition_grade: g.value }); clearError('condition_grade'); }}
                    className={`p-3 rounded-xl text-left border-2 transition-all ${
                      draft.condition_grade === g.value ? g.color + ' border-opacity-100' : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${draft.condition_grade !== g.value ? 'text-gray-700' : ''}`}
                  >
                    <p className="text-sm font-semibold">{g.label}</p>
                    <p className={`text-xs mt-0.5 ${draft.condition_grade === g.value ? 'opacity-80' : 'text-gray-500'}`}>
                      {g.description}
                    </p>
                  </button>
                ))}
              </div>
              <FieldError msg={errors.condition_grade} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lot Type <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {LOT_TYPES.map((lt) => (
                  <button
                    key={lt.value}
                    type="button"
                    onClick={() => { merge({ lot_type: lt.value }); clearError('lot_type'); }}
                    className={`w-full p-3 rounded-xl text-left border-2 transition-all ${
                      draft.lot_type === lt.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${draft.lot_type === lt.value ? 'text-primary-700' : 'text-gray-800'}`}>
                      {lt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{lt.description}</p>
                  </button>
                ))}
              </div>
              <FieldError msg={errors.lot_type} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={draft.total_quantity}
                  onChange={(e) => { merge({ total_quantity: e.target.value }); clearError('total_quantity'); }}
                  placeholder="0"
                  min="1"
                  className="input-field"
                />
                <FieldError msg={errors.total_quantity} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={draft.unit}
                  onChange={(e) => merge({ unit: e.target.value })}
                  className="input-field appearance-none"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {(draft.lot_type === 'partial' || draft.lot_type === 'per_unit') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={draft.moq}
                  onChange={(e) => { merge({ moq: e.target.value }); clearError('moq'); }}
                  placeholder="e.g. 10"
                  min="1"
                  className="input-field"
                />
                <FieldError msg={errors.moq} />
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Pricing */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900">Pricing</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {PRICE_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => merge({ price_type: pt.value })}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      draft.price_type === pt.value
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asking Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={draft.asking_price}
                    onChange={(e) => { merge({ asking_price: e.target.value }); clearError('asking_price'); }}
                    placeholder="0"
                    min="1"
                    className="input-field pl-7"
                  />
                </div>
                <FieldError msg={errors.asking_price} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MRP (₹) <span className="text-gray-400 text-xs font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={draft.mrp}
                    onChange={(e) => merge({ mrp: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="input-field pl-7"
                  />
                </div>
                {discountPct !== null && (
                  <p className="text-xs text-green-600 mt-1 font-medium">Discount: {discountPct}% off MRP</p>
                )}
              </div>
            </div>

            {draft.price_type === 'best_offer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={draft.floor_price}
                    onChange={(e) => { merge({ floor_price: e.target.value }); clearError('floor_price'); }}
                    placeholder="Minimum acceptable price"
                    min="1"
                    className="input-field pl-7"
                  />
                </div>
                <FieldError msg={errors.floor_price} />
              </div>
            )}

            {draft.price_type === 'auction' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={draft.reserve_price}
                    onChange={(e) => merge({ reserve_price: e.target.value })}
                    placeholder="Minimum bid to win"
                    min="1"
                    className="input-field pl-7"
                  />
                </div>
              </div>
            )}

            {draft.price_type === 'flash_sale' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flash Sale Duration</label>
                <div className="flex gap-3">
                  {['24', '48'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => merge({ flash_sale_duration: h })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        draft.flash_sale_duration === h
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {h} Hours
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <Toggle
                checked={draft.must_sell}
                onChange={(v) => merge({ must_sell: v })}
                label="Mark as Must-Sell (adds urgency signal)"
              />
              {draft.must_sell && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Must sell within (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={draft.urgency_days}
                    onChange={(e) => { merge({ urgency_days: e.target.value }); clearError('urgency_days'); }}
                    placeholder="e.g. 7"
                    min="1"
                    className="input-field w-40"
                  />
                  <FieldError msg={errors.urgency_days} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Images */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Product Images</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Up to 20 images. JPEG, PNG, WebP. Max 5MB each. First image is the cover.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700">Drop images here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP • Max 5MB each • Up to 20 images</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
              />
            </div>

            {/* Image grid */}
            {draft.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {draft.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                      <img
                        src={img.previewUrl}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Status overlay */}
                      {img.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
                          <span className="text-white text-xs font-medium">{img.progress}%</span>
                          <div className="w-3/4 h-1 bg-white/30 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-white rounded-full transition-all"
                              style={{ width: `${img.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {img.status === 'done' && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {img.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/60 flex flex-col items-center justify-center gap-1">
                          <X className="w-5 h-5 text-white" />
                          <button
                            onClick={(e) => { e.stopPropagation(); retryImage(idx); }}
                            className="text-white text-xs bg-white/20 rounded px-1.5 py-0.5 hover:bg-white/30 flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Retry
                          </button>
                        </div>
                      )}

                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                          Cover
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveImage(idx, -1); }}
                        disabled={idx === 0}
                        className="w-5 h-5 bg-white/90 rounded text-gray-700 flex items-center justify-center disabled:opacity-30 hover:bg-white"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        className="w-5 h-5 bg-red-500 rounded text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveImage(idx, 1); }}
                        disabled={idx === draft.images.length - 1}
                        className="w-5 h-5 bg-white/90 rounded text-gray-700 flex items-center justify-center disabled:opacity-30 hover:bg-white"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {draft.images.length < 20 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs">Add more</span>
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-gray-400">{draft.images.length}/20 images added</p>
          </div>
        )}

        {/* Step 5 — Logistics */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900">Logistics & Shipping</h2>

            <div className="space-y-4">
              <Toggle
                checked={draft.self_ship}
                onChange={(v) => merge({ self_ship: v })}
                label="Seller Self-Ship"
              />

              {draft.self_ship && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Dispatch Time</label>
                  <select
                    value={draft.dispatch_time}
                    onChange={(e) => merge({ dispatch_time: e.target.value })}
                    className="input-field appearance-none w-64"
                  >
                    {DISPATCH_TIMES.map((dt) => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <Toggle
                checked={draft.buyer_pickup}
                onChange={(v) => merge({ buyer_pickup: v })}
                label="Buyer Pickup Available"
              />

              {draft.buyer_pickup && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Pickup Address</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={draft.pickup_address_line1}
                      onChange={(e) => { merge({ pickup_address_line1: e.target.value }); clearError('pickup_address_line1'); }}
                      placeholder="Building, Street"
                      className="input-field"
                    />
                    <FieldError msg={errors.pickup_address_line1} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2 <span className="text-gray-400">(optional)</span></label>
                    <input
                      type="text"
                      value={draft.pickup_address_line2}
                      onChange={(e) => merge({ pickup_address_line2: e.target.value })}
                      placeholder="Area, Landmark"
                      className="input-field"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">City <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={draft.pickup_city}
                        onChange={(e) => { merge({ pickup_city: e.target.value }); clearError('pickup_city'); }}
                        placeholder="City"
                        className="input-field"
                      />
                      <FieldError msg={errors.pickup_city} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Pincode <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={draft.pickup_pincode}
                        onChange={(e) => { merge({ pickup_pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }); clearError('pickup_pincode'); }}
                        placeholder="110001"
                        className="input-field"
                        inputMode="numeric"
                      />
                      <FieldError msg={errors.pickup_pincode} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State <span className="text-red-500">*</span></label>
                    <select
                      value={draft.pickup_state}
                      onChange={(e) => { merge({ pickup_state: e.target.value }); clearError('pickup_state'); }}
                      className="input-field appearance-none"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.pickup_state} />
                  </div>
                </div>
              )}

              <Toggle
                checked={draft.platform_logistics}
                onChange={(v) => merge({ platform_logistics: v })}
                label="Use Platform Logistics (Delhivery)"
              />
            </div>
          </div>
        )}

        {/* Step 6 — Preview & Go Live */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900">Preview & Go Live</h2>

            {/* Preview card */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              {draft.images.find((i) => i.status === 'done') ? (
                <img
                  src={draft.images.find((i) => i.status === 'done')!.previewUrl}
                  alt={draft.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {selectedSector && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                      {selectedSector.name}
                    </span>
                  )}
                  {draft.condition_grade && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Grade {draft.condition_grade}
                    </span>
                  )}
                  {draft.must_sell && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                      Must Sell
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 text-base">{draft.title || 'Your listing title'}</h3>
                <div className="flex items-baseline gap-2">
                  {draft.asking_price && (
                    <span className="text-xl font-bold text-gray-900">
                      ₹{Number(draft.asking_price).toLocaleString('en-IN')}
                    </span>
                  )}
                  {draft.mrp && Number(draft.mrp) > 0 && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{Number(draft.mrp).toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPct !== null && (
                    <span className="text-sm font-semibold text-green-600">{discountPct}% off</span>
                  )}
                </div>
                {draft.pickup_city && draft.pickup_state && (
                  <p className="text-xs text-gray-500">{draft.pickup_city}, {draft.pickup_state}</p>
                )}
              </div>
            </div>

            {/* Listing options */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => merge({ featured: !draft.featured })}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  draft.featured
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className={`w-5 h-5 ${draft.featured ? 'text-amber-500' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-sm font-semibold ${draft.featured ? 'text-amber-700' : 'text-gray-800'}`}>
                        Featured Listing
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Get 3× more views — Featured placement</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    draft.featured ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                  }`}>
                    {draft.featured && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => merge({ urgent_badge: !draft.urgent_badge })}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  draft.urgent_badge
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${draft.urgent_badge ? 'text-red-500' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-sm font-semibold ${draft.urgent_badge ? 'text-red-700' : 'text-gray-800'}`}>
                        Urgent Deal Badge
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Add urgency signal to your listing</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    draft.urgent_badge ? 'border-red-500 bg-red-500' : 'border-gray-300'
                  }`}>
                    {draft.urgent_badge && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            </div>

            {/* Go Live */}
            <button
              onClick={handleGoLive}
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl text-base font-bold bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Go Live
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
