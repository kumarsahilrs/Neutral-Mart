import { Router, Request, Response } from 'express';
import { authenticate, requireRole, query, queryOne, successResponse, errorResponse } from '@nirmalmandi/shared';
import { getDemandSupplyGap } from '../engines/demandSupply';
import { getAgingRisk } from '../engines/agingRisk';
import { getSalesVelocity } from '../engines/salesVelocity';
import { getRevenueForecast } from '../engines/revenueForecast';
import { getPlatformKpis } from '../engines/kpis';
import { ingestEvent, getBuyerBehaviorSummary, type BuyerEvent } from '../engines/buyerBehavior';
import { getSellerAcquisitionTargets } from '../engines/sellerAcquisition';
import { getCvrSignals } from '../engines/cvrOptimization';
import { getGeoDemand } from '../engines/geoDemand';
import { generateBoardReport } from '../engines/boardReport';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);
analyticsRouter.use(requireRole('admin', 'super_admin'));

// ── GET /analytics/kpis — Platform KPIs ─────────────────────
analyticsRouter.get('/kpis', async (req: Request, res: Response) => {
  const period = (req.query.period as string) || 'today';
  const kpis = await getPlatformKpis(period);
  res.json(successResponse(kpis));
});

// ── GET /analytics/demand-supply-gap ────────────────────────
analyticsRouter.get('/demand-supply-gap', async (_req, res: Response) => {
  const gaps = await getDemandSupplyGap();
  res.json(successResponse(gaps));
});

// ── GET /analytics/aging-risk ────────────────────────────────
analyticsRouter.get('/aging-risk', async (_req, res: Response) => {
  const risks = await getAgingRisk();
  res.json(successResponse(risks));
});

// ── GET /analytics/revenue-forecast ─────────────────────────
analyticsRouter.get('/revenue-forecast', async (_req, res: Response) => {
  const forecast = await getRevenueForecast();
  res.json(successResponse(forecast));
});

// ── GET /analytics/sales-velocity/:listing_id ───────────────
analyticsRouter.get('/sales-velocity/:listing_id', async (req: Request, res: Response) => {
  const velocity = await getSalesVelocity(req.params.listing_id);
  res.json(successResponse(velocity));
});

// ── GET /analytics/gmv-trend — GMV over last 30 days ────────
analyticsRouter.get('/gmv-trend', async (_req, res: Response) => {
  const trend = await query<{ date: string; gmv: number; orders: number }>(
    `SELECT DATE(created_at) as date,
            SUM(total_amount) as gmv,
            COUNT(*) as orders
     FROM orders
     WHERE status IN ('completed','delivered','shipped')
       AND created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`
  );
  res.json(successResponse(trend));
});

// ── GET /analytics/top-sellers ───────────────────────────────
analyticsRouter.get('/top-sellers', async (_req, res: Response) => {
  const sellers = await query(
    `SELECT sp.business_name, sp.verification_tier,
            COUNT(o.id) as total_orders,
            SUM(o.total_amount) as total_gmv,
            AVG(o.total_amount) as avg_order_value
     FROM orders o
     JOIN seller_profiles sp ON o.seller_id = sp.id
     WHERE o.status IN ('completed','delivered')
       AND o.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY sp.id, sp.business_name, sp.verification_tier
     ORDER BY total_gmv DESC LIMIT 10`
  );
  res.json(successResponse(sellers));
});

// ── GET /analytics/sector-performance ───────────────────────
analyticsRouter.get('/sector-performance', async (_req, res: Response) => {
  const sectors = await query(
    `SELECT s.name, s.slug,
            COUNT(l.id) as active_listings,
            COALESCE(SUM(o.total_amount),0) as gmv_30d,
            COUNT(o.id) as orders_30d
     FROM sectors s
     LEFT JOIN listings l ON l.sector_id = s.id AND l.status = 'live'
     LEFT JOIN orders o ON o.listing_id = l.id
       AND o.created_at >= NOW() - INTERVAL '30 days'
       AND o.status IN ('completed','delivered')
     GROUP BY s.id, s.name, s.slug
     ORDER BY gmv_30d DESC`
  );
  res.json(successResponse(sectors));
});

// ── Engine 5: POST /analytics/events — ingest buyer events ──
// Public endpoint — no auth (events come from anonymous visitors too).
// Rate-limited at nginx / API gateway level in production.
analyticsRouter.post('/events', async (req: Request, res: Response) => {
  const event = req.body as BuyerEvent;
  if (!event?.event_type) return res.status(400).json(errorResponse('event_type required'));
  await ingestEvent(event).catch(() => {}); // fire and forget
  return res.status(202).json({ ok: true });
});

// ── Engine 5: GET /analytics/buyer-behavior ─────────────────
analyticsRouter.get('/buyer-behavior', async (req: Request, res: Response) => {
  const days = parseInt(String(req.query.days ?? '7'), 10);
  const data = await getBuyerBehaviorSummary(Math.min(days, 90));
  res.json(successResponse(data));
});

// ── Engine 6: GET /analytics/seller-acquisition ─────────────
analyticsRouter.get('/seller-acquisition', async (_req, res: Response) => {
  const data = await getSellerAcquisitionTargets();
  res.json(successResponse(data));
});

// ── Engine 7: GET /analytics/cvr ────────────────────────────
analyticsRouter.get('/cvr', async (req: Request, res: Response) => {
  const days = parseInt(String(req.query.days ?? '30'), 10);
  const data = await getCvrSignals(Math.min(days, 90));
  res.json(successResponse(data));
});

// ── Engine 8: GET /analytics/geo-demand ─────────────────────
analyticsRouter.get('/geo-demand', async (req: Request, res: Response) => {
  const days = parseInt(String(req.query.days ?? '30'), 10);
  const data = await getGeoDemand(Math.min(days, 90));
  res.json(successResponse(data));
});

// ── Board PDF: POST /analytics/board-report ─────────────────
analyticsRouter.post('/board-report', async (req: Request, res: Response) => {
  const period = String(req.body?.period ?? `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`);
  const url = await generateBoardReport(period, req.user!.sub);
  res.json(successResponse({ reportUrl: url, period }));
});

// ── GET /analytics/board-reports — list cached reports ──────
analyticsRouter.get('/board-reports', async (_req, res: Response) => {
  const rows = await query(
    `SELECT id, period, report_url, created_at, kpi_snapshot
     FROM board_reports
     ORDER BY created_at DESC LIMIT 20`
  );
  res.json(successResponse(rows));
});

// ── GET /analytics/ai-cost — AI spend tracking ──────────────
analyticsRouter.get('/ai-cost', async (req: Request, res: Response) => {
  const period = (req.query.period as string) || 'today';
  const interval = period === 'today' ? '1 day' : period === 'week' ? '7 days' : '30 days';
  const cost = await queryOne<{ total_cost_usd: number; total_calls: number; avg_latency_ms: number }>(
    `SELECT SUM(cost_usd) as total_cost_usd,
            COUNT(*) as total_calls,
            AVG(latency_ms) as avg_latency_ms
     FROM ai_logs
     WHERE created_at >= NOW() - INTERVAL '${interval}'`
  );
  const byType = await query(
    `SELECT action_type, SUM(cost_usd) as cost, COUNT(*) as calls
     FROM ai_logs
     WHERE created_at >= NOW() - INTERVAL '${interval}'
     GROUP BY action_type ORDER BY cost DESC`
  );
  res.json(successResponse({ summary: cost, by_action_type: byType }));
});
