import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, Store } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
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
import { EmptyState } from "@/components/molecules/empty-state";
import { ProductCard } from "@/components/molecules/product-card";
import { VendorCard } from "@/components/molecules/vendor-card";
import { PlpToolbar, type PlpSort } from "@/components/organisms/plp-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileCategoryRail } from "@/components/molecules/mobile-category-rail";
import { queryKeys } from "@/constants/query-keys";
import { vendorProductPath, ROUTES } from "@/constants/routes";
import { useAuthStore, selectIsAuthenticated } from "@/stores/auth-store";
import { useToggleFavorite } from "@/hooks/use-toggle-favorite";
import { useVendorCartActions } from "@/hooks/use-vendor-cart-actions";
import * as catalogApi from "@/services/catalog.service";
import { fetchDiscoverySearch } from "@/services/discovery.service";
import { fetchNearbyVendors } from "@/services/vendors.service";
import { useLocationStore } from "@/stores/location-store";
import type { CategoryChipDto, ProductSearchHit, VendorSearchHit } from "@/types/discovery";
import { pickMerchLabel } from "@/lib/merch-label";
import { sortByPlp } from "@/lib/plp-sort";
import { NO_SHOPS_NEARBY_DESCRIPTION, NO_SHOPS_NEARBY_TITLE } from "@/lib/nearby-shops-copy";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useInfiniteScrollSentinel } from "@/hooks/use-infinite-scroll-sentinel";

