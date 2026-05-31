'use client';

import { useState, useCallback } from 'react';
import {
  X, Loader2, RefreshCw, Copy, Share2, Check,
  Instagram, MessageCircle, Facebook, Send,
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
  onClose: () => void;
}

type Language = 'en' | 'hi' | 'hinglish';
type Tone = 'urgent' | 'premium' | 'casual' | 'bulk';
type Platform = 'whatsapp' | 'instagram' | 'facebook' | 'telegram';

interface CaptionResult {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  full_caption: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'hi', label: 'हिन्दी' },
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'en', label: 'English' },
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

// ── Component ──────────────────────────────────────────────────────────────────

export default function MarketingPanel({ listing, onClose }: MarketingPanelProps) {
  const [language, setLanguage] = useState<Language>('hi');
  const [tone, setTone] = useState<Tone>('urgent');
  const [platform, setPlatform] = useState<Platform>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [editedCaption, setEditedCaption] = useState('');
  const [copied, setCopied] = useState(false);

  const price = listing.asking_price ?? listing.price_per_unit ?? 0;
  const sector = listing.sector_name ?? listing.sector ?? 'general';
  const city = listing.city ?? listing.seller_city ?? '';
  const state = listing.state ?? listing.seller_state ?? '';
  const discountPct = listing.mrp && listing.mrp > price
    ? Math.round((1 - price / listing.mrp) * 100)
    : 0;

  const generate = useCallback(async () => {
    setLoading(true);
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
      });
      const data = (res.data as unknown as { data: CaptionResult }).data ?? res.data;
      setResult(data);
      setEditedCaption(data.full_caption ?? '');
    } catch {
      toast.error('AI caption generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [listing, language, tone, platform, price, sector, city, state]);

  function handleCopy() {
    const text = editedCaption || result?.full_caption || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Caption copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleShare() {
    const text = editedCaption || result?.full_caption || '';
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      handleCopy();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
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
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-nm-text-muted">
            <X className="w-5 h-5" />
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

          {/* Language */}
          <div>
            <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-2">Language</p>
            <div className="flex gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLanguage(l.value)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    language === l.value
                      ? 'border-nm-primary bg-nm-primary-pale text-nm-primary-dark'
                      : 'border-nm-border dark:border-nm-border-dark text-nm-text-muted dark:text-nm-text-dark-muted hover:border-nm-primary/40'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-2">Tone</p>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all text-left flex items-center gap-2 ${
                    tone === t.value
                      ? 'border-nm-primary bg-nm-primary-pale text-nm-primary-dark'
                      : 'border-nm-border dark:border-nm-border-dark text-nm-text dark:text-nm-text-dark hover:border-nm-primary/40'
                  }`}
                >
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-2">Platform</p>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`py-2.5 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${
                      platform === p.value
                        ? 'border-nm-primary bg-nm-primary-pale'
                        : 'border-nm-border dark:border-nm-border-dark hover:border-nm-primary/40'
                    }`}
                  >
                    <Icon className="w-5 h-5" style={{ color: platform === p.value ? p.color : undefined }} />
                    <span className="text-[10px] font-medium text-nm-text-muted dark:text-nm-text-dark-muted">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading}
            className="nm-btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-bold disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI is writing your caption...
              </>
            ) : result ? (
              <>
                <RefreshCw className="w-5 h-5" />
                Regenerate Caption
              </>
            ) : (
              <>
                <span className="text-lg">✨</span>
                Generate Caption
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="nm-card p-4">
                {/* Hook preview */}
                {result.hook && (
                  <div className="mb-3 pb-3 border-b border-nm-border dark:border-nm-border-dark">
                    <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted mb-1">Hook</p>
                    <p className="text-sm font-bold text-nm-text dark:text-nm-text-dark">{result.hook}</p>
                  </div>
                )}

                {/* Editable caption */}
                <p className="text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted mb-2">Full Caption (editable)</p>
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  rows={8}
                  className="nm-input resize-none text-sm leading-relaxed font-normal"
                />

                {/* Hashtags */}
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

              {/* Watermark notice */}
              <p className="text-xs text-center text-nm-text-muted dark:text-nm-text-dark-muted">
                ✓ 'Sourced from NirmalMandi' watermark included · Every share builds your brand
              </p>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className="nm-btn-secondary flex items-center justify-center gap-2 py-3 font-semibold"
                >
                  {copied ? <Check className="w-4 h-4 text-nm-success" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleShare}
                  className="nm-btn-primary flex items-center justify-center gap-2 py-3 font-semibold"
                >
                  <Share2 className="w-4 h-4" />
                  Share Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
