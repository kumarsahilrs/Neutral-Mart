/**
 * BI Engine 7 — CVR (Conversion Rate) Optimization
 * Measures listing view → order conversion across sectors, price bands, cities.
 * Surfaces listings with high views but low CVR as optimization candidates.
 */
import { query } from '@nirmalmandi/shared';

export async function getCvrSignals(days = 30) {
  const [bySector, byPriceBand, byCity, lowCvrListings, highCvrListings] = await Promise.all([

    // CVR by sector
    query<{
      sector_name: string;
      listing_views: number; orders: number;
      cvr_pct: number; avg_price: number;
    }>(
      `SELECT
         s.name as sector_name,
         COALESCE(ev.views, 0) as listing_views,
         COALESCE(ord.orders, 0) as orders,
         ROUND(100.0 * COALESCE(ord.orders,0)::NUMERIC / NULLIF(COALESCE(ev.views,0), 0), 2) as cvr_pct,
         COALESCE(ev.avg_price, 0) as avg_price
       FROM sectors s
       LEFT JOIN (
         SELECT sector_id, COUNT(*) as views, AVG(price_seen) as avg_price
         FROM buyer_events
         WHERE event_type = 'listing_view'
           AND created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY sector_id
       ) ev ON ev.sector_id = s.id
       LEFT JOIN (
         SELECT l.sector_id, COUNT(*) as orders
         FROM orders o
         JOIN listings l ON l.id = o.listing_id
         WHERE o.status NOT IN ('cancelled','pending')
           AND o.created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY l.sector_id
       ) ord ON ord.sector_id = s.id
       WHERE s.status = 'active'
       ORDER BY listing_views DESC
       LIMIT 12`
    ),

    // CVR by price band (₹0-5K, 5K-25K, 25K-100K, 100K+)
    query<{ price_band: string; views: number; orders: number; cvr_pct: number }>(
      `WITH price_bands AS (
         SELECT
           CASE
             WHEN asking_price < 5000    THEN '₹0–5K'
             WHEN asking_price < 25000   THEN '₹5K–25K'
             WHEN asking_price < 100000  THEN '₹25K–1L'
             ELSE '₹1L+'
           END as price_band,
           id
         FROM listings
       ),
       views AS (
         SELECT pb.price_band, COUNT(*) as views
         FROM buyer_events be
         JOIN price_bands pb ON pb.id = be.listing_id
         WHERE be.event_type = 'listing_view'
           AND be.created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY pb.price_band
       ),
       ords AS (
         SELECT pb.price_band, COUNT(*) as orders
         FROM orders o
         JOIN price_bands pb ON pb.id = o.listing_id
         WHERE o.status NOT IN ('cancelled','pending')
           AND o.created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY pb.price_band
       )
       SELECT v.price_band, v.views, COALESCE(o.orders,0) as orders,
              ROUND(100.0 * COALESCE(o.orders,0)::NUMERIC / NULLIF(v.views,0), 2) as cvr_pct
       FROM views v
       LEFT JOIN ords o USING (price_band)
       ORDER BY v.views DESC`
    ),

    // CVR by city
    query<{ city: string; views: number; orders: number; cvr_pct: number }>(
      `WITH city_views AS (
         SELECT city, COUNT(*) as views
         FROM buyer_events
         WHERE event_type = 'listing_view'
           AND city IS NOT NULL
           AND created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY city
       ),
       city_orders AS (
         SELECT sp.city, COUNT(*) as orders
         FROM orders o
         JOIN seller_profiles sp ON sp.id = o.seller_id
         WHERE o.status NOT IN ('cancelled','pending')
           AND o.created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY sp.city
       )
       SELECT cv.city, cv.views, COALESCE(co.orders,0) as orders,
              ROUND(100.0 * COALESCE(co.orders,0)::NUMERIC / NULLIF(cv.views,0), 2) as cvr_pct
       FROM city_views cv
       LEFT JOIN city_orders co USING (city)
       ORDER BY views DESC
       LIMIT 15`
    ),

    // Low CVR listings (>100 views, <2% CVR) — optimization candidates
    query<{
      listing_id: string; title: string; sector_name: string;
      views: number; orders: number; cvr_pct: number; asking_price: number;
    }>(
      `WITH listing_stats AS (
         SELECT
           l.id as listing_id, l.title, s.name as sector_name,
           COALESCE(l.view_count, 0) as views,
           COALESCE(ord.orders, 0) as orders,
           l.asking_price
         FROM listings l
         JOIN sectors s ON s.id = l.sector_id
         LEFT JOIN (
           SELECT listing_id, COUNT(*) as orders
           FROM orders
           WHERE status NOT IN ('cancelled','pending')
             AND created_at >= NOW() - INTERVAL '${days} days'
           GROUP BY listing_id
         ) ord ON ord.listing_id = l.id
         WHERE l.status = 'live'
       )
       SELECT *,
         ROUND(100.0 * orders::NUMERIC / NULLIF(views, 0), 2) as cvr_pct
       FROM listing_stats
       WHERE views > 50
       ORDER BY cvr_pct ASC NULLS FIRST
       LIMIT 10`
    ),

    // High CVR listings — surface as "similar to these" for recommendations
    query<{ listing_id: string; title: string; sector_name: string; cvr_pct: number; asking_price: number }>(
      `WITH listing_stats AS (
         SELECT
           l.id as listing_id, l.title, s.name as sector_name, l.asking_price,
           COALESCE(l.view_count, 0) as views,
           COALESCE(ord.orders, 0) as orders
         FROM listings l
         JOIN sectors s ON s.id = l.sector_id
         LEFT JOIN (
           SELECT listing_id, COUNT(*) as orders
           FROM orders
           WHERE status NOT IN ('cancelled','pending')
             AND created_at >= NOW() - INTERVAL '${days} days'
           GROUP BY listing_id
         ) ord ON ord.listing_id = l.id
         WHERE l.status = 'live'
       )
       SELECT listing_id, title, sector_name, asking_price,
         ROUND(100.0 * orders::NUMERIC / NULLIF(views, 0), 2) as cvr_pct
       FROM listing_stats
       WHERE views > 10 AND orders > 0
       ORDER BY cvr_pct DESC
       LIMIT 10`
    ),
  ]);

  return { bySector, byPriceBand, byCity, lowCvrListings, highCvrListings };
}
