'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight, TrendingDown, Package, Layers, ChevronRight, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import ListingCard from '@/components/ListingCard';
import FlashSaleCard from '@/components/FlashSaleCard';
import SectorPill from '@/components/SectorPill';
import { inventoryApi, type Listing, type Sector } from '@/lib/api';

const PAGE_LIMIT = 12;

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // ── Sectors ─────────────────────────────────────────────────────────────────
  const [sectors, setSectors] = useState<Sector[]>([]);
  // activeSector stores the sector's id for pill comparison; activeSectorSlug is passed to the API
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null);
  const [activeSectorSlug, setActiveSectorSlug] = useState<string | null>(null);

  // ── Flash sales ─────────────────────────────────────────────────────────────
  const [flashSales, setFlashSales] = useState<Listing[]>([]);

  // ── Deal feed (load-more) ────────────────────────────────────────────────────
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ── Recently viewed ──────────────────────────────────────────────────────────
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);

  // track if we've already initialised the feed for a given activeSector
  // sentinel value 'UNINIT' means we haven't run the initial fetch yet
  const activeSectorRef = useRef<string>('UNINIT');

  // ── Load sectors ─────────────────────────────────────────────────────────────
  useEffect(() => {
    inventoryApi
      .getSectors()
      .then((res) => {
        const raw = (res.data as unknown as { data: Sector[] })?.data ?? res.data;
        if (Array.isArray(raw)) setSectors(raw);
      })
      .catch(() => {});
  }, []);

  // ── Load flash sales ──────────────────────────────────────────────────────────
  useEffect(() => {
    inventoryApi
      .getListings({ limit: 10, price_type: 'flash_sale' } as Parameters<typeof inventoryApi.getListings>[0])
      .then((res) => {
        const raw = (res.data as unknown as { data: { rows: Listing[] } })?.data;
        const rows: Listing[] = raw?.rows ?? [];
        // Keep only listings that have a flash_sale_ends_at field
        setFlashSales(
          rows.filter(
            (l) => !!(l as unknown as Record<string, unknown>).flash_sale_ends_at
          )
        );
      })
      .catch(() => {});
  }, []);

  // ── Load recently viewed ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(
        localStorage.getItem('nm_recently_viewed') || '[]'
      );
      if (ids.length > 0) {
        const limited = ids.slice(0, 8);
        // Fetch each individually and collect results
        Promise.allSettled(
          limited.map((id) =>
            inventoryApi
              .getListing(id)
              .then((res) => (res.data as unknown as { data: Listing })?.data ?? (res.data as unknown as Listing))
          )
        ).then((results) => {
          const found: Listing[] = results
            .filter((r): r is PromiseFulfilledResult<Listing> => r.status === 'fulfilled' && !!r.value)
            .map((r) => r.value);
          setRecentlyViewed(found);
        });
      }
    } catch {
      // localStorage not available (SSR or private mode)
    }
  }, []);

  // ── Fetch a page of the deal feed ────────────────────────────────────────────
  const fetchPage = useCallback(
    async (pageNum: number, sectorId: string | null, append: boolean) => {
      if (pageNum === 1 && !append) setInitialLoading(true);
      else setLoadingMore(true);

      try {
        const params: Parameters<typeof inventoryApi.getListings>[0] = {
          page: pageNum,
          limit: PAGE_LIMIT,
          featured: pageNum === 1 && !sectorId ? true : undefined,
          sector: sectorId ?? undefined,
        };
        const res = await inventoryApi.getListings(params);
        const raw = (res.data as unknown as { data: { rows: Listing[]; total?: number } })?.data;
        const rows: Listing[] = raw?.rows ?? [];

        if (append) {
          setListings((prev) => [...prev, ...rows]);
        } else {
          setListings(rows);
        }
        setHasMore(rows.length >= PAGE_LIMIT);
      } catch {
        // silently fail — listings just stays empty
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // ── Initial deal-feed load + react to activeSectorSlug changes ──────────────
  useEffect(() => {
    const isFirstRun = activeSectorRef.current === 'UNINIT';
    activeSectorRef.current = activeSectorSlug ?? '__null__';

    if (!isFirstRun) {
      // Sector changed — reset feed
      setListings([]);
      setPage(1);
      setHasMore(true);
    }

    fetchPage(1, activeSectorSlug, false);
  }, [activeSectorSlug, fetchPage]);

  // ── Load More handler ────────────────────────────────────────────────────────
  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, activeSectorSlug, true);
  }

  // ── Search submit ────────────────────────────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/listings');
    }
  }

  // ── Sector pill click ─────────────────────────────────────────────────────────
  function handleSectorClick(sectorId: string | null, sectorSlug: string | null) {
    setActiveSectorId(sectorId);
    setActiveSectorSlug(sectorSlug);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <TrendingDown className="w-4 h-4" />
            B2B Liquidation Marketplace
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            India&apos;s B2B Dead Inventory<br />
            <span className="text-yellow-300">Marketplace</span>
          </h1>
          <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
            Buy surplus, dead, and liquidation inventory at up to 80% off. Connect directly with verified sellers across India.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search electronics, apparel, FMCG..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg"
              />
            </div>
            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-5 py-3 rounded-xl transition-colors shadow-lg flex items-center gap-2"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm">
            {[
              { label: 'Active Listings', value: '500+' },
              { label: 'Verified Sellers', value: '120+' },
              { label: 'Sectors', value: '25+' },
              { label: 'States Covered', value: '28' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl px-6 py-3 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-primary-200 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-accent-600 text-white py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="font-medium">Have dead inventory to liquidate?</p>
          <div className="flex gap-3">
            <Link
              href="/listings"
              className="bg-white text-accent-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
            >
              Browse Deals
            </Link>
            <Link
              href="/login"
              className="bg-accent-700 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-accent-800 transition-colors border border-white/20"
            >
              List Your Inventory
            </Link>
          </div>
        </div>
      </section>

      {/* Flash Sale Strip */}
      {flashSales.length > 0 && (
        <section className="bg-gradient-to-r from-amber-500 to-orange-500 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-white font-bold text-lg">&#9889; Flash Sales</span>
              <span className="text-amber-100 text-sm">Ending Soon</span>
              <Link
                href="/listings?price_type=flash_sale"
                className="ml-auto text-white text-sm underline"
              >
                View All
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {flashSales.map((listing) => {
                const flashListing = listing as unknown as {
                  id: string;
                  title: string;
                  images: string[];
                  asking_price: number;
                  mrp?: number;
                  flash_sale_ends_at: string;
                  sector_name?: string;
                  condition_grade: string;
                };
                return (
                  <FlashSaleCard
                    key={listing.id}
                    listing={{
                      id: flashListing.id,
                      title: flashListing.title,
                      images: flashListing.images ?? [],
                      asking_price: flashListing.asking_price,
                      mrp: flashListing.mrp,
                      flash_sale_ends_at: flashListing.flash_sale_ends_at,
                      sector_name: flashListing.sector_name,
                      condition_grade: flashListing.condition_grade,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* Sector browse */}
        <section id="sectors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse by Sector</h2>
              <p className="text-gray-500 text-sm mt-1">Find deals in your industry</p>
            </div>
            <Link
              href="/listings"
              className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {sectors.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sectors.map((sector) => (
                <Link
                  key={sector.id}
                  href={`/listings?sector=${encodeURIComponent(sector.slug)}`}
                  className="card p-4 text-center hover:shadow-md hover:border-primary-200 transition-all group"
                >
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-primary-100 transition-colors">
                    <Layers className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                    {sector.name}
                  </p>
                  {sector.listing_count !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">{sector.listing_count} listings</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl mx-auto mb-2" />
                  <div className="h-3 bg-gray-200 rounded mx-auto w-3/4" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sector filter pills + deal feed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Deals</h2>
              <p className="text-gray-500 text-sm mt-1">Handpicked inventory at the best prices</p>
            </div>
            <Link
              href="/listings"
              className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Sector filter pills */}
          {sectors.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
              {/* "All" pill */}
              <SectorPill
                sector={{ id: '', name: 'All' }}
                active={activeSectorId === null}
                onClick={() => handleSectorClick(null, null)}
              />
              {sectors.map((s) => (
                <SectorPill
                  key={s.id}
                  sector={s}
                  active={activeSectorId === s.id}
                  onClick={() => handleSectorClick(s.id, s.slug)}
                />
              ))}
            </div>
          )}

          {/* Deal feed grid */}
          {initialLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No deals found. Try a different sector.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold px-8 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      'Load More Deals'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* How it works */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Browse Inventory',
                desc: 'Search and filter thousands of dead stock listings across India by sector, price, and location.',
                icon: Search,
              },
              {
                step: '02',
                title: 'Place Your Order',
                desc: 'Register as a buyer, select quantity, and place an order directly with the seller.',
                icon: Package,
              },
              {
                step: '03',
                title: 'Save Big',
                desc: 'Get verified inventory at 50–80% below market price. GST invoices provided.',
                icon: TrendingDown,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {step}
                </div>
                <div className="mb-2">
                  <Icon className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {recentlyViewed.map((listing) => (
                <div key={listing.id} className="flex-shrink-0 w-60">
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Seller CTA */}
      <section className="bg-amber-50 border-t border-amber-100 py-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Got dead inventory sitting in your warehouse?
          </h2>
          <p className="text-gray-600 mb-6">
            List it in minutes. Connect with 10,000+ verified B2B buyers across India.
          </p>
          <Link
            href="/seller-register"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Start Selling Free &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p className="font-semibold text-gray-800">
            Nirmal<span className="text-primary-600">Mandi</span>
          </p>
          <p>&copy; {new Date().getFullYear()} NirmalMandi. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/listings" className="hover:text-primary-600 transition-colors">Browse</Link>
            <Link href="/login" className="hover:text-primary-600 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
