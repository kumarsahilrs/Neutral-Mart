/**
 * Sprint 12 — Agent Tool Executor
 * Runs tool calls returned by the AI agent and returns human-readable results.
 */
import { inventoryApi, ordersApi } from './api';

export interface ToolResult {
  tool: string;
  result: unknown;
  navigate_to?: string;
}

interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  id: string;
}

// searchApi may not be exported yet — define inline access via inventoryApi
async function executeSearchListings(input: Record<string, unknown>): Promise<unknown> {
  try {
    const res = await inventoryApi.getListings({
      search: String(input.query ?? ''),
      sector: input.sector as string | undefined,
      max_price: input.max_price as number | undefined,
      limit: (input.limit as number | undefined) ?? 5,
    });
    const rows = (res.data as { data?: unknown[] })?.data ?? [];
    return { listings: rows, count: rows.length };
  } catch {
    return { error: 'Search failed' };
  }
}

async function executeGetOrderStatus(input: Record<string, unknown>): Promise<unknown> {
  try {
    const id = String(input.order_id ?? input.order_number ?? '');
    const res = await ordersApi.getOrder(id);
    const data = (res.data as { data?: unknown })?.data ?? res.data;
    return data;
  } catch {
    return { error: 'Order not found' };
  }
}

async function executeGetMyListings(input: Record<string, unknown>): Promise<unknown> {
  try {
    const res = await inventoryApi.getMyListings({
      status: (input.status as string | undefined) ?? 'live',
      limit: (input.limit as number | undefined) ?? 10,
    });
    const data = (res.data as { data?: unknown[] })?.data ?? [];
    return { listings: data };
  } catch {
    return { error: 'Could not fetch listings' };
  }
}

function executeNavigateTo(input: Record<string, unknown>): unknown {
  const ROUTE_MAP: Record<string, string> = {
    home: '/',
    listings: '/listings',
    orders: '/orders',
    dashboard: '/dashboard',
    'seller-dashboard': '/seller/dashboard',
    'seller/dashboard': '/seller/dashboard',
    'seller/listings': '/seller/listings',
    'new-listing': '/seller/listings/new',
    notifications: '/notifications',
    referral: '/referral',
    profile: '/profile',
    disputes: '/orders',
  };
  const screen = String(input.screen ?? '').toLowerCase();
  const route = ROUTE_MAP[screen] ?? `/${screen}`;
  return { route, screen };
}

export async function executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  return Promise.all(
    toolCalls.map(async (tc) => {
      switch (tc.tool) {
        case 'search_listings': {
          const result = await executeSearchListings(tc.input);
          return { tool: tc.tool, result };
        }
        case 'get_order_status': {
          const result = await executeGetOrderStatus(tc.input);
          return { tool: tc.tool, result };
        }
        case 'get_my_listings': {
          const result = await executeGetMyListings(tc.input);
          return { tool: tc.tool, result };
        }
        case 'navigate_to': {
          const result = executeNavigateTo(tc.input);
          return { tool: tc.tool, result, navigate_to: (result as { route: string }).route };
        }
        case 'pause_listing':
          return { tool: tc.tool, result: { message: 'Please confirm in your listings page.' } };
        case 'raise_dispute':
          return { tool: tc.tool, result: { message: 'Opening dispute form...' }, navigate_to: '/orders' };
        case 'add_to_cart':
          return { tool: tc.tool, result: { message: 'Opening product page to add to cart...' }, navigate_to: `/listings/${tc.input.listing_id}` };
        case 'generate_marketing_content':
          return { tool: tc.tool, result: { message: 'Open the listing and use the Marketing Panel.' } };
        case 'get_platform_stats':
          return { tool: tc.tool, result: { message: 'Platform stats visible in admin dashboard.' }, navigate_to: '/admin' };
        case 'explain_document':
          return { tool: tc.tool, result: { message: 'Document explanation not yet available here.' } };
        default:
          return { tool: tc.tool, result: { message: `Tool "${tc.tool}" not supported yet.` } };
      }
    })
  );
}

export function formatToolResult(tool: string, result: unknown): string {
  const r = result as Record<string, unknown>;
  switch (tool) {
    case 'search_listings': {
      const listings = r.listings as Array<{ title?: string; asking_price?: number }> | undefined;
      if (!listings?.length) return 'No listings found.';
      return listings.slice(0, 3).map(l => `• ${l.title} — ₹${(l.asking_price ?? 0).toLocaleString('en-IN')}`).join('\n');
    }
    case 'get_order_status': {
      if (r.error) return String(r.error);
      return `Order #${r.order_number ?? r.id} — Status: ${r.status ?? 'unknown'}`;
    }
    case 'get_my_listings': {
      const listings = r.listings as Array<{ title?: string; status?: string }> | undefined;
      if (!listings?.length) return 'No listings found.';
      return listings.slice(0, 3).map(l => `• ${l.title} (${l.status})`).join('\n');
    }
    default:
      return r.message ? String(r.message) : JSON.stringify(result);
  }
}
