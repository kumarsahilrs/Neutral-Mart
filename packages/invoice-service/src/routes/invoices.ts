/**
 * Invoice service routes.
 * Generates GST-compliant PDF invoices and stores them on S3.
 * Triggered after payment captured webhook or on admin demand.
 */
import { Router, Request, Response } from 'express';
import {
  authenticate, requireRole,
  query, queryOne, withTransaction,
  generateInvoiceNumber,
  successResponse, errorResponse,
  logger,
} from '@nirmalmandi/shared';
import { generateGstInvoice, InvoiceData } from '../services/generator';

export const invoicesRouter = Router();

// ── POST /invoices/generate ─────────────────────────────────────
// Called by payment-service after payment.captured webhook.
const SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'dev-secret';

invoicesRouter.post('/generate', async (req: Request, res: Response) => {
  const isInternal = req.headers['x-service-secret'] === SERVICE_SECRET;
  if (!isInternal) return res.status(403).json(errorResponse('Forbidden'));

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json(errorResponse('orderId required'));

  // Fetch all data needed for invoice
  const order = await queryOne<{
    id: string; order_number: string; total_amount: number; created_at: string;
    seller_name: string; seller_gstin: string; seller_address: string; seller_state: string;
    buyer_name: string; buyer_gstin: string; buyer_address: string; buyer_state: string;
    listing_title: string; hsn_code: string; quantity: number; unit: string; unit_price: number;
    sector_slug: string; commission_amount: number; tcs_amount: number; net_payout: number;
    invoice_url: string | null;
  }>(
    `SELECT o.id, o.order_number, o.total_amount, o.created_at,
            sp.business_name as seller_name, sp.gstin as seller_gstin,
            CONCAT(sp.city, ', ', sp.state) as seller_address, sp.state as seller_state,
            COALESCE(bp.company_name, u_b.full_name) as buyer_name,
            bp.gstin as buyer_gstin,
            CONCAT(bp.city, ', ', bp.state) as buyer_address, bp.state as buyer_state,
            l.title as listing_title, COALESCE(l.hsn_code, '9999') as hsn_code,
            o.quantity, 'Units' as unit, l.asking_price as unit_price,
            sec.slug as sector_slug,
            ea.commission_amount, ea.tcs_amount, ea.net_payout,
            o.invoice_url
     FROM orders o
     JOIN listings l ON o.listing_id = l.id
     JOIN sectors sec ON l.sector_id = sec.id
     JOIN seller_profiles sp ON o.seller_id = sp.id
     JOIN buyer_profiles bp ON o.buyer_id = bp.id
     JOIN users u_b ON bp.id = u_b.id
     LEFT JOIN escrow_accounts ea ON o.escrow_id = ea.id
     WHERE o.id = $1`,
    [orderId]
  );

  if (!order) return res.status(404).json(errorResponse('Order not found'));
  if (order.invoice_url) return res.json(successResponse({ invoiceUrl: order.invoice_url, cached: true }));

  // Get next invoice sequence number
  const seqRow = await queryOne<{ nextval: string }>(
    `SELECT nextval('invoice_seq')::text as nextval`
  );
  const invoiceNumber = generateInvoiceNumber(parseInt(seqRow!.nextval));
  const invoiceDate = new Date(order.created_at).toISOString().split('T')[0];

  // Determine GST rate for sector
  const GST_RATES: Record<string, number> = {
    automobiles: 28, clothing: 5, fmcg: 12, pharma: 12, furniture: 18, software: 18, machinery: 18,
  };
  const gstRate = GST_RATES[order.sector_slug] ?? 18;

  const invoiceData: InvoiceData = {
    invoiceNumber,
    invoiceDate,
    orderId: order.id,
    orderNumber: order.order_number,
    sellerName: order.seller_name,
    sellerGstin: order.seller_gstin,
    sellerAddress: order.seller_address,
    sellerState: order.seller_state,
    buyerName: order.buyer_name,
    buyerGstin: order.buyer_gstin,
    buyerAddress: order.buyer_address,
    buyerState: order.buyer_state,
    items: [{
      description: order.listing_title,
      hsn: order.hsn_code,
      quantity: order.quantity,
      unit: order.unit,
      unitPrice: order.unit_price,
      gstRate,
    }],
    platformName: 'NirmalMandi (Amalthea Consultancy)',
    platformGstin: process.env.PLATFORM_GSTIN || '27AABCA1234A1Z5',
    commissionAmount: order.commission_amount,
    commissionGstRate: 18, // GST on commission is always 18%
    tcsAmount: order.tcs_amount,
    netPayoutToSeller: order.net_payout,
  };

  try {
    const invoiceUrl = await generateGstInvoice(invoiceData);

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE orders SET invoice_url = $1, invoice_number = $2, updated_at = NOW() WHERE id = $3`,
        [invoiceUrl, invoiceNumber, orderId]
      );
      await client.query(
        `INSERT INTO invoices (id, order_id, invoice_number, invoice_date, seller_id, buyer_id,
           total_amount, commission_amount, tcs_amount, invoice_url, created_at)
         SELECT gen_random_uuid(), $1, $2, $3, seller_id, buyer_id,
           $4, $5, $6, $7, NOW()
         FROM orders WHERE id = $1`,
        [orderId, invoiceNumber, invoiceDate, order.total_amount,
         order.commission_amount, order.tcs_amount, invoiceUrl]
      );
    });

    return res.json(successResponse({ invoiceUrl, invoiceNumber }));
  } catch (err: any) {
    logger.error('Invoice generation failed', { orderId, error: err.message });
    return res.status(500).json(errorResponse('Invoice generation failed'));
  }
});

// ── GET /invoices/:orderId ───────────────────────────────────────
invoicesRouter.get('/:orderId', authenticate, async (req: Request, res: Response) => {
  const order = await queryOne<{
    buyer_id: string; seller_id: string; invoice_url: string | null; invoice_number: string | null;
  }>(
    'SELECT buyer_id, seller_id, invoice_url, invoice_number FROM orders WHERE id = $1',
    [req.params.orderId]
  );
  if (!order) return res.status(404).json(errorResponse('Order not found'));

  const isParty = [order.buyer_id, order.seller_id].includes(req.user!.profile_id);
  const isAdmin = req.user!.role === 'admin';
  if (!isParty && !isAdmin) return res.status(403).json(errorResponse('Forbidden'));
  if (!order.invoice_url) return res.status(404).json(errorResponse('Invoice not yet generated'));

  return res.json(successResponse({
    invoiceNumber: order.invoice_number,
    invoiceUrl: order.invoice_url,
  }));
});

// ── POST /invoices/po/:orderId — generate Purchase Order PDF ─────

invoicesRouter.post('/po/:orderId', authenticate, async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await queryOne<{
    id: string; order_number: string; buyer_id: string; seller_id: string;
    quantity: number; unit_price: number; total_amount: number; created_at: string;
    buyer_name: string; buyer_gstin: string; buyer_address: string; buyer_phone: string;
    seller_name: string; seller_gstin: string; seller_address: string;
    listing_title: string; hsn_code: string; po_url: string | null;
  }>(
    `SELECT o.id, o.order_number, o.buyer_id, o.seller_id,
            o.quantity, o.unit_price, o.total_amount, o.created_at,
            COALESCE(bp.business_name, ub.full_name) AS buyer_name,
            COALESCE(bp.gst_number,'') AS buyer_gstin,
            ub.phone AS buyer_address,
            ub.phone AS buyer_phone,
            sp.business_name AS seller_name,
            COALESCE(sp.gstin,'') AS seller_gstin,
            CONCAT(COALESCE(sp.city,''), ', ', COALESCE(sp.state,'')) AS seller_address,
            l.title AS listing_title,
            COALESCE(l.hsn_code,'9999') AS hsn_code,
            o.po_url
     FROM orders o
     JOIN listings l ON o.listing_id = l.id
     JOIN buyer_profiles bp ON bp.id = o.buyer_id
     JOIN users ub ON ub.id = bp.user_id
     JOIN seller_profiles sp ON sp.id = o.seller_id
     WHERE o.id = $1`,
    [orderId]
  );
  if (!order) return res.status(404).json(errorResponse('Order not found'));

  const isParty = [order.buyer_id, order.seller_id].includes(req.user!.profile_id);
  const isAdmin = req.user!.role === 'admin';
  if (!isParty && !isAdmin) return res.status(403).json(errorResponse('Forbidden'));

  // Return cached URL if already generated
  if (order.po_url) return res.json(successResponse({ poUrl: order.po_url }));

  const { generatePurchaseOrder } = await import('../services/poGenerator');
  const poNumber = `PO-${order.order_number}`;
  const poDate = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const poUrl = await generatePurchaseOrder({
    poNumber,
    poDate,
    orderId: order.id,
    orderNumber: order.order_number,
    buyerName: order.buyer_name,
    buyerGstin: order.buyer_gstin || undefined,
    buyerAddress: order.buyer_address,
    buyerContact: order.buyer_phone,
    sellerName: order.seller_name,
    sellerGstin: order.seller_gstin || undefined,
    sellerAddress: order.seller_address,
    item: {
      description: order.listing_title,
      hsn: order.hsn_code,
      quantity: order.quantity,
      unit: 'Units',
      unitPrice: order.unit_price,
      totalPrice: order.total_amount,
    },
    paymentTerms: 'Advance via NirmalMandi Escrow',
    notes: 'This PO is governed by NirmalMandi platform terms. Delivery to be arranged by seller.',
  });

  // Cache the URL on the order
  await query(`UPDATE orders SET po_url = $1 WHERE id = $2`, [poUrl, orderId]);

  logger.info('PO generated', { orderId, poNumber });
  return res.status(201).json(successResponse({ poUrl, poNumber }));
});

// ── GET /invoices/tcs/gstr8 — TCS monthly summary for GSTR-8 filing ──────────
// GSTR-8 is the TCS return filed by marketplace operators (NirmalMandi) under GST.
// Filed by 10th of the following month. Shows TCS collected per seller per month.

invoicesRouter.get('/tcs/gstr8', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const month = String(req.query.month ?? ''); // e.g. '2026-06'
  if (!month.match(/^\d{4}-\d{2}$/)) return res.status(400).json(errorResponse('month param required (YYYY-MM)'));

  const startDate = `${month}-01`;
  const endDate   = `${month}-31`;

  // escrow_accounts columns: amount (not gross_amount), no seller_id (join orders), status 'released'
  const summary = await queryOne<{
    total_taxable: number; tcs_collected: number; seller_count: number; transaction_count: number;
  }>(
    `SELECT
       SUM(ea.amount)        as total_taxable,
       SUM(ea.tcs_amount)    as tcs_collected,
       COUNT(DISTINCT o.seller_id) as seller_count,
       COUNT(*)              as transaction_count
     FROM escrow_accounts ea
     JOIN orders o ON o.id = ea.order_id
     WHERE ea.status = 'released'
       AND ea.released_at >= $1::date
       AND ea.released_at < ($2::date + INTERVAL '1 day')`,
    [startDate, endDate]
  );

  const sellerBreakdown = await query<{
    seller_id: string; business_name: string; gstin: string;
    gross_amount: number; tcs_collected: number; order_count: number;
  }>(
    `SELECT
       o.seller_id,
       sp.business_name,
       COALESCE(sp.gstin, 'UNREGISTERED') as gstin,
       SUM(ea.amount)        as gross_amount,
       SUM(ea.tcs_amount)    as tcs_collected,
       COUNT(*) as order_count
     FROM escrow_accounts ea
     JOIN orders o ON o.id = ea.order_id
     JOIN seller_profiles sp ON sp.id = o.seller_id
     WHERE ea.status = 'released'
       AND ea.released_at >= $1::date
       AND ea.released_at < ($2::date + INTERVAL '1 day')
     GROUP BY o.seller_id, sp.business_name, sp.gstin
     ORDER BY gross_amount DESC`,
    [startDate, endDate]
  );

  // Upsert the monthly summary cache
  await query(
    `INSERT INTO tcs_monthly_summary
       (month, total_taxable, tcs_collected, seller_count, transaction_count)
     VALUES ($1::date, $2, $3, $4, $5)
     ON CONFLICT (month) DO UPDATE SET
       total_taxable    = EXCLUDED.total_taxable,
       tcs_collected    = EXCLUDED.tcs_collected,
       seller_count     = EXCLUDED.seller_count,
       transaction_count = EXCLUDED.transaction_count`,
    [startDate,
     summary?.total_taxable ?? 0,
     summary?.tcs_collected ?? 0,
     summary?.seller_count ?? 0,
     summary?.transaction_count ?? 0]
  );

  return res.json(successResponse({
    month,
    platform_gstin: process.env.PLATFORM_GSTIN ?? '',
    summary: {
      total_taxable_value: summary?.total_taxable ?? 0,
      tcs_collected_at_1pct: summary?.tcs_collected ?? 0,
      seller_count: summary?.seller_count ?? 0,
      transaction_count: summary?.transaction_count ?? 0,
    },
    seller_breakdown: sellerBreakdown,
    gstr8_note: 'File GSTR-8 by the 10th of the following month via GST portal (gstin.gov.in)',
  }));
});

// ── GET /invoices/tcs/certificate/:sellerId — TCS deduction certificate ──────
// Issued to sellers annually under section 206C of Income Tax Act.

invoicesRouter.get('/tcs/certificate/:sellerId', authenticate, async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'admin';
  const isSelf  = req.user!.profile_id === req.params.sellerId;
  if (!isAdmin && !isSelf) return res.status(403).json(errorResponse('Forbidden'));

  const fy = String(req.query.fy ?? `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`);

  const [year] = fy.split('-');
  const startDate = `${year}-04-01`;
  const endDate   = `${parseInt(year) + 1}-03-31`;

  const seller = await queryOne<{ business_name: string; gstin: string; pan: string }>(
    `SELECT sp.business_name, COALESCE(sp.gstin,'') as gstin, '' as pan
     FROM seller_profiles sp WHERE sp.id = $1`,
    [req.params.sellerId]
  );
  if (!seller) return res.status(404).json(errorResponse('Seller not found'));

  const tcs = await queryOne<{ total_taxable: number; total_tcs: number; transaction_count: number }>(
    `SELECT SUM(ea.amount) as total_taxable, SUM(ea.tcs_amount) as total_tcs, COUNT(*) as transaction_count
     FROM escrow_accounts ea
     JOIN orders o ON o.id = ea.order_id
     WHERE o.seller_id = $1
       AND ea.status = 'released'
       AND ea.released_at >= $2::date AND ea.released_at < $3::date`,
    [req.params.sellerId, startDate, endDate]
  );

  return res.json(successResponse({
    certificate_type: 'TCS Deduction Certificate (Section 206C)',
    financial_year: fy,
    deductor: {
      name: 'NirmalMandi Technologies Pvt. Ltd.',
      gstin: process.env.PLATFORM_GSTIN ?? '',
      address: 'NirmalMandi, India',
    },
    deductee: {
      name: seller.business_name,
      gstin: seller.gstin,
    },
    tcs_summary: {
      total_taxable_value: tcs?.total_taxable ?? 0,
      tcs_rate: '1%',
      total_tcs_collected: tcs?.total_tcs ?? 0,
      transaction_count: tcs?.transaction_count ?? 0,
    },
    note: 'This certificate is for reference only. File your returns based on GSTR-2A/2B from GST portal.',
  }));
});

// ── GET /invoices/admin/list ─────────────────────────────────────
invoicesRouter.get('/admin/list', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const { month } = req.query; // e.g. "2024-03"
  let where = '';
  const params: any[] = [];
  if (month) {
    where = `WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', $1::date)`;
    params.push(`${month}-01`);
  }
  const rows = await query(
    `SELECT i.*, o.order_number FROM invoices i JOIN orders o ON i.order_id = o.id
     ${where} ORDER BY i.invoice_date DESC LIMIT 200`,
    params
  );
  return res.json(successResponse(rows));
});
