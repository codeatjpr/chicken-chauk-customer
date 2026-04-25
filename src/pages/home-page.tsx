import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, LayoutGrid, Smartphone, Store } from "lucide-react";
import { useMemo } from "react";
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
import { HeroCarousel } from "@/components/organisms/hero-carousel";
import { heroCarouselAspectClass } from "@/lib/hero-asset";
import { ProductGrid, ProductGridSkeleton } from "@/components/organisms/product-grid";
import { SiteFooter } from "@/components/organisms/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { categoryPath, vendorProductPath, ROUTES } from "@/constants/routes";
import { useToggleFavorite } from "@/hooks/use-toggle-favorite";
import { useVendorCartActions } from "@/hooks/use-vendor-cart-actions";
import { HomeTrustStrip } from "@/components/molecules/home-trust-strip";
import { MobileCategoryRail } from "@/components/molecules/mobile-category-rail";
import { ShopCategoryCard } from "@/components/molecules/shop-category-card";
import { getCategoryDecorativeIcon } from "@/lib/category-icon";
import { cn } from "@/lib/utils";
import { fetchDiscoveryProducts, fetchHomeScreen } from "@/services/discovery.service";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth-store";
import { useLocationStore } from "@/stores/location-store";
import { pickMerchLabel } from "@/lib/merch-label";
import { NO_SHOPS_NEARBY_DESCRIPTION, NO_SHOPS_NEARBY_TITLE } from "@/lib/nearby-shops-copy";
import { PLAY_STORE_URL } from "@/constants/app-links";

