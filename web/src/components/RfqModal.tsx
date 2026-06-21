'use client';

import { useState } from 'react';
import { X, Loader2, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { rfqApi } from '@/lib/api';

interface Props {
  listing: {
    id: string;
    title: string;
    asking_price: number;
    moq?: number;
    available_quantity: number;
  };
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function RfqModal({ listing, onClose, onSubmitted }: Props) {
  const [quantity, setQuantity] = useState(listing.moq ?? 1);
  const [targetPrice, setTargetPrice] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (quantity < (listing.moq ?? 1)) {
      toast.error(`Minimum order quantity is ${listing.moq ?? 1}`);
      return;
    }
    setLoading(true);
    try {
      await rfqApi.submit({
        listing_id: listing.id,
        quantity,
        target_price: targetPrice ? parseFloat(targetPrice) : undefined,
        message: message.trim() || undefined,
      });
      toast.success('RFQ sent! The seller will respond within 24 hours.');
      onSubmitted?.();
      onClose();
    } catch {
      toast.error('Failed to send RFQ. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const total = targetPrice ? quantity * parseFloat(targetPrice) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-nm-surface dark:bg-nm-surface-dark rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-nm-border dark:border-nm-border-dark">
          <div>
            <h2 className="text-base font-bold text-nm-text dark:text-nm-text-dark">Request for Quotation</h2>
            <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted mt-0.5 truncate max-w-[280px]">{listing.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-nm-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Send a bulk quote request. Seller will respond with best price within 24 hours. Listing price: ₹{listing.asking_price.toLocaleString('en-IN')}/unit</p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-1.5">
              Quantity <span className="text-nm-danger">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQuantity(q => Math.max(listing.moq ?? 1, q - 1))}
                className="w-9 h-9 rounded-lg border border-nm-border dark:border-nm-border-dark font-bold text-nm-text dark:text-nm-text-dark hover:bg-gray-100 dark:hover:bg-gray-800">−</button>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min={listing.moq ?? 1}
                max={listing.available_quantity}
                className="nm-input flex-1 text-center font-semibold"
              />
              <button type="button" onClick={() => setQuantity(q => Math.min(listing.available_quantity, q + 1))}
                className="w-9 h-9 rounded-lg border border-nm-border dark:border-nm-border-dark font-bold text-nm-text dark:text-nm-text-dark hover:bg-gray-100 dark:hover:bg-gray-800">+</button>
            </div>
            {listing.moq && listing.moq > 1 && (
              <p className="text-[11px] text-nm-text-muted dark:text-nm-text-dark-muted mt-1">Min. order: {listing.moq} units</p>
            )}
          </div>

          {/* Target price */}
          <div>
            <label className="block text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-1.5">
              Your Target Price (₹/unit) <span className="text-nm-text-muted font-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nm-text-muted text-sm">₹</span>
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder={`e.g. ${Math.round(listing.asking_price * 0.85).toLocaleString('en-IN')}`}
                className="nm-input pl-7"
                min={1}
                step={0.01}
              />
            </div>
            {total !== null && (
              <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted mt-1">
                Estimated total: <span className="font-semibold text-nm-text dark:text-nm-text-dark">₹{total.toLocaleString('en-IN')}</span>
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider mb-1.5">
              Message to Seller <span className="text-nm-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Describe your requirement, delivery expectations, or ask questions..."
              className="nm-input resize-none text-sm"
            />
            <p className="text-[11px] text-nm-text-muted dark:text-nm-text-dark-muted text-right mt-0.5">{message.length}/500</p>
          </div>

          <button type="submit" disabled={loading}
            className="nm-btn-primary w-full flex items-center justify-center gap-2 py-3 font-bold disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? 'Sending...' : 'Send RFQ to Seller'}
          </button>
        </form>
      </div>
    </div>
  );
}
