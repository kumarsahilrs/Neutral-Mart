/**
 * Sprint 16 — E2E Integration Tests: Auth Flow
 * Tests the full OTP → register → JWT → protected route flow against a real DB.
 * Run with: TEST_DATABASE_URL=postgresql://... npm test
 *
 * Skipped in CI unless TEST_DATABASE_URL is set (avoids running without infra).
 */

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
const SKIP = !process.env.TEST_DATABASE_URL;

// Use fetch (Node 18+)
async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(`${AUTH_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function get(path: string, token: string) {
  const res = await fetch(`${AUTH_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: await res.json() };
}

const TEST_PHONE = '+919900000001'; // use a dedicated test number

describe('Auth Flow — OTP → Register → JWT → Protected Route', () => {
  if (SKIP) {
    it.skip('skipped: TEST_DATABASE_URL not set', () => {});
    return;
  }

  let accessToken = '';
  let refreshToken = '';

  it('POST /auth/otp/send returns success', async () => {
    const { status, data } = await post('/auth/otp/send', { phone: TEST_PHONE });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
  }, 10_000);

  it('POST /auth/otp/verify with dev OTP (000000) returns tokens', async () => {
    // Dev mode: OTP is logged to console, accepts 000000 when NODE_ENV=test
    const { status, data } = await post('/auth/otp/verify', {
      phone: TEST_PHONE,
      otp: '000000',
    });
    expect(status).toBe(200);
    expect(data.data).toHaveProperty('access_token');
    expect(data.data).toHaveProperty('refresh_token');
    expect(data.data.user).toHaveProperty('role');
    accessToken  = data.data.access_token;
    refreshToken = data.data.refresh_token;
  }, 10_000);

  it('GET /profile returns user data with valid token', async () => {
    const { status, data } = await get('/profile', accessToken);
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('phone', TEST_PHONE);
  }, 10_000);

  it('GET /profile returns 401 with no token', async () => {
    const res = await fetch(`${AUTH_URL}/profile`);
    expect(res.status).toBe(401);
  }, 10_000);

  it('GET /profile returns 401 with tampered token', async () => {
    const { status } = await get('/profile', `${accessToken}INVALID`);
    expect(status).toBe(401);
  }, 10_000);

  it('POST /auth/refresh returns new access token', async () => {
    const { status, data } = await post('/auth/refresh', { refresh_token: refreshToken });
    expect(status).toBe(200);
    expect(data.data).toHaveProperty('access_token');
  }, 10_000);

  it('POST /consent grants transactional consent', async () => {
    const { status, data } = await post('/consent', {
      consents: { transactional: true, marketing: false, analytics: true, profiling: false, third_party: false },
    }, accessToken);
    expect(status).toBe(200);
    expect(data.data.updated).toBe(true);
  }, 10_000);

  it('GET /consent/my returns consent record', async () => {
    const { status, data } = await get('/consent/my', accessToken);
    expect(status).toBe(200);
    expect(data.data.consents.transactional).toBe(true);
    expect(data.data.consents.marketing).toBe(false);
  }, 10_000);
});
