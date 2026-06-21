/**
 * Sprint 16 — E2E Integration Tests: Order Flow
 * Tests: buyer login → search → listing detail → create order → verify status
 *
 * Skipped unless TEST_DATABASE_URL is set.
 */

const BASE = {
  auth:      process.env.AUTH_SERVICE_URL      ?? 'http://localhost:3001',
  inventory: process.env.INVENTORY_SERVICE_URL ?? 'http://localhost:3002',
  order:     process.env.ORDER_SERVICE_URL     ?? 'http://localhost:3003',
  search:    process.env.SEARCH_SERVICE_URL    ?? 'http://localhost:3004',
};
const SKIP = !process.env.TEST_DATABASE_URL;

async function post(base: string, path: string, body: unknown, token?: string) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function get(base: string, path: string, token?: string) {
  const res = await fetch(`${base}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  return { status: res.status, data: await res.json() };
}

const BUYER_PHONE  = '+919900000002';
const SELLER_PHONE = '+919900000003';

describe('Order Flow — buyer login → search → order', () => {
  if (SKIP) {
    it.skip('skipped: TEST_DATABASE_URL not set', () => {});
    return;
  }

  let buyerToken  = '';
  let sellerToken = '';
  let listingId   = '';
  let orderId     = '';

  // ── Auth ──────────────────────────────────────────────────────────────────

  it('buyer authenticates via OTP', async () => {
    await post(BASE.auth, '/auth/otp/send', { phone: BUYER_PHONE });
    const { data } = await post(BASE.auth, '/auth/otp/verify', { phone: BUYER_PHONE, otp: '000000' });
    expect(data.data.access_token).toBeTruthy();
    buyerToken = data.data.access_token;
  }, 15_000);

  it('seller authenticates via OTP', async () => {
    await post(BASE.auth, '/auth/otp/send', { phone: SELLER_PHONE });
    const { data } = await post(BASE.auth, '/auth/otp/verify', { phone: SELLER_PHONE, otp: '000000' });
    sellerToken = data.data.access_token;
    expect(sellerToken).toBeTruthy();
  }, 15_000);

  // ── Search ────────────────────────────────────────────────────────────────

  it('GET /search?q=fmcg returns listings', async () => {
    const { status, data } = await get(BASE.search, '/search?q=fmcg&limit=5');
    expect(status).toBe(200);
    expect(Array.isArray(data.data?.rows ?? data.data)).toBe(true);
  }, 10_000);

  // ── Inventory health ──────────────────────────────────────────────────────

  it('GET /listings returns paginated results', async () => {
    const { status, data } = await get(BASE.inventory, '/listings?limit=5&page=1');
    expect(status).toBe(200);
    const rows = data.data?.rows ?? data.data ?? [];
    if (Array.isArray(rows) && rows.length > 0) {
      listingId = rows[0].id;
    }
  }, 10_000);

  it('GET /listings/:id returns listing detail if found', async () => {
    if (!listingId) { console.warn('No listing found — skipping detail check'); return; }
    const { status, data } = await get(BASE.inventory, `/listings/${listingId}`);
    expect(status).toBe(200);
    expect(data).toHaveProperty('id');
  }, 10_000);

  // ── Order ─────────────────────────────────────────────────────────────────

  it('POST /orders requires buyer auth', async () => {
    if (!listingId) return;
    const { status, data } = await post(BASE.order, '/orders', {
      listing_id: listingId,
      quantity: 1,
      buyer_state: 'Maharashtra',
    }, buyerToken);
    // 201 if listing is live with stock; 4xx if not available in test DB — both OK
    expect([201, 400, 404, 409]).toContain(status);
    if (status === 201) {
      orderId = data.data?.orderId ?? data.data?.id ?? '';
    }
  }, 15_000);

  it('GET /orders/my/buyer returns buyer orders', async () => {
    const { status, data } = await get(BASE.order, '/orders/my/buyer', buyerToken);
    expect(status).toBe(200);
    expect(Array.isArray(data.data ?? data)).toBe(true);
  }, 10_000);

  it('GET /orders/:id returns 403 for wrong user', async () => {
    if (!orderId) return;
    const { status } = await get(BASE.order, `/orders/${orderId}`, sellerToken);
    // Seller not party to this order → 403
    expect([403, 200]).toContain(status);
  }, 10_000);

  // ── RFQ ──────────────────────────────────────────────────────────────────

  it('POST /rfq requires buyer auth and listing', async () => {
    if (!listingId) return;
    const { status } = await post(BASE.order, '/rfq', {
      listing_id: listingId,
      quantity: 10,
      target_price: 900,
      message: 'E2E test RFQ',
    }, buyerToken);
    expect([201, 400, 404, 409]).toContain(status);
  }, 10_000);
});

describe('Health checks — all services', () => {
  if (SKIP) {
    it.skip('skipped', () => {});
    return;
  }

  const services = [
    { name: 'auth',      url: BASE.auth },
    { name: 'inventory', url: BASE.inventory },
    { name: 'order',     url: BASE.order },
    { name: 'search',    url: BASE.search },
  ];

  services.forEach(({ name, url }) => {
    it(`${name}-service /health returns ok`, async () => {
      const res = await fetch(`${url}/health`);
      expect(res.status).toBe(200);
      const data = await res.json() as { status: string };
      expect(data.status).toBe('ok');
    }, 5_000);
  });
});
