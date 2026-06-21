import Link from 'next/link';
import { Heart, Tag, Package } from 'lucide-react';
import { type Listing } from '@/lib/api';

// Indian number formatter
export function inr(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

interface Grade { label: string; color: string; bg: string }
const GRADES: Record<string, Grade> = {
  A: { label: 'Grade A', color: '#1f6b3a', bg: '#e9f4ec' },
  B: { label: 'Grade B', color: '#281f12', bg: '#efe9dd' },
  C: { label: 'Grade C', color: '#a9690a', bg: '#fdeccc' },
  D: { label: 'Grade D', color: '#b6442a', bg: '#fbe7e2' },
};

interface ListingCardProps {
  listing: Listing & {
    sector_name?: string;
    seller_name?: string;
    seller_city?: string;
    moq?: number;
    view_count?: number;
    flash_sale?: boolean;
  };
  compact?: boolean;
  onWatchlist?: (id: string) => void;
  watchlisted?: boolean;
}

export default function ListingCard({ listing: l, compact, onWatchlist, watchlisted }: ListingCardProps) {
  const grade = GRADES[l.condition_grade ?? 'B'] ?? GRADES.B;
  const price = l.asking_price ?? l.price_per_unit ?? 0;
  const savePct = l.mrp && l.mrp > price ? Math.round((1 - price / l.mrp) * 100) : 0;
  const sectorName = (l as { sector_name?: string }).sector_name ?? '';
  const sellerName = (l as { seller_name?: string }).seller_name ?? '';
  const city       = l.city ?? (l as { seller_city?: string }).seller_city ?? '';
  const isFlash    = !!(l as { flash_sale?: boolean }).flash_sale;

  return (
    <Link href={`/listings/${l.id}`} className="nm-card flex flex-col overflow-hidden no-underline group" style={{ transition: 'box-shadow 0.2s' }}>
      {/* Image */}
      <div className="relative" style={{ aspectRatio: compact ? '4/3' : '1/1', background: 'var(--nm-panel)', overflow: 'hidden' }}>
        {isFlash && (
          <span className="nm-pill absolute top-3 left-3 z-10" style={{ background: '#b6442a', color: '#fff', fontWeight: 700 }}>
            🔥 Flash
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onWatchlist?.(l.id); }}
          className="absolute top-3 right-3 z-10 flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.12)' }}
        >
          <Heart
            size={16}
            strokeWidth={1.8}
            fill={watchlisted ? '#b6442a' : 'none'}
            style={{ color: watchlisted ? '#b6442a' : 'var(--nm-muted)' }}
          />
        </button>
        {l.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={l.images[0]}
            alt={l.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} style={{ color: 'var(--nm-faint)' }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2" style={{ padding: '14px 16px', flex: 1 }}>
        {/* Pills */}
        <div className="flex gap-1.5 flex-wrap">
          {sectorName && (
            <span className="nm-pill" style={{ color: 'var(--nm-green)', background: 'var(--nm-green-soft)', fontSize: 11 }}>
              <Tag size={10} strokeWidth={2} /> {sectorName}
            </span>
          )}
          <span className="nm-pill" style={{ color: grade.color, background: grade.bg, fontSize: 11 }}>
            {grade.label}
          </span>
        </div>

        {/* Title */}
        <div className="disp line-clamp-2" style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.25, color: 'var(--nm-ink)' }}>
          {l.title}
        </div>

        {/* Seller */}
        {(sellerName || city) && (
          <div style={{ fontSize: 12.5, color: 'var(--nm-muted)' }}>
            {sellerName}{sellerName && city ? ' · ' : ''}{city}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-end gap-2 mt-auto">
          <span className="num" style={{ fontSize: 24, fontWeight: 800, color: 'var(--nm-green)' }}>
            ₹{price.toLocaleString('en-IN')}
          </span>
          {l.mrp && l.mrp > price && (
            <span style={{ fontSize: 13, color: 'var(--nm-faint)', textDecoration: 'line-through', marginBottom: 3 }}>
              ₹{l.mrp.toLocaleString('en-IN')}
            </span>
          )}
          {savePct > 0 && (
            <span
              className="nm-pill ml-auto"
              style={{ background: 'var(--nm-gold)', color: 'var(--nm-deep)', fontWeight: 800, marginBottom: 1 }}
            >
              −{savePct}%
            </span>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-between"
          style={{ fontSize: 12, color: 'var(--nm-muted)', borderTop: '1px solid var(--nm-line-soft)', paddingTop: 9, marginTop: 4 }}
        >
          <span>MOQ {(l as { moq?: number }).moq ?? l.quantity ?? 1}</span>
          <span>{((l as { view_count?: number }).view_count ?? 0).toLocaleString('en-IN')} views</span>
        </div>
      </div>
    </Link>
  );
}
