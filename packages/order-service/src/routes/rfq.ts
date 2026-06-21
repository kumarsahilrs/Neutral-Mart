/**
 * Sprint 13 — RFQ (Request for Quotation) System
 * Buyers request bulk quotes from sellers; sellers respond with price + terms.
 * Accepted quotes auto-place an order.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import {
  authenticate, requireRole,
  query, queryOne, withTransaction,
  successResponse, errorResponse,
  generateOrderNumber,
  logger,
} from '@nirmalmandi/shared';

export const rfqRouter = Router();

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
const SERVICE_SECRET   = process.env.INTERNAL_SERVICE_SECRET   || 'dev-secret';

async function notify(userId: string, templateKey: string, variables: string[]) {
  await axios.post(`${NOTIFICATION_URL}/notifications/send`, {
    userId, channel: 'all', templateKey, variables,
  }, { headers: { 'x-service-secret': SERVICE_SECRET } }).catch(() => {});
}

// ── POST /rfq — buyer submits an RFQ ────────────────────────────────────────

const createRfqSchema = z.object({
  listing_id:   z.string().uuid(),
  quantity:     z.number().int().positive(),
  target_price: z.number().positive().optional(),
  message:      z.string().max(500).optional(),
});

rfqRouter.post('/', authenticate, requireRole('buyer'), async (req: Request, res: Response) => {
  const parsed = createRfqSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(errorResponse('Validation failed', 'VALIDATION_ERROR', parsed.error.issues));
  const { listing_id, quantity, target_price, message } = parsed.data;

  const listing = await queryOne<{
    id: string; seller_id: string; title: string; status: string;
    available_quantity: number; moq: number; seller_user_id: string;
  }>(
    `SELECT l.id, l.seller_id, l.title, l.status, l.available_quantity, l.moq,
            sp.user_id AS seller_user_id
     FROM listings l
     JOIN seller_profiles sp ON sp.id = l.seller_id
     WHERE l.id = $1`,
    [listing_id]
  );
  if (!listing) return res.status(404).json(errorResponse('Listing not found'));
  if (listing.status !== 'live') return res.status(409).json(errorResponse('Listing is not available'));
  if (quantity < (listing.moq ?? 1)) return res.status(400).json(errorResponse(`Minimum order quantity is ${listing.moq ?? 1}`));

  const rfqId = uuidv4();
  await query(
    `INSERT INTO rfqs (id, buyer_id, seller_id, listing_id, quantity, target_price, message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [rfqId, req.user!.profile_id, listing.seller_id, listing_id, quantity, target_price ?? null, message ?? null]
  );

  await notify(listing.seller_user_id, 'RFQ_RECEIVED', [listing.title, String(quantity)]);

  logger.info('RFQ created', { rfqId, listingId: listing_id, buyerId: req.user!.profile_id });
  return res.status(201).json(successResponse({ rfqId }, 'RFQ submitted. The seller will respond within 24 hours.'));
});

// ── GET /rfq/my — buyer's own RFQs ──────────────────────────────────────────

rfqRouter.get('/my', authenticate, requireRole('buyer'), async (req: Request, res: Response) => {
  const rows = await query(
    `SELECT r.id, r.quantity, r.target_price, r.message, r.status, r.expires_at, r.created_at,
            l.title AS listing_title, l.asking_price,
            rr.quoted_price, rr.min_quantity, rr.message AS seller_message, rr.valid_until
     FROM rfqs r
     JOIN listings l ON l.id = r.listing_id
     LEFT JOIN rfq_responses rr ON rr.rfq_id = r.id
     WHERE r.buyer_id = $1
     ORDER BY r.created_at DESC`,
    [req.user!.profile_id]
  );
  return res.json(successResponse(rows));
});

// ── GET /rfq/seller — seller's incoming RFQs ─────────────────────────────────

rfqRouter.get('/seller', authenticate, requireRole('seller'), async (req: Request, res: Response) => {
  const rows = await query(
    `SELECT r.id, r.quantity, r.target_price, r.message, r.status, r.expires_at, r.created_at,
            l.title AS listing_title, l.asking_price, l.available_quantity,
            bp.business_name AS buyer_company,
            rr.quoted_price, rr.valid_until
     FROM rfqs r
     JOIN listings l ON l.id = r.listing_id
     JOIN buyer_profiles bp ON bp.id = r.buyer_id
     LEFT JOIN rfq_responses rr ON rr.rfq_id = r.id
     WHERE r.seller_id = $1
     ORDER BY r.created_at DESC`,
    [req.user!.profile_id]
  );
  return res.json(successResponse(rows));
});

// ── PATCH /rfq/:id/respond — seller quotes a price ───────────────────────────

const respondSchema = z.object({
  quoted_price: z.number().positive(),
  min_quantity: z.number().int().positive().optional(),
  message:      z.string().max(500).optional(),
  valid_hours:  z.number().int().min(12).max(168).default(48),
});

rfqRouter.patch('/:id/respond', authenticate, requireRole('seller'), async (req: Request, res: Response) => {
  const parsed = respondSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(errorResponse('Validation failed', 'VALIDATION_ERROR', parsed.error.issues));

  const rfq = await queryOne<{ id: string; seller_id: string; buyer_id: string; status: string; listing_title: string; buyer_user_id: string }>(
    `SELECT r.id, r.seller_id, r.buyer_id, r.status,
            l.title AS listing_title,
            bp.user_id AS buyer_user_id
     FROM rfqs r
     JOIN listings l ON l.id = r.listing_id
     JOIN buyer_profiles bp ON bp.id = r.buyer_id
     WHERE r.id = $1`,
    [req.params.id]
  );
  if (!rfq) return res.status(404).json(errorResponse('RFQ not found'));
  if (rfq.seller_id !== req.user!.profile_id) return res.status(403).json(errorResponse('Forbidden'));
  if (rfq.status !== 'pending') return res.status(409).json(errorResponse('RFQ is no longer pending'));

  const { quoted_price, min_quantity, message, valid_hours } = parsed.data;
  const validUntil = new Date(Date.now() + valid_hours * 3600_000);

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO rfq_responses (id, rfq_id, quoted_price, min_quantity, message, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), rfq.id, quoted_price, min_quantity ?? null, message ?? null, validUntil]
    );
    await client.query(`UPDATE rfqs SET status = 'quoted', updated_at = NOW() WHERE id = $1`, [rfq.id]);
  });

  await notify(rfq.buyer_user_id, 'RFQ_QUOTED', [rfq.listing_title, `₹${quoted_price}`]);

  return res.json(successResponse({ quoted: true, valid_until: validUntil }));
});

// ── PATCH /rfq/:id/accept — buyer accepts the quote → places order ────────────

rfqRouter.patch('/:id/accept', authenticate, requireRole('buyer'), async (req: Request, res: Response) => {
  const rfq = await queryOne<{
    id: string; buyer_id: string; seller_id: string; listing_id: string;
    quantity: number; status: string; listing_title: string;
    quoted_price: number; seller_user_id: string;
  }>(
    `SELECT r.id, r.buyer_id, r.seller_id, r.listing_id, r.quantity, r.status,
            l.title AS listing_title,
            rr.quoted_price,
            sp.user_id AS seller_user_id
     FROM rfqs r
     JOIN listings l ON l.id = r.listing_id
     JOIN rfq_responses rr ON rr.rfq_id = r.id
     JOIN seller_profiles sp ON sp.id = r.seller_id
     WHERE r.id = $1`,
    [req.params.id]
  );
  if (!rfq) return res.status(404).json(errorResponse('RFQ not found'));
  if (rfq.buyer_id !== req.user!.profile_id) return res.status(403).json(errorResponse('Forbidden'));
  if (rfq.status !== 'quoted') return res.status(409).json(errorResponse('No active quote to accept'));

  const orderId   = uuidv4();
  const orderNum  = generateOrderNumber();
  const unitPrice = rfq.quoted_price;
  const total     = unitPrice * rfq.quantity;

  await withTransaction(async (client) => {
    // Place the order directly at negotiated price
    await client.query(
      `INSERT INTO orders
         (id, order_number, buyer_id, seller_id, listing_id, quantity, unit_price,
          total_amount, status, rfq_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending_payment',$9,NOW(),NOW())`,
      [orderId, orderNum, rfq.buyer_id, rfq.seller_id, rfq.listing_id,
       rfq.quantity, unitPrice, total, rfq.id]
    );
    await client.query(`UPDATE rfqs SET status = 'ordered', updated_at = NOW() WHERE id = $1`, [rfq.id]);
  });

  await notify(rfq.seller_user_id, 'RFQ_ACCEPTED', [rfq.listing_title, orderNum]);

  return res.status(201).json(successResponse({ orderId, orderNumber: orderNum, total }, 'Quote accepted — proceed to payment.'));
});

// ── PATCH /rfq/:id/reject — seller rejects ───────────────────────────────────

rfqRouter.patch('/:id/reject', authenticate, requireRole('seller'), async (req: Request, res: Response) => {
  const rfq = await queryOne<{ seller_id: string; status: string; buyer_user_id: string; listing_title: string }>(
    `SELECT r.seller_id, r.status, l.title AS listing_title, bp.user_id AS buyer_user_id
     FROM rfqs r
     JOIN listings l ON l.id = r.listing_id
     JOIN buyer_profiles bp ON bp.id = r.buyer_id
     WHERE r.id = $1`,
    [req.params.id]
  );
  if (!rfq) return res.status(404).json(errorResponse('RFQ not found'));
  if (rfq.seller_id !== req.user!.profile_id) return res.status(403).json(errorResponse('Forbidden'));
  if (!['pending', 'quoted'].includes(rfq.status)) return res.status(409).json(errorResponse('Cannot reject this RFQ'));

  await query(`UPDATE rfqs SET status = 'rejected', updated_at = NOW() WHERE id = $1`, [req.params.id]);
  await notify(rfq.buyer_user_id, 'RFQ_REJECTED', [rfq.listing_title]);

  return res.json(successResponse({ rejected: true }));
});
