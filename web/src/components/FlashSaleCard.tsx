'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';

interface FlashSaleCardProps {
  listing: {
    id: string;
    title: string;
    images: string[];
    asking_price: number;
    mrp?: number;
    flash_sale_ends_at: string;
    sector_name?: string;
    condition_grade: string;
  };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ended';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

export default function FlashSaleCard({ listing }: FlashSaleCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>(() => {
    const diff = new Date(listing.flash_sale_ends_at).getTime() - Date.now();
    return formatCountdown(diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(listing.flash_sale_ends_at).getTime() - Date.now();
      setTimeLeft(formatCountdown(diff));
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [listing.flash_sale_ends_at]);

  const discountPct =
    listing.mrp && listing.mrp > listing.asking_price
      ? Math.round((1 - listing.asking_price / listing.mrp) * 100)
      : null;

  const imageUrl = listing.images && listing.images.length > 0 ? listing.images[0] : null;
  const ended = timeLeft === 'Ended';

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex-shrink-0 w-44 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-150 block overflow-hidden"
    >
      {/* Image */}
      <div className="relative w-full h-[120px] bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center rounded-t-lg overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-10 h-10 text-primary-300" />
        )}
        {discountPct !== null && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            {discountPct}% off
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5">
        {/* Title */}
        <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2 mb-1.5">
          {listing.title}
        </p>

        {/* Price row */}
        <div className="flex items-baseline gap-1 flex-wrap mb-1.5">
          <span className="text-sm font-bold text-gray-900">
            ₹{listing.asking_price.toLocaleString('en-IN')}
          </span>
          {listing.mrp && listing.mrp > listing.asking_price && (
            <span className="line-through text-gray-400 text-xs">
              ₹{listing.mrp.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Countdown */}
        <div className={`text-xs font-mono font-bold ${ended ? 'text-gray-400' : 'text-red-600'}`}>
          {ended ? 'Sale Ended' : `⏱ ${timeLeft}`}
        </div>

        {/* View Deal */}
        <div className="mt-2">
          <span className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-1 rounded transition-colors">
            View Deal
          </span>
        </div>
      </div>
    </Link>
  );
}
