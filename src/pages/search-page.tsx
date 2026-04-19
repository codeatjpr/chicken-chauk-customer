import { useInfiniteQuery } from '@tanstack/react-query'
import { Compass, Search, Store } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CartLineControls } from '@/components/molecules/cart-line-controls'
import { EmptyState } from '@/components/molecules/empty-state'
import { ProductCard } from '@/components/molecules/product-card'
import { VendorCard } from '@/components/molecules/vendor-card'
import { ProductGrid, ProductGridSkeleton } from '@/components/organisms/product-grid'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { vendorProductPath, ROUTES } from '@/constants/routes'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'
import { useDebounceValue } from '@/hooks/use-debounce-value'
import { useToggleFavorite } from '@/hooks/use-toggle-favorite'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import { fetchDiscoverySearch } from '@/services/discovery.service'
import { useLocationStore } from '@/stores/location-store'
import type { ProductSearchHit, VendorSearchHit } from '@/types/discovery'

export function SearchPage() {
  const navigate = useNavigate()
  const authed = useAuthStore(selectIsAuthenticated)
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const [draft, setDraft] = useState(urlQ)
  const debounced = useDebounceValue(draft, 400)
  const { city } = useLocationStore()
  const fav = useToggleFavorite()
  const loadMoreRef = useRef<HTMLDivElement>(null)

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
  } = useVendorCartActions()

  useEffect(() => {
    setDraft(urlQ)
  }, [urlQ])

  useEffect(() => {
    const t = debounced.trim()
    if (t === urlQ.trim()) return
    if (t.length === 0) {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ q: t }, { replace: true })
  }, [debounced, setSearchParams, urlQ])

  const q = urlQ.trim()
  const enabled = q.length > 0

  const searchQuery = useInfiniteQuery({
    queryKey: [...queryKeys.discovery.search(q, city), 'paged'] as const,
    queryFn: ({ pageParam }) =>
      fetchDiscoverySearch({
        q,
        city,
        page: pageParam,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const moreV = last.vendors.hasNext
      const moreP = last.products.hasNext
      if (moreV || moreP) return last.vendors.page + 1
      return undefined
    },
    enabled,
  })

  const { vendors, products } = useMemo(() => {
    const pages = searchQuery.data?.pages ?? []
    const vMap = new Map<string, VendorSearchHit>()
    const pMap = new Map<string, ProductSearchHit>()
    for (const page of pages) {
      for (const v of page.vendors.items) {
        if (!vMap.has(v.id)) vMap.set(v.id, v)
      }
      for (const p of page.products.items) {
        if (!pMap.has(p.id)) pMap.set(p.id, p)
      }
    }
    return {
      vendors: [...vMap.values()],
      products: [...pMap.values()],
    }
  }, [searchQuery.data])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !searchQuery.hasNextPage || searchQuery.isFetchingNextPage) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void searchQuery.fetchNextPage()
        }
      },
      { rootMargin: '120px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [searchQuery, vendors.length, products.length])

  return (
    <div className="space-y-6 pb-4">
      <section className="from-primary/12 via-background to-background border-border/60 overflow-hidden rounded-3xl border bg-linear-to-br p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-primary mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase">
              <Compass className="size-3.5" />
              Discover in {city}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Search vendors, dishes, and product ideas in one place
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
              Start with a dish, ingredient, or shop name and we&apos;ll surface
              matching vendors and product offers available near you.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
            <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
              <p className="text-muted-foreground text-xs">City</p>
              <p className="text-sm font-semibold">{city}</p>
            </div>
            <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
              <p className="text-muted-foreground text-xs">Results</p>
              <p className="text-sm font-semibold">{enabled ? 'Live search' : 'Waiting'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          className="bg-card ps-9"
          placeholder="Search vendors or dishes…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Search"
        />
      </div>

      {!enabled ? (
        <EmptyState
          icon={Search}
          title={`Search in ${city}`}
          description="Type a vendor name, dish, or ingredient to start exploring the catalog."
          className="bg-card/40"
        />
      ) : searchQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <ProductGridSkeleton count={3} />
        </div>
      ) : searchQuery.isError ? (
        <p className="text-destructive text-center text-sm">
          Something went wrong. Try again.
        </p>
      ) : vendors.length === 0 && products.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No results for "${q}"`}
          description="Try a broader keyword, product name, or vendor name."
          className="bg-card/40"
        />
      ) : (
        <>
          {vendors.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Vendors</h2>
                  <p className="text-muted-foreground text-sm">
                    Shops matching your search right now.
                  </p>
                </div>
                <span className="text-muted-foreground hidden text-sm sm:inline">
                  {vendors.length} result{vendors.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {vendors.map((v) => (
                  <VendorCard
                    key={v.id}
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
                        })
                        return
                      }
                      fav.mutate({ type: 'VENDOR', referenceId: v.id })
                    }}
                    favoriteLoading={fav.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {products.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Product offers
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Tap any listing to view full details and add to cart.
                  </p>
                </div>
                <span className="text-muted-foreground hidden items-center gap-2 text-sm sm:inline-flex">
                  <Store className="size-4" />
                  {products.length} offer{products.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ProductGrid className="xl:grid-cols-2">
                {products.map((hit) => {
                  const qtyParts = [
                    hit.quantityValue ? `${hit.quantityValue}${hit.quantityUnit ?? ''}` : null,
                    hit.pieces ?? null,
                    hit.servings ?? null,
                  ].filter(Boolean)
                  return (
                  <ProductCard
                    key={hit.id}
                    to={vendorProductPath(hit.id)}
                    favoriteProductId={hit.product.id}
                    name={hit.product.name}
                    imageUrl={hit.imageUrl ?? hit.product.imageUrl}
                    description={hit.product.description}
                    categoryName={hit.product.category?.name}
                    unit={hit.quantityUnit ?? ''}
                    vendorName={hit.vendor.name}
                    price={hit.price}
                    mrp={hit.mrp}
                    eyebrow="Live offer"
                    badges={!hit.vendor.isOpen ? ['Vendor closed'] : []}
                    meta={
                      <p className="text-muted-foreground text-xs">
                        {[hit.vendor.rating.toFixed(1) + ' rating', ...qtyParts].join(' · ')}
                      </p>
                    }
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
                )})}

              </ProductGrid>
            </section>
          )}

          <div ref={loadMoreRef} className="h-8" />
          {searchQuery.isFetchingNextPage && (
            <p className="text-muted-foreground text-center text-xs">
              Loading more…
            </p>
          )}
        </>
      )}

      <p className="text-muted-foreground text-center text-xs">
        <Link to={ROUTES.home} className="underline-offset-2 hover:underline">
          Back to home
        </Link>
      </p>

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
    </div>
  )
}
