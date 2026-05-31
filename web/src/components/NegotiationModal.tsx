'use client';

import { useState } from 'react';
import { X, Loader2, IndianRupee, MessageCircle, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { negotiationsApi, aiApi } from '@/lib/api';

interface NegotiationModalProps {
  listing: {
    id: string;
    title: string;
    asking_price?: number;
    price_per_unit?: number;
    mrp?: number;
    sector?: string;
    sector_name?: string;
    floor_price?: number;
  };
  onClose: () => void;
  onAccepted?: (agreedPrice: number, negotiationId: string) => void;
}

type Step = 'offer' | 'submitted' | 'thread';

interface OfferRound {
  by: 'buyer' | 'seller';
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
}

export default function NegotiationModal({ listing, onClose, onAccepted }: NegotiationModalProps) {
  const askingPrice = listing.asking_price ?? listing.price_per_unit ?? 0;
  const floorPrice = listing.floor_price ?? 0;
  const discountPct = listing.mrp && listing.mrp > askingPrice
    ? Math.round((1 - askingPrice / listing.mrp) * 100) : 0;

  const [step, setStep] = useState<Step>('offer');
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [negotiationId, setNegotiationId] = useState('');
  const [rounds, setRounds] = useState<OfferRound[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<{ price: number; rationale: string } | null>(null);

  async function getAiSuggestion() {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/pricing/fair-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asking_price: askingPrice,
          buyer_offer: parseFloat(offerAmount) || askingPrice * 0.8,
          sector: listing.sector_name ?? listing.sector ?? 'general',
        }),
      });
      const data = await res.json();
      const result = data?.data ?? data;
      if (result?.fair_price) {
        setAiSuggestion({ price: result.fair_price, rationale: result.rationale ?? 'Based on market comparables' });
      }
    } catch {
      // Non-critical — just don't show suggestion
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmitOffer() {
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid offer amount');
      return;
    }
    if (floorPrice && amount < floorPrice) {
      toast.error(`Minimum offer is ₹${floorPrice.toLocaleString('en-IN')}`);
      return;
    }
    if (amount > askingPrice) {
      toast.error('Offer cannot exceed asking price — use Buy Now instead');
      return;
    }

    setLoading(true);
    try {
      const res = await negotiationsApi.makeOffer(listing.id, amount, message || undefined);
      const data = (res.data as unknown as { data: { id: string } })?.data ?? res.data;
      setNegotiationId(data.id ?? '');
      setRounds([{ by: 'buyer', amount, message, status: 'pending' }]);
      setStep('submitted');
      toast.success('Offer sent! Seller will respond within 48 hours.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to send offer. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(roundIndex: number) {
    if (!negotiationId) return;
    setLoading(true);
    try {
      await negotiationsApi.accept(negotiationId);
      const agreedPrice = rounds[roundIndex].amount;
      toast.success(`Deal at ₹${agreedPrice.toLocaleString('en-IN')}! Proceeding to checkout.`);
      onAccepted?.(agreedPrice, negotiationId);
      onClose();
    } catch {
      toast.error('Failed to accept offer');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!negotiationId) return;
    setLoading(true);
    try {
      await negotiationsApi.reject(negotiationId);
      toast.info('Offer rejected');
      onClose();
    } catch {
      toast.error('Failed to reject offer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-nm-surface dark:bg-nm-surface-dark rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-nm-border dark:border-nm-border-dark flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="w-5 h-5 text-nm-primary" />
            <div>
              <h2 className="text-base font-bold text-nm-text dark:text-nm-text-dark">Make an Offer</h2>
              <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">Negotiate directly with the seller</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-nm-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Listing preview */}
          <div className="nm-card p-3">
            <p className="text-sm font-semibold text-nm-text dark:text-nm-text-dark truncate mb-1">{listing.title}</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-nm-text dark:text-nm-text-dark">
                ₹{askingPrice.toLocaleString('en-IN')} <span className="text-nm-text-muted font-normal text-xs">asking</span>
              </span>
              {listing.mrp && (
                <span className="text-nm-text-muted line-through text-xs">MRP ₹{listing.mrp.toLocaleString('en-IN')}</span>
              )}
              {discountPct > 0 && (
                <span className="text-nm-success text-xs font-medium">{discountPct}% off MRP</span>
              )}
            </div>
            {floorPrice > 0 && (
              <p className="text-xs text-nm-warning mt-1">
                Minimum offer: ₹{floorPrice.toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {step === 'offer' && (
            <>
              {/* AI Suggestion */}
              {aiSuggestion ? (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-0.5">AI Fair Price</p>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-200">₹{aiSuggestion.price.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">{aiSuggestion.rationale}</p>
                    </div>
                    <button
                      onClick={() => setOfferAmount(aiSuggestion.price.toString())}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors flex-shrink-0"
                    >
                      Use this →
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={getAiSuggestion}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-nm-primary/40 text-nm-primary text-sm font-medium hover:bg-nm-primary-pale transition-colors"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  {aiLoading ? 'Getting AI suggestion...' : 'Get AI fair price suggestion'}
                </button>
              )}

              {/* Offer amount input */}
              <div>
                <label className="nm-label">Your Offer Amount</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nm-text-muted" />
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder={Math.round(askingPrice * 0.85).toString()}
                    className="nm-input pl-8"
                    min={floorPrice || 1}
                    max={askingPrice}
                  />
                </div>
                {offerAmount && parseFloat(offerAmount) > 0 && (
                  <p className="text-xs text-nm-text-muted mt-1">
                    {Math.round((1 - parseFloat(offerAmount) / askingPrice) * 100)}% below asking price
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="nm-label">Message to seller <span className="text-nm-text-muted font-normal">(optional)</span></label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. I can pay within 24 hours and can arrange pickup..."
                  className="nm-input resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-nm-text-muted text-right mt-0.5">{message.length}/500</p>
              </div>

              {/* How it works */}
              <div className="nm-card p-3 text-xs text-nm-text-muted dark:text-nm-text-dark-muted space-y-1.5">
                <p className="font-semibold text-nm-text dark:text-nm-text-dark text-sm mb-2">How Best Offer works</p>
                {[
                  'You submit an offer — seller has 48 hours to respond',
                  'Seller can accept, reject, or make a counter offer',
                  'Up to 5 rounds of negotiation allowed',
                  'If accepted, payment goes to secure escrow',
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-nm-primary-pale text-nm-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmitOffer}
                disabled={loading || !offerAmount}
                className="nm-btn-primary w-full py-3 text-base font-bold disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Sending offer...
                  </span>
                ) : `Submit Offer — ₹${offerAmount ? parseFloat(offerAmount).toLocaleString('en-IN') : '—'}`}
              </button>
            </>
          )}

          {step === 'submitted' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-nm-primary-pale flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-nm-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-nm-text dark:text-nm-text-dark">Offer Sent!</h3>
                <p className="text-sm text-nm-text-muted dark:text-nm-text-dark-muted mt-1">
                  Your offer of <strong>₹{parseFloat(offerAmount).toLocaleString('en-IN')}</strong> has been sent to the seller.
                </p>
              </div>

              {/* Offer thread */}
              <div className="nm-card p-4 text-left space-y-3">
                <p className="text-xs font-semibold text-nm-text-muted uppercase tracking-wider">Negotiation Thread</p>
                {rounds.map((round, i) => (
                  <div key={i} className={`flex ${round.by === 'buyer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                      round.by === 'buyer'
                        ? 'bg-nm-primary text-white rounded-br-none'
                        : 'bg-nm-bg dark:bg-nm-surface-dark text-nm-text dark:text-nm-text-dark rounded-bl-none'
                    }`}>
                      <p className="text-xs font-semibold mb-0.5 opacity-75">{round.by === 'buyer' ? 'You' : 'Seller'}</p>
                      <p className="text-sm font-bold">₹{round.amount.toLocaleString('en-IN')}</p>
                      {round.message && <p className="text-xs mt-0.5 opacity-80">{round.message}</p>}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-center text-nm-text-muted">
                  Waiting for seller response • Expires in 48 hours
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 nm-btn-secondary flex items-center justify-center gap-2 py-2.5"
                >
                  <XCircle className="w-4 h-4" /> Withdraw
                </button>
                <button onClick={onClose} className="flex-1 nm-btn-primary py-2.5">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
