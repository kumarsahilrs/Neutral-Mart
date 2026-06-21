/**
 * Sprint 16 — DPDP Act 2023 Consent Management
 * Digital Personal Data Protection Act 2023 (India) compliance.
 * Buyers/sellers must give explicit, granular, revocable consent.
 *
 * Purposes:
 *   transactional   — order processing, invoicing (required for service)
 *   marketing       — promotional messages, newsletters
 *   analytics       — usage analytics, behaviour tracking
 *   profiling       — personalisation, deal recommendations
 *   third_party     — sharing data with logistics partners, payment gateways
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticate,
  query, queryOne, withTransaction,
  successResponse, errorResponse,
  logger,
} from '@nirmalmandi/shared';

export const consentRouter = Router();

const PURPOSES = ['transactional', 'marketing', 'analytics', 'profiling', 'third_party'] as const;
type Purpose = typeof PURPOSES[number];
const CURRENT_VERSION = '1.0';

// ── POST /consent — grant or update consent ───────────────────────────────────

const grantSchema = z.object({
  consents: z.record(
    z.enum(PURPOSES),
    z.boolean()
  ),
});

consentRouter.post('/', authenticate, async (req: Request, res: Response) => {
  const parsed = grantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(errorResponse('Validation failed', 'VALIDATION_ERROR', parsed.error.issues));

  const { consents } = parsed.data;
  const ip = req.ip ?? req.socket.remoteAddress;
  const ua = req.headers['user-agent'] ?? '';
  const now = new Date();

  await withTransaction(async (client) => {
    for (const [purpose, granted] of Object.entries(consents) as [Purpose, boolean][]) {
      await client.query(
        `INSERT INTO consent_records (user_id, purpose, granted, version, ip_address, user_agent, granted_at, withdrawn_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, purpose) DO UPDATE SET
           granted = EXCLUDED.granted,
           version = EXCLUDED.version,
           ip_address = EXCLUDED.ip_address,
           user_agent = EXCLUDED.user_agent,
           granted_at = CASE WHEN EXCLUDED.granted THEN EXCLUDED.granted_at ELSE consent_records.granted_at END,
           withdrawn_at = CASE WHEN NOT EXCLUDED.granted THEN EXCLUDED.granted_at ELSE NULL END`,
        [req.user!.sub, purpose, granted, CURRENT_VERSION, ip, ua,
         granted ? now : null, granted ? null : now]
      );
    }

    // If transactional consent given, record DPDP acceptance on user
    if (consents.transactional) {
      await client.query(
        `UPDATE users SET dpdp_consent_version = $1, dpdp_consent_at = NOW() WHERE id = $2`,
        [CURRENT_VERSION, req.user!.sub]
      );
    }
  });

  logger.info('Consent updated', { userId: req.user!.sub, consents });
  return res.json(successResponse({ updated: true, version: CURRENT_VERSION }));
});

// ── GET /consent/my — fetch user's current consent record ────────────────────

consentRouter.get('/my', authenticate, async (req: Request, res: Response) => {
  const records = await query<{ purpose: string; granted: boolean; granted_at: string | null; withdrawn_at: string | null; version: string }>(
    `SELECT purpose, granted, granted_at, withdrawn_at, version
     FROM consent_records
     WHERE user_id = $1
     ORDER BY purpose ASC`,
    [req.user!.sub]
  );

  // Build map with defaults (all false if not recorded yet)
  const consentMap = Object.fromEntries(PURPOSES.map(p => [p, false]));
  for (const r of records) consentMap[r.purpose] = r.granted;

  return res.json(successResponse({
    consents: consentMap,
    records,
    dpdp_version: CURRENT_VERSION,
  }));
});

// ── DELETE /consent/:purpose — withdraw specific consent ─────────────────────

consentRouter.delete('/:purpose', authenticate, async (req: Request, res: Response) => {
  const purpose = req.params.purpose as Purpose;
  if (!PURPOSES.includes(purpose)) return res.status(400).json(errorResponse('Invalid purpose'));
  if (purpose === 'transactional') {
    return res.status(400).json(errorResponse('Transactional consent is required for service access and cannot be withdrawn'));
  }

  await query(
    `UPDATE consent_records
     SET granted = false, withdrawn_at = NOW()
     WHERE user_id = $1 AND purpose = $2`,
    [req.user!.sub, purpose]
  );

  logger.info('Consent withdrawn', { userId: req.user!.sub, purpose });
  return res.json(successResponse({ withdrawn: true, purpose }));
});

// ── GET /consent/status/:userId — admin check if user has given base consent ─

consentRouter.get('/status/:userId', authenticate, async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') return res.status(403).json(errorResponse('Forbidden'));

  const row = await queryOne<{ dpdp_consent_version: string | null; dpdp_consent_at: string | null }>(
    `SELECT dpdp_consent_version, dpdp_consent_at FROM users WHERE id = $1`,
    [req.params.userId]
  );

  return res.json(successResponse({
    has_consent: !!row?.dpdp_consent_version,
    version: row?.dpdp_consent_version,
    consented_at: row?.dpdp_consent_at,
  }));
});
