/**
 * Sprint 15 — Reseller Storefront
 * Public mini-catalogue for each seller, accessible at /s/:slug.
 * Prices shown can include a seller-set reseller margin.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticate, requireRole,
  query, queryOne,
  successResponse, errorResponse,
  logger,
} from '@nirmalmandi/shared';

export const storefrontRouter = Router();

// ── GET /storefront/:slug — public storefront ─────────────────────────────────

storefrontRouter.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(24, Math.max(1, parseInt(String(req.query.limit ?? '12'), 10)));
  const from  = (page - 1) * limit;

  const seller = await queryOne<{
    id: string; business_name: string; seller_slug: string;
    storefront_enabled: boolean; storefront_banner_url: string | null;
    storefront_tagline: string | null; reseller_margin_pct: number;
    verification_tier: string; city: string | null; state: string | null;
    total_gmv: number;
  }>(
    `SELECT id, business_name, seller_slug, storefront_enabled,
            storefront_banner_url, storefront_tagline, reseller_margin_pct,
            verification_tier, city, state, total_gmv
     FROM seller_profiles
     WHERE seller_slug = $1`,
    [slug]
  );

  if (!seller) return res.status(404).json(errorResponse('Storefront not found'));
  if (!seller.storefront_enabled) return res.status(404).json(errorResponse('Storefront is not active'));

  const marginMultiplier = 1 + (Number(seller.reseller_margin_pct ?? 0) / 100);

  const [listings, countRow] = await Promise.all([
    query<{
      id: string; title: string; asking_price: number; images: string[];
      condition_grade: string; available_quantity: number; sector_name: string;
      created_at: string;
    }>(
      `SELECT l.id, l.title,
              ROUND(l.asking_price * $1) as asking_price,
              l.images, l.condition_grade, l.available_quantity, l.created_at,
              s.name as sector_name
       FROM listings l
       JOIN sectors s ON s.id = l.sector_id
       WHERE l.seller_id = $2 AND l.status = 'live'
       ORDER BY l.created_at DESC
       LIMIT $3 OFFSET $4`,
      [marginMultiplier, seller.id, limit, from]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM listings WHERE seller_id = $1 AND status = 'live'`,
      [seller.id]
    ),
  ]);

  return res.json(successResponse({
    seller: {
      business_name: seller.business_name,
      slug: seller.seller_slug,
      banner_url: seller.storefront_banner_url,
      tagline: seller.storefront_tagline,
      verification_tier: seller.verification_tier,
      city: seller.city,
      state: seller.state,
      total_gmv: seller.total_gmv,
      reseller_margin_pct: seller.reseller_margin_pct,
    },
    listings,
    total: parseInt(countRow?.count ?? '0', 10),
    page,
    limit,
  }));
});

// ── GET /storefront/my/settings — seller reads their own storefront config ────

storefrontRouter.get('/my/settings', authenticate, requireRole('seller'), async (req: Request, res: Response) => {
  const row = await queryOne<{
    seller_slug: string | null; storefront_enabled: boolean;
    storefront_banner_url: string | null; storefront_tagline: string | null;
    reseller_margin_pct: number;
  }>(
    `SELECT seller_slug, storefront_enabled, storefront_banner_url,
            storefront_tagline, reseller_margin_pct
     FROM seller_profiles WHERE id = $1`,
    [req.user!.profile_id]
  );
  return res.json(successResponse(row));
});

// ── PATCH /storefront/my/settings — seller configures storefront ──────────────

const settingsSchema = z.object({
  seller_slug:          z.string().min(3).max(80).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens').optional(),
  storefront_enabled:   z.boolean().optional(),
  storefront_tagline:   z.string().max(200).optional(),
  reseller_margin_pct:  z.number().min(0).max(100).optional(),
});

storefrontRouter.patch('/my/settings', authenticate, requireRole('seller'), async (req: Request, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(errorResponse('Validation failed', 'VALIDATION_ERROR', parsed.error.issues));
  const data = parsed.data;

  // Check slug uniqueness if changing
  if (data.seller_slug) {
    const existing = await queryOne(
      `SELECT id FROM seller_profiles WHERE seller_slug = $1 AND id != $2`,
      [data.seller_slug, req.user!.profile_id]
    );
    if (existing) return res.status(409).json(errorResponse('That storefront URL is already taken'));
  }

  const setClauses: string[] = [];
  const values: unknown[]    = [];
  let i = 1;

  if (data.seller_slug         !== undefined) { setClauses.push(`seller_slug = $${i++}`);          values.push(data.seller_slug); }
  if (data.storefront_enabled  !== undefined) { setClauses.push(`storefront_enabled = $${i++}`);   values.push(data.storefront_enabled); }
  if (data.storefront_tagline  !== undefined) { setClauses.push(`storefront_tagline = $${i++}`);   values.push(data.storefront_tagline); }
  if (data.reseller_margin_pct !== undefined) { setClauses.push(`reseller_margin_pct = $${i++}`);  values.push(data.reseller_margin_pct); }

  if (setClauses.length === 0) return res.status(400).json(errorResponse('Nothing to update'));

  values.push(req.user!.profile_id);
  await queryOne(
    `UPDATE seller_profiles SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $${i} RETURNING seller_slug`,
    values
  );

  logger.info('Storefront settings updated', { sellerId: req.user!.profile_id });
  return res.json(successResponse({ updated: true }));
});
