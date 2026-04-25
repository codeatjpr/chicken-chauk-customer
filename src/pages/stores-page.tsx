import { useInfiniteQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { VendorCard } from "@/components/molecules/vendor-card";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { vendorPath, ROUTES } from "@/constants/routes";
import { useToggleFavorite } from "@/hooks/use-toggle-favorite";
import { fetchNearbyVendors } from "@/services/vendors.service";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth-store";
import { useLocationStore } from "@/stores/location-store";
import { NO_SHOPS_NEARBY_DESCRIPTION, NO_SHOPS_NEARBY_TITLE } from "@/lib/nearby-shops-copy";

export function StoresPage() {
  const navigate = useNavigate();
  const authed = useAuthStore(selectIsAuthenticated);
  const { city, latitude, longitude } = useLocationStore();
  const fav = useToggleFavorite();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const nearbyQuery = useInfiniteQuery({
    queryKey: queryKeys.vendors.nearby(city, latitude, longitude),
    queryFn: ({ pageParam }) =>
      fetchNearbyVendors({
        latitude,
        longitude,
        page: pageParam,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  });

  const vendors = useMemo(() => {
    const flat = nearbyQuery.data?.pages.flatMap((p) => p.items) ?? [];
    const map = new Map<string, (typeof flat)[number]>();
    for (const vendor of flat) {
      if (!map.has(vendor.id)) map.set(vendor.id, vendor);
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

  const handleVendorFavorite = (vendorId: string) => {
    if (!authed) {
      navigate(ROUTES.login, {
        state: { from: `${window.location.pathname}${window.location.search}` },
      });
      return;
    }
    fav.mutate({ type: "VENDOR", referenceId: vendorId });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Shops near you</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse meat, seafood, and grocery shops delivering in your area.</p>
      </div>

      {nearbyQuery.isLoading ? (
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 py-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
              <Skeleton className="size-14 shrink-0 rounded-full" />
              <Skeleton className="h-6 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : vendors.length ? (
        <section aria-label="Shop shortcuts">
          <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">Shops</h2>
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 pt-1">
            {vendors.map((v) => (
              <Link
                key={v.id}
                to={vendorPath(v.id)}
                className="flex w-[76px] shrink-0 flex-col items-center gap-1.5"
                title={v.name}>
                <span className="border-border/70 bg-background flex size-14 items-center justify-center overflow-hidden rounded-full border shadow-sm ring-2 ring-transparent transition hover:ring-primary/35">
                  {v.logoUrl ? (
                    <img src={v.logoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <Store className="text-muted-foreground size-6" aria-hidden />
                  )}
                </span>
                <span className="text-foreground line-clamp-2 w-full text-center text-[10px] font-medium leading-tight">
                  {v.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-tight sm:text-base">All shops</h2>
        {nearbyQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="border-border/60 rounded-2xl border border-dashed px-4 py-12 text-center">
            <p className="text-foreground text-sm font-semibold">{NO_SHOPS_NEARBY_TITLE}</p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{NO_SHOPS_NEARBY_DESCRIPTION}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  id={vendor.id}
                  name={vendor.name}
                  logoUrl={vendor.logoUrl}
                  bannerUrl={vendor.bannerUrl}
                  rating={vendor.rating}
                  totalRatings={vendor.totalRatings}
                  prepTime={vendor.prepTime}
                  distanceKm={vendor.distanceKm}
                  isOpen={vendor.isOpen}
                  isFavorite={false}
                  onFavoriteClick={() => handleVendorFavorite(vendor.id)}
                  favoriteLoading={fav.isPending}
                />
              ))}
            </div>
            <div ref={loadMoreRef} className="h-8" />
            {nearbyQuery.isFetchingNextPage ? (
              <p className="text-muted-foreground py-4 text-center text-xs">Loading more…</p>
            ) : null}
          </>
        )}
      </section>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
