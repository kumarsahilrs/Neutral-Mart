/**
 * BI Engine 8 — Geographic Demand Mapping
 * Maps buyer demand, seller supply, and GMV by Indian state and city.
 * Powers the demand heat-map in the board dashboard.
 */
import { query } from '@nirmalmandi/shared';

export async function getGeoDemand(days = 30) {
  const [byState, byCity, sectorByState, unservedStates] = await Promise.all([

    // Demand & supply by state
    query<{
      state: string;
      buyer_events: number;
      search_events: number;
      live_listings: number;
      active_sellers: number;
      gmv_30d: number;
      orders_30d: number;
      demand_score: number;
    }>(
      `SELECT
         COALESCE(ev.state, sp.state) as state,
         COALESCE(ev.buyer_events, 0) as buyer_events,
         COALESCE(ev.search_events, 0) as search_events,
         COALESCE(li.live_listings, 0) as live_listings,
         COALESCE(li.active_sellers, 0) as active_sellers,
         COALESCE(ord.gmv, 0) as gmv_30d,
         COALESCE(ord.orders, 0) as orders_30d,
         -- Demand score: normalised composite
         ROUND(
           (COALESCE(ev.buyer_events, 0) * 0.4 +
            COALESCE(ord.orders, 0) * 10 +
            COALESCE(ev.search_events, 0) * 0.2) / 100.0, 2
         ) as demand_score
       FROM (
         SELECT state, COUNT(*) as buyer_events,
                COUNT(*) FILTER (WHERE event_type = 'search') as search_events
         FROM buyer_events
         WHERE state IS NOT NULL
           AND created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY state
       ) ev
       FULL OUTER JOIN (
         SELECT sp.state,
                COUNT(*) FILTER (WHERE l.status = 'live') as live_listings,
                COUNT(DISTINCT sp.id) FILTER (WHERE l.status = 'live') as active_sellers
         FROM seller_profiles sp
         JOIN listings l ON l.seller_id = sp.id
         GROUP BY sp.state
       ) li ON li.state = ev.state
       FULL OUTER JOIN (
         SELECT sp.state, SUM(o.total_amount) as gmv, COUNT(*) as orders
         FROM orders o
         JOIN seller_profiles sp ON sp.id = o.seller_id
         WHERE o.status IN ('completed','delivered')
           AND o.created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY sp.state
       ) ord ON ord.state = COALESCE(ev.state, li.state)
       WHERE COALESCE(ev.state, li.state, ord.state) IS NOT NULL
       ORDER BY demand_score DESC`
    ),

    // Top cities by buyer activity
    query<{ city: string; state: string; buyer_events: number; search_volume: number; orders: number }>(
      `SELECT
         be.city,
         be.state,
         COUNT(*) as buyer_events,
         COUNT(*) FILTER (WHERE event_type = 'search') as search_volume,
         COALESCE(ord.orders, 0) as orders
       FROM buyer_events be
       LEFT JOIN (
         SELECT sp.city, COUNT(*) as orders
         FROM orders o
         JOIN seller_profiles sp ON sp.id = o.seller_id
         WHERE o.status IN ('completed','delivered')
           AND o.created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY sp.city
       ) ord ON ord.city = be.city
       WHERE be.city IS NOT NULL
         AND be.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY be.city, be.state, ord.orders
       ORDER BY buyer_events DESC
       LIMIT 20`
    ),

    // Top searched sectors by state — reveals unmet demand
    query<{ state: string; sector_name: string; search_events: number }>(
      `SELECT
         be.state,
         s.name as sector_name,
         COUNT(*) as search_events
       FROM buyer_events be
       JOIN sectors s ON s.id = be.sector_id
       WHERE be.event_type = 'search'
         AND be.state IS NOT NULL
         AND be.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY be.state, s.name
       ORDER BY search_events DESC
       LIMIT 30`
    ),

    // States with zero sellers but buyer activity — highest growth opportunity
    query<{ state: string; buyer_events: number; registered_sellers: number }>(
      `SELECT
         ev.state,
         ev.buyer_events,
         COALESCE(sp.registered_sellers, 0) as registered_sellers
       FROM (
         SELECT state, COUNT(*) as buyer_events
         FROM buyer_events
         WHERE state IS NOT NULL
           AND created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY state
       ) ev
       LEFT JOIN (
         SELECT state, COUNT(*) as registered_sellers
         FROM seller_profiles
         GROUP BY state
       ) sp ON sp.state = ev.state
       WHERE COALESCE(sp.registered_sellers, 0) = 0
         AND ev.buyer_events > 5
       ORDER BY ev.buyer_events DESC
       LIMIT 10`
    ),
  ]);

  return { byState, byCity, sectorByState, unservedStates };
}
