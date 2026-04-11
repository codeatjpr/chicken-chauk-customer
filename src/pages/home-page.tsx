import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BannerCarousel } from "@/components/organisms/banner-carousel";
import { LocationPickerDialog } from "@/components/organisms/location-picker-dialog";
import { VendorCard } from "@/components/molecules/vendor-card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { categoryPath, ROUTES } from "@/constants/routes";
import { fetchHomeScreen } from "@/services/discovery.service";
import { fetchNearbyVendors } from "@/services/vendors.service";
import { useAuthStore, selectIsAuthenticated } from "@/stores/auth-store";
import { useLocationStore } from "@/stores/location-store";
import { useToggleFavorite } from "@/hooks/use-toggle-favorite";
import { cn } from "@/lib/utils";

export function HomePage() {
  const navigate = useNavigate();
  const authed = useAuthStore(selectIsAuthenticated);
  const { city, latitude, longitude } = useLocationStore();
  const [locOpen, setLocOpen] = useState(false);
  const fav = useToggleFavorite();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const homeQuery = useQuery({
    queryKey: queryKeys.discovery.home(city, latitude, longitude),
    queryFn: () => fetchHomeScreen({ city, latitude, longitude }),
  });

  const nearbyQuery = useInfiniteQuery({
    queryKey: queryKeys.vendors.nearby(city, latitude, longitude),
    queryFn: ({ pageParam }) =>
      fetchNearbyVendors({
        city,
        latitude,
        longitude,
        page: pageParam,
        limit: 20,
        radiusKm: 8,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  });

  const vendors = useMemo(() => {
    const flat = nearbyQuery.data?.pages.flatMap((p) => p.items) ?? [];
    const map = new Map<string, (typeof flat)[number]>();
    for (const v of flat) {
      if (!map.has(v.id)) map.set(v.id, v);
    }
    return [...map.values()];
  }, [nearbyQuery.data]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !nearbyQuery.hasNextPage || nearbyQuery.isFetchingNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void nearbyQuery.fetchNextPage();
        }
      },
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [nearbyQuery, vendors.length]);

  return (
    <div className="space-y-8 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setLocOpen(true)}
          className="border-border/80 bg-card/60 hover:bg-muted/60 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors">
          <MapPin className="text-primary size-4 shrink-0" aria-hidden />
          <span className="truncate">{city}</span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={ROUTES.browse}
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            All products
          </Link>
          <Link
            to={ROUTES.search}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Search
          </Link>
        </div>
      </div>

      <LocationPickerDialog open={locOpen} onOpenChange={setLocOpen} />

      {homeQuery.isLoading ? (
        <Skeleton className="aspect-16/6 w-full rounded-xl md:aspect-16/5" />
      ) : homeQuery.data?.banners.length ? (
        <BannerCarousel banners={homeQuery.data.banners} />
      ) : null}

      {homeQuery.data?.categories.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Categories</h2>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {homeQuery.data.categories.map((c) => (
              <Link
                key={c.id}
                to={categoryPath(c.id)}
                className="border-border/80 bg-card hover:border-primary/40 flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors"
              >
                <div className="bg-muted size-8 overflow-hidden rounded-full">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground flex size-full items-center justify-center text-xs">
                      {c.name.slice(0, 1)}
                    </span>
                  )}
                </div>
                <span className="line-clamp-2 text-[11px] leading-tight font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {homeQuery.data?.topVendors?.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Top rated near you</h2>
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {homeQuery.data.topVendors.map((v) => (
              <div key={v.id} className="w-[260px] shrink-0 sm:w-[280px]">
                <VendorCard
                  id={v.id}
                  name={v.name}
                  logoUrl={v.logoUrl}
                  rating={v.rating}
                  totalRatings={v.totalRatings}
                  prepTime={v.prepTime}
                  distanceKm={v.distanceKm}
                  isOpen={v.isOpen}
                  isFavorite={v.isFavorite}
                  onFavoriteClick={() => {
                    if (!authed) {
                      navigate(ROUTES.login, {
                        state: {
                          from: `${window.location.pathname}${window.location.search}`,
                        },
                      });
                      return;
                    }
                    fav.mutate({ type: "VENDOR", referenceId: v.id });
                  }}
                  favoriteLoading={fav.isPending}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Vendors near you</h2>
          <span className="text-muted-foreground text-xs">{city}</span>
        </div>

        {nearbyQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="border-border/60 text-muted-foreground rounded-xl border border-dashed px-4 py-12 text-center text-sm">
            No vendors open near you right now. Try another area or check back later.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((v) => (
                <VendorCard
                  key={v.id}
                  id={v.id}
                  name={v.name}
                  logoUrl={v.logoUrl}
                  rating={v.rating}
                  totalRatings={v.totalRatings}
                  prepTime={v.prepTime}
                  distanceKm={v.distanceKm}
                  isOpen={v.isOpen}
                  isFavorite={false}
                  onFavoriteClick={() => {
                    if (!authed) {
                      navigate(ROUTES.login, {
                        state: {
                          from: `${window.location.pathname}${window.location.search}`,
                        },
                      });
                      return;
                    }
                    fav.mutate({ type: "VENDOR", referenceId: v.id });
                  }}
                  favoriteLoading={fav.isPending}
                />
              ))}
            </div>
            <div ref={loadMoreRef} className="h-8" />
            {nearbyQuery.isFetchingNextPage && (
              <p className="text-muted-foreground py-4 text-center text-xs">Loading more…</p>
            )}
          </>
        )}
      </section>

      {homeQuery.data?.popularSearches?.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Popular searches</h2>
          <div className="flex flex-wrap gap-2">
            {homeQuery.data.popularSearches.slice(0, 8).map((p) => (
              <Link
                key={p.query}
                to={`${ROUTES.search}?q=${encodeURIComponent(p.query)}`}
                className="bg-muted/80 hover:bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
                {p.query}
                <ChevronRight className="size-3 opacity-50" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
