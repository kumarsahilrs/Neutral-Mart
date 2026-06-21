'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  X, Loader2, RefreshCw, Copy, Share2, Check,
  Instagram, MessageCircle, Facebook, Send,
  Image as ImageIcon, FileText, Download, Zap, Film,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiApi } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MarketingPanelProps {
  listing: {
    id: string;
    title: string;
    sector_name?: string;
    sector?: string;
    asking_price?: number;
    price_per_unit?: number;
    mrp?: number;
    condition_grade?: string;
    city?: string;
    seller_city?: string;
    state?: string;
    seller_state?: string;
  };
  buyerProfileId?: string;
  onClose: () => void;
}

type Language = 'en' | 'hi' | 'hinglish' | 'gu' | 'pa' | 'mr';
type Tone = 'urgent' | 'premium' | 'casual' | 'bulk';
type Platform = 'whatsapp' | 'instagram' | 'facebook' | 'telegram';
type Format = 'square' | 'horizontal' | 'vertical';
type Tab = 'caption' | 'graphic' | 'reel';

interface CaptionResult {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  full_caption: string;
}

interface CreditInfo {
  daily_remaining: number;
  daily_limit: number;
  daily_used: number;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'hi', label: 'हिन्दी' },
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'en', label: 'English' },
  { value: 'gu', label: 'ગુજરાતી' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
  { value: 'mr', label: 'मराठी' },
];

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: 'urgent', label: 'Urgent Deal', emoji: '🔥' },
  { value: 'premium', label: 'Premium Quality', emoji: '⭐' },
  { value: 'casual', label: 'Casual Reseller', emoji: '😊' },
  { value: 'bulk', label: 'Bulk Offer', emoji: '📦' },
];

const PLATFORMS: { value: Platform; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2' },
  { value: 'telegram', label: 'Telegram', icon: Send, color: '#2CA5E0' },
];

