'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface AuctionState {
  listing_id: string;
  highest_bid: number;
  bidder_count: number;
  auction_ends_at: string | null;
  reserve_met: boolean;
  extended: boolean;
}

export interface BidEvent {
  type: 'bid_placed' | 'auction_extended' | 'auction_ended' | 'bid_error' | 'auction_state';
  amount?: number;
  bidder_count?: number;
  auction_ends_at?: string;
  new_end_time?: string;
  message?: string;
  data?: AuctionState;
}

const WS_BASE = process.env.NEXT_PUBLIC_ORDER_WS_URL || 'ws://localhost:3003';

export function useAuction(listingId: string | null, enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [state, setState] = useState<AuctionState>({
    listing_id: listingId ?? '',
    highest_bid: 0,
    bidder_count: 0,
    auction_ends_at: null,
    reserve_met: false,
    extended: false,
  });
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [recentBid, setRecentBid] = useState<{ amount: number; ts: number } | null>(null);

  const connect = useCallback(() => {
    if (!listingId || !enabled || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_BASE}/ws/auction?listing_id=${listingId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        setLastError(null);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg: BidEvent = JSON.parse(event.data);

          if (msg.type === 'auction_state' && msg.data) {
            setState(prev => ({
              ...prev,
              ...msg.data!,
              listing_id: listingId,
            }));
          }

          if (msg.type === 'bid_placed') {
            setState(prev => ({
              ...prev,
              highest_bid: msg.amount ?? prev.highest_bid,
              bidder_count: msg.bidder_count ?? prev.bidder_count,
              auction_ends_at: msg.auction_ends_at ?? prev.auction_ends_at,
            }));
            setRecentBid({ amount: msg.amount ?? 0, ts: Date.now() });
          }

          if (msg.type === 'auction_extended') {
            setState(prev => ({
              ...prev,
              auction_ends_at: msg.new_end_time ?? prev.auction_ends_at,
              extended: true,
            }));
          }

          if (msg.type === 'bid_error') {
            setLastError(msg.message ?? 'Bid failed');
          }
        } catch {
          // malformed message — ignore
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        // Reconnect after 3s
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    } catch {
      // WebSocket not available (SSR) — silently ignore
    }
  }, [listingId, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const placeBid = useCallback((amount: number, buyerId: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setLastError('Not connected to auction. Please refresh.');
      return false;
    }
    setLastError(null);
    wsRef.current.send(JSON.stringify({ type: 'place_bid', amount, buyer_id: buyerId }));
    return true;
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  return { state, connected, lastError, recentBid, placeBid, clearError };
}
