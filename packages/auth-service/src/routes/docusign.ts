/**
 * Sprint 16 — DocuSign Seller E-signature
 * Seller signs the NirmalMandi Merchant Agreement during registration.
 * Flow: POST /esign/initiate → DocuSign creates envelope → returns embedded signing URL
 *       → seller signs in iframe → DocuSign webhook calls POST /esign/webhook → marks signed
 *
 * Requires env vars: DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID,
 *                    DOCUSIGN_PRIVATE_KEY (RSA JWT flow), DOCUSIGN_TEMPLATE_ID
 */
import { Router, Request, Response } from 'express';
import {
  authenticate, requireRole,
  query, queryOne,
  successResponse, errorResponse,
  logger,
} from '@nirmalmandi/shared';

export const docusignRouter = Router();

const DS_BASE    = process.env.DOCUSIGN_BASE_URL   || 'https://demo.docusign.net/restapi';
const ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID || '';
const TEMPLATE_ID = process.env.DOCUSIGN_TEMPLATE_ID || '';
const DS_SECRET   = process.env.DOCUSIGN_WEBHOOK_SECRET || 'dev-ds-secret';

// Get DocuSign access token via JWT grant (RS256 private key)
async function getAccessToken(): Promise<string> {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const userId         = process.env.DOCUSIGN_USER_ID;
  const privateKey     = process.env.DOCUSIGN_PRIVATE_KEY ?? '';
  if (!integrationKey || !userId || !privateKey) {
    throw new Error('DocuSign not configured. Set DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_PRIVATE_KEY.');
  }

  const jwt = require('jsonwebtoken');
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign({
    iss: integrationKey,
    sub: userId,
    aud: 'account-d.docusign.com',
    iat: now,
    exp: now + 3600,
    scope: 'signature impersonation',
  }, Buffer.from(privateKey, 'base64').toString(), { algorithm: 'RS256' });

  const res = await fetch('https://account-d.docusign.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });
  const json = await res.json() as { access_token?: string };
  if (!json.access_token) throw new Error('DocuSign auth failed');
  return json.access_token;
}

// ── POST /esign/initiate — create envelope + return signing URL ──────────────

docusignRouter.post('/initiate', authenticate, requireRole('seller'), async (req: Request, res: Response) => {
  const seller = await queryOne<{ business_name: string; user_phone: string; user_email: string; docusign_status: string }>(
    `SELECT sp.business_name, u.phone AS user_phone,
            COALESCE(u.email, u.phone || '@nirmalmandi.in') AS user_email,
            COALESCE(sp.docusign_status, 'not_sent') AS docusign_status
     FROM seller_profiles sp
     JOIN users u ON u.id = sp.user_id
     WHERE sp.id = $1`,
    [req.user!.profile_id]
  );
  if (!seller) return res.status(404).json(errorResponse('Seller profile not found'));
  if (seller.docusign_status === 'signed') return res.json(successResponse({ already_signed: true }));

  const returnUrl = `${process.env.WEB_URL || 'http://localhost:3010'}/seller/register?esign=done`;

  try {
    const token = await getAccessToken();

    // Create envelope from template
    const envelopeRes = await fetch(`${DS_BASE}/v2.1/accounts/${ACCOUNT_ID}/envelopes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: TEMPLATE_ID,
        status: 'sent',
        templateRoles: [{
          email: seller.user_email,
          name: seller.business_name,
          roleName: 'Seller',
        }],
      }),
    });
    const envelope = await envelopeRes.json() as { envelopeId?: string };
    if (!envelope.envelopeId) throw new Error('DocuSign envelope creation failed');

    // Get embedded signing URL
    const viewRes = await fetch(
      `${DS_BASE}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelope.envelopeId}/views/recipient`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authenticationMethod: 'none',
          email: seller.user_email,
          userName: seller.business_name,
          returnUrl,
        }),
      }
    );
    const viewData = await viewRes.json() as { url?: string };

    // Save envelope ID
    await query(
      `UPDATE seller_profiles SET docusign_envelope_id = $1, docusign_status = 'sent' WHERE id = $2`,
      [envelope.envelopeId, req.user!.profile_id]
    );

    logger.info('DocuSign envelope created', { envelopeId: envelope.envelopeId, sellerId: req.user!.profile_id });
    return res.json(successResponse({ signing_url: viewData.url, envelope_id: envelope.envelopeId }));
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('not configured')) {
      return res.status(503).json(errorResponse('E-signature not available in this environment.'));
    }
    logger.error('DocuSign error', { error: msg });
    return res.status(500).json(errorResponse('E-signature initiation failed'));
  }
});

// ── POST /esign/webhook — DocuSign event webhook ─────────────────────────────

docusignRouter.post('/webhook', async (req: Request, res: Response) => {
  // Verify DocuSign HMAC signature
  const sig = req.headers['x-docusign-signature-1'] as string;
  if (sig !== DS_SECRET && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = req.body as {
    event?: string;
    data?: { envelopeSummary?: { envelopeId?: string; status?: string } };
  };
  const status   = body?.data?.envelopeSummary?.status;
  const envelopeId = body?.data?.envelopeSummary?.envelopeId;

  if (!envelopeId) return res.status(200).json({ ok: true });

  if (status === 'completed') {
    await query(
      `UPDATE seller_profiles SET docusign_status = 'signed', updated_at = NOW()
       WHERE docusign_envelope_id = $1`,
      [envelopeId]
    );
    // Also stamp user esignature_at
    await query(
      `UPDATE users SET esignature_at = NOW()
       WHERE id = (
         SELECT user_id FROM seller_profiles WHERE docusign_envelope_id = $1
       )`,
      [envelopeId]
    );
    logger.info('DocuSign envelope signed', { envelopeId });
  } else if (status === 'declined' || status === 'voided') {
    await query(
      `UPDATE seller_profiles SET docusign_status = $1, updated_at = NOW()
       WHERE docusign_envelope_id = $2`,
      [status, envelopeId]
    );
  }

  return res.status(200).json({ ok: true });
});

// ── GET /esign/status — seller checks their own signing status ───────────────

docusignRouter.get('/status', authenticate, requireRole('seller'), async (req: Request, res: Response) => {
  const row = await queryOne<{ docusign_status: string; docusign_envelope_id: string | null }>(
    `SELECT docusign_status, docusign_envelope_id FROM seller_profiles WHERE id = $1`,
    [req.user!.profile_id]
  );
  return res.json(successResponse({ status: row?.docusign_status ?? 'not_sent', envelope_id: row?.docusign_envelope_id }));
});