const FORMATS: { value: Format; label: string; desc: string; ratio: string }[] = [
  { value: 'square', label: 'Square', desc: '1:1', ratio: 'aspect-square' },
  { value: 'horizontal', label: 'Landscape', desc: '16:9', ratio: 'aspect-video' },
  { value: 'vertical', label: 'Portrait', desc: '9:16', ratio: 'aspect-[9/16]' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function MarketingPanel({ listing, buyerProfileId, onClose }: MarketingPanelProps) {
  const [tab, setTab] = useState<Tab>('caption');

  // Caption state
  const [language, setLanguage] = useState<Language>('hi');
  const [tone, setTone] = useState<Tone>('urgent');
  const [platform, setPlatform] = useState<Platform>('whatsapp');
  const [captionLoading, setCaptionLoading] = useState(false);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [editedCaption, setEditedCaption] = useState('');
  const [copied, setCopied] = useState(false);

  // Graphic state
  const [format, setFormat] = useState<Format>('square');
  const [graphicLoading, setGraphicLoading] = useState(false);
  const [graphicUrl, setGraphicUrl] = useState<string | null>(null);

  // Reel state
  const [reelDuration, setReelDuration] = useState<15 | 20 | 30>(20);
  const [reelLoading, setReelLoading] = useState(false);
  const [reelScript, setReelScript] = useState<{
    hook_line: string;
    segments: Array<{ time: string; text: string; action: string }>;
    caption: string; hashtags: string[];
    voiceover_style: string; background_music: string;
  } | null>(null);
  const [reelCopied, setReelCopied] = useState(false);

  // Credits
  const [credits, setCredits] = useState<CreditInfo | null>(null);

  const price = listing.asking_price ?? listing.price_per_unit ?? 0;
  const sector = listing.sector_name ?? listing.sector ?? 'general';
  const city = listing.city ?? listing.seller_city ?? '';
  const state = listing.state ?? listing.seller_state ?? '';
  const discountPct = listing.mrp && listing.mrp > price
    ? Math.round((1 - price / listing.mrp) * 100)
    : 0;

  // Load credit balance
  useEffect(() => {
    if (!buyerProfileId) return;
    aiApi.getCreditBalance(buyerProfileId)
      .then(r => setCredits((r.data as { data: CreditInfo }).data))
      .catch(() => {});
  }, [buyerProfileId]);

  const generate = useCallback(async () => {
    setCaptionLoading(true);
    try {
      const res = await aiApi.generateCaption({
        listing_id: listing.id,
        product_title: listing.title,
        sector,
        price,
        mrp: listing.mrp,
        grade: listing.condition_grade ?? 'A',
        city,
        state,
        language,
        tone,
        platform,
        ...(buyerProfileId ? { buyer_profile_id: buyerProfileId } : {}),
      } as Parameters<typeof aiApi.generateCaption>[0]);
      const data = (res.data as unknown as { data: CaptionResult }).data ?? res.data;
      setResult(data);
      setEditedCaption(data.full_caption ?? '');
      if (credits) setCredits(c => c ? { ...c, daily_used: c.daily_used + 1, daily_remaining: Math.max(0, c.daily_remaining - 1) } : c);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: { message?: string } } } };
      const msg = err?.response?.data?.detail?.message ?? 'AI caption generation failed.';
      toast.error(msg);
    } finally {
      setCaptionLoading(false);
    }
  }, [listing, language, tone, platform, price, sector, city, state, buyerProfileId, credits]);

  const generateGraphic = useCallback(async () => {
    setGraphicLoading(true);
    setGraphicUrl(null);
    try {
      const res = await aiApi.generateGraphic({
        product_title: listing.title,
        sector,
        price,
        mrp: listing.mrp,
        condition_grade: listing.condition_grade ?? 'A',
        city,
        format,
        buyer_profile_id: buyerProfileId,
      });
      const data = (res.data as unknown as { data: { image_b64: string } }).data;
      setGraphicUrl(data.image_b64);
      if (credits) setCredits(c => c ? { ...c, daily_used: c.daily_used + 1, daily_remaining: Math.max(0, c.daily_remaining - 1) } : c);
      toast.success('Graphic ready!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: { message?: string } } } };
      const msg = err?.response?.data?.detail?.message ?? 'Graphic generation failed.';
      toast.error(msg);
    } finally {
      setGraphicLoading(false);
    }
  }, [listing, sector, price, format, city, buyerProfileId, credits]);

  const generateReel = useCallback(async () => {
    setReelLoading(true);
    setReelScript(null);
    try {
      const res = await aiApi.generateReelScript({
        product_title: listing.title,
        sector,
        price,
        mrp: listing.mrp,
        condition_grade: listing.condition_grade ?? 'A',
        city,
        language,
        duration: reelDuration,
        buyer_profile_id: buyerProfileId,
      });
      const data = (res.data as unknown as { data: typeof reelScript }).data;
      setReelScript(data);
      if (credits) setCredits(c => c ? { ...c, daily_used: c.daily_used + 1, daily_remaining: Math.max(0, c.daily_remaining - 1) } : c);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: { message?: string } } } };
      toast.error(err?.response?.data?.detail?.message ?? 'Reel script generation failed.');
    } finally {
      setReelLoading(false);
    }
  }, [listing, language, price, sector, city, reelDuration, buyerProfileId, credits]);

  function handleCopy() {
    const text = editedCaption || result?.full_caption || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Caption copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleShare() {
    const text = editedCaption || result?.full_caption || '';
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else handleCopy();
  }

  function handleDownloadGraphic() {
    if (!graphicUrl) return;
    const a = document.createElement('a');
    a.href = graphicUrl;
    a.download = `nirmalmandi-graphic-${format}.jpg`;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-nm-surface dark:bg-nm-surface-dark rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-nm-border dark:border-nm-border-dark flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📣</span>
            <div>
              <h2 className="text-base font-bold text-nm-text dark:text-nm-text-dark">AI Marketing Panel</h2>
              <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">Generate ready-to-share content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {credits && (
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                credits.daily_remaining === 0
                  ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  : 'bg-nm-primary-pale border-nm-primary/20 text-nm-primary-dark'
              }`}>
                <Zap className="w-3 h-3" />
                {credits.daily_remaining}/{credits.daily_limit} today
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-nm-text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-nm-border dark:border-nm-border-dark flex-shrink-0">
          <button
            onClick={() => setTab('caption')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors ${
              tab === 'caption'
                ? 'text-nm-primary border-b-2 border-nm-primary'
                : 'text-nm-text-muted dark:text-nm-text-dark-muted hover:text-nm-text dark:hover:text-nm-text-dark'
            }`}
          >
            <FileText className="w-4 h-4" /> Caption
          </button>
          <button
            onClick={() => setTab('graphic')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors ${
              tab === 'graphic'
                ? 'text-nm-primary border-b-2 border-nm-primary'
                : 'text-nm-text-muted dark:text-nm-text-dark-muted hover:text-nm-text dark:hover:text-nm-text-dark'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Graphic
          </button>
          <button
            onClick={() => setTab('reel')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors ${
              tab === 'reel'
                ? 'text-nm-primary border-b-2 border-nm-primary'
                : 'text-nm-text-muted dark:text-nm-text-dark-muted hover:text-nm-text dark:hover:text-nm-text-dark'
            }`}
          >
            <Film className="w-4 h-4" /> Reel
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Product preview */}
          <div className="nm-card p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-nm-primary-pale rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📦</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-nm-text dark:text-nm-text-dark truncate">{listing.title}</p>
              <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">
                ₹{price.toLocaleString('en-IN')}
                {discountPct > 0 && <span className="ml-1.5 text-nm-success font-medium">{discountPct}% off MRP</span>}
              </p>
            </div>
          </div>

          {/* ── CAPTION TAB ── */}
          {tab === 'caption' && (
            <>
              <div>
                <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-2">Language</p>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l.value} onClick={() => setLanguage(l.value)}
                      className={`py-2 px-2 rounded-xl text-sm font-medium border-2 transition-all text-center ${
                        language === l.value
                          ? 'border-nm-primary bg-nm-primary-pale text-nm-primary-dark'
                          : 'border-nm-border dark:border-nm-border-dark text-nm-text-muted dark:text-nm-text-dark-muted hover:border-nm-primary/40'
                      }`}>{l.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-2">Tone</p>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button key={t.value} onClick={() => setTone(t.value)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all text-left flex items-center gap-2 ${
                        tone === t.value
                          ? 'border-nm-primary bg-nm-primary-pale text-nm-primary-dark'
                          : 'border-nm-border dark:border-nm-border-dark text-nm-text dark:text-nm-text-dark hover:border-nm-primary/40'
                      }`}><span>{t.emoji}</span>{t.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-2">Platform</p>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORMS.map(p => {
                    const Icon = p.icon;
                    return (
                      <button key={p.value} onClick={() => setPlatform(p.value)}
                        className={`py-2.5 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${
                          platform === p.value
                            ? 'border-nm-primary bg-nm-primary-pale'
                            : 'border-nm-border dark:border-nm-border-dark hover:border-nm-primary/40'
                        }`}>
                        <Icon className="w-5 h-5" style={{ color: platform === p.value ? p.color : undefined }} />
                        <span className="text-[10px] font-medium text-nm-text-muted dark:text-nm-text-dark-muted">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={generate} disabled={captionLoading || (credits?.daily_remaining === 0)}
                className="nm-btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-bold disabled:opacity-60">
                {captionLoading ? <><Loader2 className="w-5 h-5 animate-spin" />AI is writing...</>
                  : result ? <><RefreshCw className="w-5 h-5" />Regenerate</>
                  : <><span className="text-lg">✨</span>Generate Caption (1 credit)</>}
              </button>

              {result && (
                <div className="space-y-3">
                  <div className="nm-card p-4">
                    {result.hook && (
                      <div className="mb-3 pb-3 border-b border-nm-border dark:border-nm-border-dark">
                        <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted mb-1">Hook</p>
                        <p className="text-sm font-bold text-nm-text dark:text-nm-text-dark">{result.hook}</p>
                      </div>
                    )}
                    <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted mb-2">Full Caption (editable)</p>
                    <textarea value={editedCaption} onChange={e => setEditedCaption(e.target.value)}
                      rows={8} className="nm-input resize-none text-sm leading-relaxed font-normal" />
                    {result.hashtags?.length > 0 && platform !== 'whatsapp' && (
                      <div className="mt-3 pt-3 border-t border-nm-border dark:border-nm-border-dark">
                        <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted mb-2">Hashtags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.hashtags.map(tag => (
                            <span key={tag} className="text-xs bg-nm-primary-pale text-nm-primary-dark px-2 py-1 rounded-full font-medium">
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-center text-nm-text-muted dark:text-nm-text-dark-muted">
                    ✓ 'Sourced from NirmalMandi' watermark included
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleCopy} className="nm-btn-secondary flex items-center justify-center gap-2 py-3 font-semibold">
                      {copied ? <Check className="w-4 h-4 text-nm-success" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={handleShare} className="nm-btn-primary flex items-center justify-center gap-2 py-3 font-semibold">
                      <Share2 className="w-4 h-4" />Share Now
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── GRAPHIC TAB ── */}
          {tab === 'graphic' && (
            <>
              <div>
                <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-2">Format</p>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATS.map(f => (
                    <button key={f.value} onClick={() => setFormat(f.value)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        format === f.value
                          ? 'border-nm-primary bg-nm-primary-pale'
                          : 'border-nm-border dark:border-nm-border-dark hover:border-nm-primary/40'
                      }`}>
                      <div className={`w-12 bg-gray-200 dark:bg-gray-700 rounded ${f.ratio}`} />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-nm-text dark:text-nm-text-dark">{f.label}</p>
                        <p className="text-[10px] text-nm-text-muted dark:text-nm-text-dark-muted">{f.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={generateGraphic} disabled={graphicLoading || (credits?.daily_remaining === 0)}
                className="nm-btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-bold disabled:opacity-60">
                {graphicLoading
                  ? <><Loader2 className="w-5 h-5 animate-spin" />Creating graphic...</>
                  : graphicUrl
                  ? <><RefreshCw className="w-5 h-5" />Regenerate Graphic</>
                  : <><ImageIcon className="w-5 h-5" />Generate Graphic (1 credit)</>}
              </button>

              {graphicUrl && (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-nm-border dark:border-nm-border-dark">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={graphicUrl} alt="AI generated marketing graphic" className="w-full object-cover" />
                  </div>
                  <p className="text-xs text-center text-nm-text-muted dark:text-nm-text-dark-muted">
                    ✓ NirmalMandi watermark included · Ready to share
                  </p>
                  <button onClick={handleDownloadGraphic}
                    className="nm-btn-primary w-full flex items-center justify-center gap-2 py-3 font-semibold">
                    <Download className="w-4 h-4" />Download Graphic
                  </button>
                </div>
              )}

              {credits?.daily_remaining === 0 && (
                <p className="text-xs text-center text-red-500 font-medium">
                  Daily limit reached. Resets at midnight.
                </p>
              )}
            </>
          )}

          {/* ── REEL TAB ── */}
          {tab === 'reel' && (
            <>
              {/* Duration picker */}
              <div>
                <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-2">Duration</p>
                <div className="flex gap-2">
                  {([15, 20, 30] as const).map(d => (
                    <button key={d} onClick={() => setReelDuration(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        reelDuration === d
                          ? 'border-nm-primary bg-nm-primary-pale text-nm-primary-dark'
                          : 'border-nm-border dark:border-nm-border-dark text-nm-text-muted hover:border-nm-primary/40'
                      }`}>{d}s</button>
                  ))}
                </div>
              </div>

              <button onClick={generateReel} disabled={reelLoading || credits?.daily_remaining === 0}
                className="nm-btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-bold disabled:opacity-60">
                {reelLoading
                  ? <><Loader2 className="w-5 h-5 animate-spin" />Writing script...</>
                  : reelScript
                  ? <><RefreshCw className="w-5 h-5" />Regenerate Script</>
                  : <><Film className="w-5 h-5" />Generate Reel Script (1 credit)</>}
              </button>

              {reelScript && (
                <div className="space-y-3">
                  {/* Hook */}
                  <div className="nm-card p-3 border-l-4 border-nm-primary">
                    <p className="text-[10px] font-semibold text-nm-text-muted uppercase mb-1">Hook (0–3s)</p>
                    <p className="text-sm font-bold text-nm-text dark:text-nm-text-dark">{reelScript.hook_line}</p>
                  </div>

                  {/* Segments */}
                  <div className="space-y-2">
                    {reelScript.segments?.map((seg, i) => (
                      <div key={i} className="nm-card p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-nm-primary bg-nm-primary-pale px-2 py-0.5 rounded-full">{seg.time}</span>
                          <span className="text-[10px] text-nm-text-muted italic">{seg.action}</span>
                        </div>
                        <p className="text-sm text-nm-text dark:text-nm-text-dark">{seg.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Vibe info */}
                  <div className="flex gap-2 text-[11px] text-nm-text-muted flex-wrap">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">🎙 {reelScript.voiceover_style}</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">🎵 {reelScript.background_music}</span>
                  </div>

                  {/* Caption */}
                  {reelScript.caption && (
                    <div>
                      <p className="text-[10px] font-semibold text-nm-text-muted uppercase mb-1">Caption</p>
                      <p className="text-xs text-nm-text dark:text-nm-text-dark bg-gray-50 dark:bg-gray-800 rounded-xl p-3 leading-relaxed">
                        {reelScript.caption}
                      </p>
                    </div>
                  )}

                  {/* Copy button */}
                  <button
                    onClick={() => {
                      const text = [
                        `HOOK: ${reelScript.hook_line}`,
                        '',
                        ...(reelScript.segments ?? []).map(s => `[${s.time}] ${s.text}\n  → ${s.action}`),
                        '',
                        `CAPTION: ${reelScript.caption}`,
                        (reelScript.hashtags ?? []).join(' '),
                      ].join('\n');
                      navigator.clipboard.writeText(text).then(() => {
                        setReelCopied(true);
                        toast.success('Script copied!');
                        setTimeout(() => setReelCopied(false), 2000);
                      });
                    }}
                    className="nm-btn-secondary w-full flex items-center justify-center gap-2 py-3 font-semibold"
                  >
                    {reelCopied ? <Check className="w-4 h-4 text-nm-success" /> : <Copy className="w-4 h-4" />}
                    {reelCopied ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
