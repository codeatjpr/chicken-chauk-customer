import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CartLineControls } from "@/components/molecules/cart-line-controls";
import { ProductCard } from "@/components/molecules/product-card";
import { VendorCard } from "@/components/molecules/vendor-card";
import { BannerCarousel } from "@/components/organisms/banner-carousel";
import { LocationPickerDialog } from "@/components/organisms/location-picker-dialog";
import { ProductGrid, ProductGridSkeleton } from "@/components/organisms/product-grid";
import { SiteFooter } from "@/components/organisms/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { categoryPath, vendorProductPath, ROUTES } from "@/constants/routes";
import { useToggleFavorite } from "@/hooks/use-toggle-favorite";
import { useVendorCartActions } from "@/hooks/use-vendor-cart-actions";
import { cn } from "@/lib/utils";
import { fetchDiscoveryProducts, fetchHomeScreen } from "@/services/discovery.service";
import { fetchNearbyVendors } from "@/services/vendors.service";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth-store";
import { useLocationStore } from "@/stores/location-store";
import { useState } from "react";

export function HomePage() {
  const navigate = useNavigate();
  const authed = useAuthStore(selectIsAuthenticated);
  const { city, displayLabel, latitude, longitude } = useLocationStore();
  const [locOpen, setLocOpen] = useState(false);
  const fav = useToggleFavorite();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    cart,
    addWithSwitch,
    switchOpen,
    setSwitchOpen,
    confirmVendorSwitch,
    addIsPending,
    updateIsPending,
    updateQty,
    removeLine,
  } = useVendorCartActions();
  const locationLabel = displayLabel || city;

  const homeQuery = useQuery({
    queryKey: queryKeys.discovery.home(city, latitude, longitude),
    queryFn: () => fetchHomeScreen({ city, latitude, longitude }),
  });

  const featuredProductsQuery = useQuery({
    queryKey: queryKeys.discovery.products(city, undefined, "home-featured"),
    queryFn: () =>
      fetchDiscoveryProducts({
        city,
        limit: 8,
      }),
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
    for (const vendor of flat) {
      if (!map.has(vendor.id)) map.set(vendor.id, vendor);
    }
    return [...map.values()];
  }, [nearbyQuery.data]);

  const featuredProducts = featuredProductsQuery.data?.items ?? [];
  const desktopCategories = homeQuery.data?.categories.slice(0, 8) ?? [];

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
        state: {
          from: `${window.location.pathname}${window.location.search}`,
        },
      });
      return;
    }
    fav.mutate({ type: "VENDOR", referenceId: vendorId });
  };

  return (
    <div className="space-y-6 pb-6 lg:space-y-10 lg:pb-10">
      <LocationPickerDialog open={locOpen} onOpenChange={setLocOpen} />

      {/* ── Shared banner (visible on all screen sizes) ── */}
      {homeQuery.isLoading ? (
        <Skeleton className="aspect-16/9 w-full rounded-2xl md:aspect-16/6 lg:aspect-21/7 lg:rounded-[2rem]" />
      ) : homeQuery.data?.banners.length ? (
        <div className="lg:-mx-6">
          <BannerCarousel banners={homeQuery.data.banners} className="rounded-2xl lg:rounded-[2rem] lg:mx-6" />
        </div>
      ) : null}

      {/* ── Categories ── */}
      {(homeQuery.isLoading || homeQuery.data?.categories.length) ? (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold tracking-tight lg:text-lg">Shop by category</h2>
            <Link to={ROUTES.browse} className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
              Browse all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2 pt-1 lg:gap-6 xl:gap-8">
            {homeQuery.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex shrink-0 flex-col items-center gap-2">
                    <Skeleton className="size-20 rounded-full lg:size-28" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                ))
              : (desktopCategories.length ? desktopCategories : homeQuery.data?.categories ?? []).map((category) => (
                  <Link
                    key={category.id}
                    to={categoryPath(category.id)}
                    className="group flex w-20 shrink-0 flex-col items-center gap-2.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:w-28 xl:w-32"
                  >
                    <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-full shadow-sm ring-2 ring-border/20 transition-[transform,box-shadow] group-hover:scale-105 group-hover:shadow-lg group-hover:ring-primary/30 lg:size-28 xl:size-32">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt=""
                          className="absolute inset-0 size-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary flex size-full items-center justify-center text-2xl font-semibold lg:text-3xl">
                          {category.name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <span className="line-clamp-2 text-xs font-semibold leading-tight lg:text-sm">{category.name}</span>
                  </Link>
                ))}
          </div>
        </section>
      ) : null}

      {/* ── Top rated vendors (mobile-only horizontal scroll, desktop shows in grid below) ── */}
      {homeQuery.data?.topVendors?.length ? (
        <section className="lg:hidden">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Top rated near you</h2>
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {homeQuery.data.topVendors.map((vendor) => (
              <div key={vendor.id} className="w-[260px] shrink-0 sm:w-[280px]">
                <VendorCard
                  id={vendor.id}
                  name={vendor.name}
                  logoUrl={vendor.logoUrl}
                  bannerUrl={vendor.bannerUrl}
                  rating={vendor.rating}
                  totalRatings={vendor.totalRatings}
                  prepTime={vendor.prepTime}
                  distanceKm={vendor.distanceKm}
                  isOpen={vendor.isOpen}
                  isFavorite={vendor.isFavorite}
                  onFavoriteClick={() => handleVendorFavorite(vendor.id)}
                  favoriteLoading={fav.isPending}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Nearby vendors ── */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight lg:text-lg">Stores near you</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">{locationLabel}</p>
          </div>
          <Link to={ROUTES.search} className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
            See all
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {nearbyQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="border-border/60 text-muted-foreground rounded-2xl border border-dashed px-4 py-12 text-center text-sm">
            No vendors open near you right now. Try another area or check back later.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vendors.slice(0, 8).map((vendor) => (
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
            {nearbyQuery.isFetchingNextPage && (
              <p className="text-muted-foreground py-4 text-center text-xs">Loading more…</p>
            )}
          </>
        )}
      </section>

      {/* ── Popular products ── */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight lg:text-lg">Popular in {locationLabel}</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">Tap any item to see full details and add to cart</p>
          </div>
          <Link to={ROUTES.browse} className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {featuredProductsQuery.isLoading ? (
          <ProductGridSkeleton count={8} className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        ) : (
          <ProductGrid className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                to={vendorProductPath(product.id)}
                name={product.product.name}
                imageUrl={product.imageUrl ?? product.product.imageUrl}
                description={product.product.description}
                categoryName={product.product.category?.name}
                unit={product.quantityUnit ?? ''}
                vendorName={product.vendor.name}
                price={product.price}
                mrp={product.mrp}
                favoriteProductId={authed ? product.product.id : undefined}
                eyebrow="Area offer"
                badges={!product.vendor.isOpen ? ["Vendor closed"] : []}
                cartAction={
                  <CartLineControls
                    cart={cart}
                    vendorProductId={product.id}
                    maxQty={product.stock ?? 999}
                    isAvailable={product.isAvailable && product.vendor.isOpen}
                    isAdding={addIsPending}
                    isUpdating={updateIsPending}
                    onAdd={(qty) => addWithSwitch(product.vendor.id, product.id, qty)}
                    onUpdateQty={updateQty}
                    onRemove={removeLine}
                  />
                }
              />
            ))}
          </ProductGrid>
        )}
      </section>

      {/* ── Popular searches ── */}
      {homeQuery.data?.popularSearches?.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Popular searches</h2>
          <div className="flex flex-wrap gap-2">
            {homeQuery.data.popularSearches.slice(0, 10).map((search) => (
              <Link
                key={search.query}
                to={`${ROUTES.search}?q=${encodeURIComponent(search.query)}`}
                className="bg-muted/80 hover:bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              >
                {search.query}
                <ChevronRight className="size-3 opacity-50" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── App download CTA ── */}
      <section
        id="app-download"
        className="overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-8 text-white shadow-[0_28px_90px_-40px_rgba(0,0,0,0.85)] lg:px-10 lg:py-10"
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
              <Smartphone className="size-4" />
              Get the Chicken Chauk app
            </div>
            <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl xl:text-4xl">
              Keep Chicken Chauk in your pocket for faster repeat orders.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-300">
              Save addresses, revisit your favorite stores, and track every order from desktop or mobile with the same
              account.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={ROUTES.browse}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-2xl bg-white text-zinc-950 hover:bg-white/90",
                )}
              >
                Browse products
              </Link>
              <Link
                to={ROUTES.search}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}
              >
                Find stores
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase text-zinc-300">Order from</p>
              <p className="mt-2 text-xl font-semibold">Nearby stores</p>
              <p className="mt-1 text-sm text-zinc-400">
                Browse vendor banners and compare prep times.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 text-zinc-950">
              <p className="text-xs font-semibold uppercase text-zinc-500">Delivery area</p>
              <p className="mt-2 text-xl font-semibold">{locationLabel}</p>
              <p className="mt-1 text-sm text-zinc-600">
                Update your location to refresh nearby stores.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter locationLabel={locationLabel} />

      <AlertDialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cart has items from another vendor. Continuing will clear your current cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmVendorSwitch()}>
              Clear and continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