export function SearchPage() {
  const navigate = useNavigate();
  const authed = useAuthStore(selectIsAuthenticated);
  const [searchParams] = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";
  const { city, latitude, longitude } = useLocationStore();
  const fav = useToggleFavorite();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<PlpSort>("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [filterSubCategoryId, setFilterSubCategoryId] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => catalogApi.fetchCategories(),
  });

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

  const q = urlQ.trim();
  const enabled = q.length > 0;

  const categoryRailItems: CategoryChipDto[] = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl,
      })),
    [categoriesQuery.data],
  );

  const nearbyShopsPeekQuery = useQuery({
    queryKey: [...queryKeys.vendors.nearby(city, latitude, longitude), "search-page-shops"] as const,
    queryFn: () =>
      fetchNearbyVendors({
        latitude,
        longitude,
        page: 1,
        limit: 12,
      }),
    enabled: !enabled,
  });
  const nearbyStrip = nearbyShopsPeekQuery.data?.items ?? [];

  const searchQuery = useInfiniteQuery({
    queryKey: [...queryKeys.discovery.search(q, city, latitude, longitude), "paged"] as const,
    queryFn: ({ pageParam }) =>
      fetchDiscoverySearch({
        q,
        city,
        latitude,
        longitude,
        page: pageParam,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const moreV = last.vendors.hasNext;
      const moreP = last.products.hasNext;
      if (moreV || moreP) return last.vendors.page + 1;
      return undefined;
    },
    enabled,
  });

  const { vendors, products } = useMemo(() => {
    const pages = searchQuery.data?.pages ?? [];
    const vMap = new Map<string, VendorSearchHit>();
    const pMap = new Map<string, ProductSearchHit>();
    for (const page of pages) {
      for (const v of page.vendors.items) {
        if (!vMap.has(v.id)) vMap.set(v.id, v);
      }
      for (const p of page.products.items) {
        if (!pMap.has(p.id)) pMap.set(p.id, p);
      }
    }
    return {
      vendors: [...vMap.values()],
      products: [...pMap.values()],
    };
  }, [searchQuery.data]);

  const firstPage = searchQuery.data?.pages[0];
  const vendorTotal = firstPage?.vendors.total ?? vendors.length;
  const productTotal = firstPage?.products.total ?? products.length;

  const subCategoryOptions = useMemo(() => {
    if (!filterCategoryId) return [];
    const cat = categoriesQuery.data?.find((c) => c.id === filterCategoryId);
    return cat?.subCategories ?? [];
  }, [categoriesQuery.data, filterCategoryId]);

  useEffect(() => {
    setFilterSubCategoryId(null);
  }, [filterCategoryId]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (filterCategoryId) {
      list = list.filter((h) => h.product.category?.id === filterCategoryId);
    }
    if (filterSubCategoryId) {
      list = list.filter((h) => h.product.subCategory?.id === filterSubCategoryId);
    }
    return list;
  }, [products, filterCategoryId, filterSubCategoryId]);

  const sortedProducts = useMemo(
    () => sortByPlp(filteredProducts, sort),
    [filteredProducts, sort],
  );

  const searchScrollKey = `${q}-${searchQuery.dataUpdatedAt}-${vendors.length}-${products.length}-${filterCategoryId ?? ""}-${filterSubCategoryId ?? ""}`;

  useInfiniteScrollSentinel(loadMoreRef, {
    enabled: enabled && (vendors.length > 0 || products.length > 0) && !searchQuery.isLoading,
    hasNextPage: searchQuery.hasNextPage,
    isFetchingNextPage: searchQuery.isFetchingNextPage,
    fetchNextPage: searchQuery.fetchNextPage,
    watchKey: searchScrollKey,
  });

  return (
    <div className="space-y-5 pb-4">
      <div className="space-y-1">
        <h1 className="text-primary text-xl font-semibold tracking-tight sm:text-2xl">
          {urlQ.trim() ? `Search results for “${urlQ.trim()}”` : "Search"}
        </h1>
        {urlQ.trim() ? (
          <p className="text-muted-foreground text-sm">Shops near you and product offers in your area.</p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Use the search bar above, or open a category below.
          </p>
        )}
      </div>

      {!enabled ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-base font-semibold tracking-tight">Browse by category</h2>
            <p className="text-muted-foreground text-sm">Tap a category to see products. Searching hides this list.</p>
            <MobileCategoryRail categories={categoryRailItems} loading={categoriesQuery.isLoading} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight">Shops near you</h2>
              <Link
                to={ROUTES.stores}
                className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            {nearbyShopsPeekQuery.isLoading ? (
              <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-[260px] shrink-0 rounded-2xl" />
                ))}
              </div>
            ) : nearbyStrip.length === 0 ? (
              <div className="border-border/60 bg-muted/30 rounded-2xl border border-dashed px-4 py-6 text-center">
                <p className="text-foreground text-sm font-semibold">{NO_SHOPS_NEARBY_TITLE}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{NO_SHOPS_NEARBY_DESCRIPTION}</p>
              </div>
            ) : (
              <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-0.5">
                {nearbyStrip.map((v) => (
                  <div key={v.id} className="w-[260px] shrink-0">
                    <VendorCard
                      id={v.id}
                      name={v.name}
                      logoUrl={v.logoUrl}
                      bannerUrl={v.bannerUrl}
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
            )}
            <Link
              to={ROUTES.stores}
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "border-primary/35 text-primary flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold shadow-sm",
              )}>
              View all shops near you
            </Link>
          </section>

          <p className="text-muted-foreground text-center text-xs">
            <Link to={ROUTES.home} className="underline-offset-2 hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      ) : searchQuery.isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      ) : searchQuery.isError ? (
        <p className="text-destructive text-center text-sm">Something went wrong. Try again.</p>
      ) : vendors.length === 0 && products.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No results for "${q}"`}
          description="Try a broader keyword, product name, or shop name."
          className="bg-card/40"
        />
      ) : (
        <>
          {enabled && (vendors.length > 0 || products.length > 0) && (
            <p className="text-foreground text-sm sm:text-base">
              We found{" "}
              <span className="text-primary font-bold tabular-nums">{vendorTotal}</span> shop
              {vendorTotal === 1 ? "" : "s"} &amp;{" "}
              <span className="text-primary font-bold tabular-nums">{productTotal}</span> product
              {productTotal === 1 ? "" : "s"} matching your search
            </p>
          )}

          {vendors.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Shops near you</h2>
                  <p className="text-muted-foreground text-sm">Matching your search in your area.</p>
                </div>
                <span className="text-muted-foreground hidden text-sm sm:inline">
                  {vendorTotal} result{vendorTotal !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {vendors.map((v) => (
                  <div key={v.id} className="w-[min(100%,280px)] shrink-0 sm:w-72">
                    <VendorCard
                      id={v.id}
                      name={v.name}
                      logoUrl={v.logoUrl}
                      bannerUrl={v.bannerUrl}
                      rating={v.rating}
                      totalRatings={v.totalRatings}
                      prepTime={v.prepTime}
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
          )}

          {products.length > 0 && (
            <section className="space-y-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Product offers</h2>
                  <p className="text-muted-foreground text-sm">Tap a card for details, or add to cart here.</p>
                </div>
                <span className="text-muted-foreground hidden items-center gap-2 text-sm sm:inline-flex">
                  <Store className="size-4" />
                  {productTotal}+ products
                </span>
              </div>

              <PlpToolbar
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                showing={sortedProducts.length}
                total={productTotal}
                onFiltersClick={() => toast.info("More filters are coming soon.")}
                extra={
                  <div className="flex max-w-full flex-wrap items-center gap-2">
                    <Select
                      value={filterCategoryId ?? "__all__"}
                      onValueChange={(v) => setFilterCategoryId(v === "__all__" ? null : v)}
                    >
                      <SelectTrigger className="h-8 w-[min(100vw-2rem,11rem)] text-xs sm:text-sm">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All categories</SelectItem>
                        {(categoriesQuery.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {subCategoryOptions.length > 0 ? (
                      <Select
                        value={filterSubCategoryId ?? "__all__"}
                        onValueChange={(v) => setFilterSubCategoryId(v === "__all__" ? null : v)}
                      >
                        <SelectTrigger className="h-8 w-[min(100vw-2rem,11rem)] text-xs sm:text-sm">
                          <SelectValue placeholder="Filter by subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All subcategories</SelectItem>
                          {subCategoryOptions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                }
              />

              {sortedProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No products in this filter. Clear category filters to see all matches.
                </p>
              ) : (
                <div
                  className={cn(
                    "grid gap-3",
                    view === "list"
                      ? "grid-cols-1"
                      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
                  )}
                >
                  {sortedProducts.map((hit, i) => {
                    const weightLabel =
                      hit.quantityValue != null
                        ? `${hit.quantityValue}${hit.quantityUnit ?? ""}`.trim()
                        : null;
                    return (
                      <ProductCard
                        key={hit.id}
                        variant="minimal"
                        plpStyle={view === "grid"}
                        listLayout={view === "list"}
                        className={view === "list" ? "max-w-4xl" : undefined}
                        to={vendorProductPath(hit.id)}
                        favoriteProductId={hit.product.id}
                        name={hit.product.name}
                        imageUrl={hit.imageUrl ?? hit.product.imageUrl}
                        description={hit.description ?? hit.product.description}
                        categoryName={hit.product.category?.name ?? null}
                        subCategoryName={hit.product.subCategory?.name ?? null}
                        vendorName={hit.vendor.name}
                        merchLabel={pickMerchLabel(hit.id, i)}
                        badges={[]}
                        packInfo={{
                          weightLabel: weightLabel || null,
                          pieces: hit.pieces ?? null,
                          servings: hit.servings ?? null,
                        }}
                        price={hit.price}
                        mrp={hit.mrp}
                        cartAction={
                          <CartLineControls
                            cart={cart}
                            vendorProductId={hit.id}
                            maxQty={hit.stock ?? 999}
                            isAvailable={hit.isAvailable && hit.vendor.isOpen}
                            isAdding={addIsPending}
                            isUpdating={updateIsPending}
                            onAdd={(qty) => addWithSwitch(hit.vendor.id, hit.id, qty)}
                            onUpdateQty={updateQty}
                            onRemove={removeLine}
                          />
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <div ref={loadMoreRef} className="h-8" />
          {searchQuery.isFetchingNextPage && <p className="text-muted-foreground text-center text-xs">Loading more…</p>}
        </>
      )}

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
