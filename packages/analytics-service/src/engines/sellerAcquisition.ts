/**
 * BI Engine 6 — Seller Acquisition Targeting
 * Identifies high-demand sectors / geographies that are under-served by current sellers.
 * Produces a ranked list of "acquisition opportunities" for the growth team.
 */
import { query } from '@nirmalmandi/shared';

export async function getSellerAcquisitionTargets() {
  const [sectorGaps, geoGaps, highDemandCategories, churnRisk] = await Promise.all([

    // Sectors with high buyer search volume but low seller supply
    query<{
      sector_name: string; sector_slug: string;
      search_events: number; live_listings: number;
      active_sellers: number; demand_supply_ratio: number;
    }>(
      `SELECT
         s.name as sector_name,
         s.slug as sector_slug,
         COALESCE(ev.search_events, 0) as search_events,
         COALESCE(li.live_listings, 0) as live_listings,
         COALESCE(li.active_sellers, 0) as active_sellers,
         ROUND(COALESCE(ev.search_events,0)::NUMERIC /
               NULLIF(COALESCE(li.live_listings,0), 0), 2) as demand_supply_ratio
       FROM sectors s
       LEFT JOIN (
         SELECT sector_id, COUNT(*) as search_events
         FROM buyer_events
         WHERE event_type IN ('search','listing_view')
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY sector_id
       ) ev ON ev.sector_id = s.id
       LEFT JOIN (
         SELECT sector_id,
           COUNT(*) FILTER (WHERE status = 'live') as live_listings,
           COUNT(DISTINCT seller_id) FILTER (WHERE status = 'live') as active_sellers
         FROM listings
         GROUP BY sector_id
       ) li ON li.sector_id = s.id
       WHERE s.status = 'active'
       ORDER BY demand_supply_ratio DESC NULLS LAST
       LIMIT 10`
    ),

    // States with buyer activity but few sellers
    query<{
      state: string; buyer_events: number;
      registered_sellers: number; opportunity_score: number;
    }>(
      `SELECT
         be.state,
         COUNT(*) as buyer_events,
         COALESCE(sp.registered_sellers, 0) as registered_sellers,
         ROUND(COUNT(*)::NUMERIC / NULLIF(COALESCE(sp.registered_sellers, 0), 0), 1) as opportunity_score
       FROM buyer_events be
       LEFT JOIN (
         SELECT state, COUNT(*) as registered_sellers
         FROM seller_profiles
         WHERE verification_tier IN ('verified','premium')
         GROUP BY state
       ) sp ON sp.state = be.state
       WHERE be.state IS NOT NULL
         AND be.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY be.state, sp.registered_sellers
       ORDER BY opportunity_score DESC NULLS LAST
       LIMIT 10`
    ),

    // Categories driving highest GMV — potential acquisition magnets
    query<{ sector_name: string; gmv_30d: number; avg_order_value: number; orders: number }>(
      `SELECT
         s.name as sector_name,
         SUM(o.total_amount) as gmv_30d,
         AVG(o.total_amount) as avg_order_value,
         COUNT(*) as orders
       FROM orders o
       JOIN listings l ON l.id = o.listing_id
       JOIN sectors s ON s.id = l.sector_id
       WHERE o.status IN ('completed','delivered')
         AND o.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY s.name
       ORDER BY gmv_30d DESC
       LIMIT 8`
    ),

    // Sellers at churn risk (no new listing in 60 days but previously active)
    query<{ seller_id: string; business_name: string; last_listing_date: string; total_gmv: number }>(
      `SELECT
         sp.id as seller_id,
         sp.business_name,
         MAX(l.created_at)::date as last_listing_date,
         COALESCE(SUM(o.total_amount), 0) as total_gmv
       FROM seller_profiles sp
       JOIN listings l ON l.seller_id = sp.id
       LEFT JOIN orders o ON o.seller_id = sp.id AND o.status IN ('completed','delivered')
       GROUP BY sp.id, sp.business_name
       HAVING MAX(l.created_at) < NOW() - INTERVAL '60 days'
          AND MAX(l.created_at) > NOW() - INTERVAL '180 days'
       ORDER BY total_gmv DESC
       LIMIT 10`
    ),
  ]);

  return { sectorGaps, geoGaps, highDemandCategories, churnRisk };
}