export function HomePage() {
  const navigate = useNavigate();
  const authed = useAuthStore(selectIsAuthenticated);
  const { city, displayLabel, latitude, longitude } = useLocationStore();
  const fav = useToggleFavorite();

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
    queryKey: queryKeys.discovery.products(city, latitude, longitude, undefined, undefined, "home-featured"),
    queryFn: () =>
      fetchDiscoveryProducts({
        city,
        latitude,
        longitude,
        limit: 8,
      }),
  });

  const featuredProducts = useMemo(
    () => featuredProductsQuery.data?.items ?? [],
    [featuredProductsQuery.data],
  );
  const mobileFeaturedPreview = useMemo(() => featuredProducts.slice(0, 4), [featuredProducts]);
  const desktopCategories = homeQuery.data?.categories.slice(0, 8) ?? [];
  const heroSlides = homeQuery.data?.heroCarousel ?? [];
  const highlightedCategoryId = useMemo(() => {
    const cats = homeQuery.data?.categories ?? [];
    const chicken = cats.find((c) => c.name.toLowerCase().includes("chicken"));
    return chicken?.id ?? cats[0]?.id;
  }, [homeQuery.data?.categories]);

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
      {/* ── Home hero carousel (same horizontal bounds as sections below) ── */}
      {homeQuery.isLoading ? (
        <Skeleton className={cn(heroCarouselAspectClass, "w-full rounded-2xl md:rounded-[2rem]")} />
      ) : heroSlides.length ? (
        <HeroCarousel slides={heroSlides} />
      ) : null}

      {/* ── Categories: desktop = Crave-style gradient cards; mobile = rail ── */}
      {homeQuery.isLoading || homeQuery.data?.categories.length ? (
        <>
          <section id="shop-by-category" className="scroll-mt-24 hidden lg:block">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold tracking-tight lg:text-lg">Shop by category</h2>
              <Link to={ROUTES.browse} className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
                View all categories
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 pt-1 sm:gap-4 lg:gap-5">
              {homeQuery.isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex w-[158px] shrink-0 flex-col overflow-hidden rounded-3xl border border-[#e8a598]/40 bg-linear-to-b from-[#fffbfb] to-[#ffd8ce] lg:w-[168px]">
                      <Skeleton className="aspect-[1.08] w-full rounded-none rounded-t-3xl bg-white/60" />
                      <div className="flex flex-1 flex-col justify-end px-2 pb-5 pt-9 lg:pb-6 lg:pt-10">
                        <Skeleton className="mx-auto h-5 w-4/5 rounded-md bg-white/50" />
                      </div>
                    </div>
                  ))
                : (desktopCategories.length ? desktopCategories : (homeQuery.data?.categories ?? [])).map(
                    (category) => (
                      <ShopCategoryCard
                        key={category.id}
                        to={categoryPath(category.id)}
                        name={category.name}
                        imageUrl={category.imageUrl}
                        icon={getCategoryDecorativeIcon(category.name)}
                        active={highlightedCategoryId === category.id}
                      />
                    ),
                  )}
            </div>
          </section>

          <section id="shop-by-category-mobile" className="scroll-mt-24 lg:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight">Shop by category</h2>
              <Link to={ROUTES.browse} className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <MobileCategoryRail
              categories={homeQuery.data?.categories ?? []}
              activeCategoryId={highlightedCategoryId}
              loading={homeQuery.isLoading}
            />
          </section>
        </>
      ) : null}

      {/* ── Shops near you (desktop) ── */}
      {homeQuery.data?.topVendors?.length ? (
        <section className="hidden lg:block">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight sm:text-base">Shops near you</h2>
            <Link
              to={ROUTES.stores}
              className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
              View all shops
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
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
      ) : homeQuery.data && !homeQuery.isLoading ? (
        <section className="border-border/60 bg-muted/25 hidden rounded-2xl border border-dashed px-4 py-8 text-center lg:block">
          <p className="text-foreground text-sm font-semibold">{NO_SHOPS_NEARBY_TITLE}</p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{NO_SHOPS_NEARBY_DESCRIPTION}</p>
          <Link
            to={ROUTES.stores}
            className="text-primary mt-4 inline-flex items-center justify-center text-sm font-semibold">
            View all shops
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </section>
      ) : null}

      {/* ── Mobile: shops (horizontal) + products (vertical) in one rounded card ── */}
      <section className="border-border/80 bg-card/90 overflow-hidden rounded-2xl border shadow-sm lg:hidden">
        <div className="border-border/60 border-b p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold tracking-tight">Shops near you</h2>
            <Link
              to={ROUTES.stores}
              className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {homeQuery.isLoading ? (
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-[260px] shrink-0 rounded-2xl" />
              ))}
            </div>
          ) : (homeQuery.data?.topVendors?.length ?? 0) === 0 ? (
            <div className="border-border/60 bg-muted/30 rounded-2xl border border-dashed px-3 py-5 text-center">
              <p className="text-foreground text-sm font-semibold">{NO_SHOPS_NEARBY_TITLE}</p>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{NO_SHOPS_NEARBY_DESCRIPTION}</p>
            </div>
          ) : (
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-0.5">
              {(homeQuery.data?.topVendors ?? []).map((vendor) => (
                <div key={vendor.id} className="w-[260px] shrink-0">
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
          )}
          <Link
            to={ROUTES.stores}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "border-primary/35 text-primary mt-4 h-11 w-full rounded-xl text-sm font-semibold shadow-sm",
            )}>
            View all shops
          </Link>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight">Popular picks</h2>
            <Link to={ROUTES.browse} className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {featuredProductsQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/4.8] rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {mobileFeaturedPreview.map((product, i) => {
                  const weightLabel =
                    product.quantityValue != null
                      ? `${product.quantityValue}${product.quantityUnit ?? ""}`.trim()
                      : null;
                  return (
                    <ProductCard
                      key={product.id}
                      variant="minimal"
                      plpStyle
                      to={vendorProductPath(product.id)}
                      name={product.product.name}
                      imageUrl={product.imageUrl ?? product.product.imageUrl}
                      description={product.product.description}
                      categoryName={product.product.category?.name ?? null}
                      subCategoryName={product.product.subCategory?.name ?? null}
                      vendorName={product.vendor.name}
                      merchLabel={pickMerchLabel(product.id, i)}
                      packInfo={{
                        weightLabel: weightLabel || null,
                        pieces: product.pieces ?? null,
                        servings: product.servings ?? null,
                      }}
                      price={product.price}
                      mrp={product.mrp}
                      favoriteProductId={authed ? product.product.id : undefined}
                      badges={!product.vendor.isOpen ? ["Shop closed"] : []}
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
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Link
                  to={ROUTES.browse}
                  className={cn(
                    "bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/92",
                    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-center text-xs font-semibold shadow-md transition-[transform,box-shadow] active:scale-[0.98] sm:gap-2 sm:text-sm",
                  )}>
                  <LayoutGrid className="size-4 shrink-0 opacity-95" aria-hidden />
                  <span className="leading-tight">All products</span>
                </Link>
                <Link
                  to={ROUTES.stores}
                  className={cn(
                    "border-primary/40 bg-card text-foreground hover:border-primary/55 hover:bg-primary/5",
                    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-2.5 text-center text-xs font-semibold shadow-sm transition-colors active:scale-[0.98] sm:gap-2 sm:text-sm",
                  )}>
                  <Store className="text-primary size-4 shrink-0" aria-hidden />
                  <span className="leading-tight">All shops</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Popular items (desktop grid only) ── */}
      <section className="hidden lg:block">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight lg:text-lg">Popular items</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">Tap any item to see full details and add to cart</p>
          </div>
          <Link to={ROUTES.browse} className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
            View all products
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {featuredProductsQuery.isLoading ? (
          <ProductGridSkeleton count={8} className="gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        ) : (
          <ProductGrid className="gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product, i) => {
              const weightLabel =
                product.quantityValue != null ? `${product.quantityValue}${product.quantityUnit ?? ""}`.trim() : null;
              return (
                <ProductCard
                  key={product.id}
                  variant="minimal"
                  plpStyle
                  to={vendorProductPath(product.id)}
                  name={product.product.name}
                  imageUrl={product.imageUrl ?? product.product.imageUrl}
                  description={product.product.description}
                  categoryName={product.product.category?.name ?? null}
                  subCategoryName={product.product.subCategory?.name ?? null}
                  vendorName={product.vendor.name}
                  merchLabel={pickMerchLabel(product.id, i)}
                  packInfo={{
                    weightLabel: weightLabel || null,
                    pieces: product.pieces ?? null,
                    servings: product.servings ?? null,
                  }}
                  price={product.price}
                  mrp={product.mrp}
                  favoriteProductId={authed ? product.product.id : undefined}
                  badges={!product.vendor.isOpen ? ["Shop closed"] : []}
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
              );
            })}
          </ProductGrid>
        )}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
          <Link
            to={ROUTES.browse}
            className={cn(
              "group bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/92",
              "inline-flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-semibold shadow-lg transition-[transform,box-shadow] hover:shadow-xl active:scale-[0.99]",
            )}>
            <span className="inline-flex items-center gap-3">
              <span className="bg-primary-foreground/15 flex size-11 items-center justify-center rounded-xl">
                <LayoutGrid className="size-5" aria-hidden />
              </span>
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-base leading-tight">Browse all products</span>
                <span className="text-primary-foreground/85 text-xs font-medium">Full catalog &amp; filters</span>
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 opacity-90 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link
            to={ROUTES.stores}
            className={cn(
              "group border-primary/45 bg-card text-foreground hover:border-primary/60 hover:bg-primary/6",
              "inline-flex items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 text-sm font-semibold shadow-md transition-[transform,box-shadow,background-color] hover:shadow-lg active:scale-[0.99]",
            )}>
            <span className="inline-flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                <Store className="size-5" aria-hidden />
              </span>
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-base leading-tight">All shops near you</span>
                <span className="text-muted-foreground text-xs font-medium">Compare stores &amp; menus</span>
              </span>
            </span>
            <ArrowRight className="text-primary size-5 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </section>

      <div className="mt-4 lg:hidden">
        <HomeTrustStrip />
      </div>

      {/* ── Popular searches ── */}
      {homeQuery.data?.popularSearches?.length ? (
        <section className="hidden lg:block">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Popular searches</h2>
          <div className="flex flex-wrap gap-2">
            {homeQuery.data.popularSearches.slice(0, 10).map((search) => (
              <Link
                key={search.query}
                to={`${ROUTES.search}?q=${encodeURIComponent(search.query)}`}
                className="bg-muted/80 hover:bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors">
                {search.query}
                <ChevronRight className="size-3 opacity-50" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Mobile promo strip (matches reference layout) ── */}
      <section className="overflow-hidden rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 p-4 text-white shadow-md lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold leading-snug">Exclusive offers — save more on your first orders.</p>
          <Link
            to={ROUTES.browse}
            className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-white/90">
            Explore
          </Link>
        </div>
      </section>

      {/* ── App download CTA (desktop) ── */}
      <section
        id="app-download"
        className="hidden overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-8 text-white shadow-[0_28px_90px_-40px_rgba(0,0,0,0.85)] lg:block lg:px-10 lg:py-10">
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
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-2xl border border-white/15 bg-white text-zinc-950 hover:bg-white/90",
                )}>
                Google Play
              </a>
              <Link
                to={ROUTES.browse}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-2xl border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}>
                Browse products
              </Link>
              <Link
                to={ROUTES.stores}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-2xl border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}>
                All shops
              </Link>
              <Link
                to={ROUTES.search}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-2xl border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}>
                Search
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase text-zinc-300">Order from</p>
              <p className="mt-2 text-xl font-semibold">Nearby stores</p>
              <p className="mt-1 text-sm text-zinc-400">Compare prep times and ratings from stores near you.</p>
            </div>
            <div className="rounded-2xl bg-white p-5 text-zinc-950">
              <p className="text-xs font-semibold uppercase text-zinc-500">Delivery area</p>
              <p className="mt-2 text-xl font-semibold">{locationLabel}</p>
              <p className="mt-1 text-sm text-zinc-600">Update your location to refresh nearby stores.</p>
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
              Your cart has items from another shop. Continuing will clear your current cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmVendorSwitch()}>Clear and continue</AlertDialogAction>
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
