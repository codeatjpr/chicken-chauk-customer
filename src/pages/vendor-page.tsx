import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Grid2x2, Pencil, Search, ShoppingBag, Sparkles, Star, Timer } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { CartPanel } from '@/components/organisms/cart-panel'
import { CategoryPill } from '@/components/molecules/category-pill'
import { ProductCard } from '@/components/molecules/product-card'
import { EmptyState } from '@/components/molecules/empty-state'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES, vendorProductPath } from '@/constants/routes'
import { useDebounceValue } from '@/hooks/use-debounce-value'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import { pickMerchLabel } from '@/lib/merch-label'
import * as catalogApi from '@/services/catalog.service'
import * as ratingsApi from '@/services/ratings.service'
import { fetchVendorById } from '@/services/vendors.service'
import type { VendorProductDto } from '@/types/catalog'
import { formatInr } from '@/utils/format'
import { cn } from '@/lib/utils'

type CategoryTab = { id: string; name: string }

function groupByCategory(items: VendorProductDto[]) {
  const map = new Map<string, { name: string; items: VendorProductDto[] }>()
  for (const row of items) {
    const cid = row.product.category?.id ?? '_uncat'
    const cname = row.product.category?.name ?? 'Other'
    if (!map.has(cid)) map.set(cid, { name: cname, items: [] })
    map.get(cid)!.items.push(row)
  }
  return [...map.entries()].map(([id, value]) => ({ id, ...value }))
}

export function VendorPage() {
  const { id: vendorId = '' } = useParams<{ id: string }>()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeCat, setActiveCat] = useState<string>('all')
  const [menuFilter, setMenuFilter] = useState('')

  const vendorQuery = useQuery({
    queryKey: queryKeys.vendors.detail(vendorId),
    queryFn: () => fetchVendorById(vendorId),
    enabled: Boolean(vendorId),
  })

  const categoriesCatalogQuery = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => catalogApi.fetchCategories(),
    staleTime: 300_000,
  })

  const categoryImageById = useMemo(() => {
    const m = new Map<string, string | null | undefined>()
    for (const c of categoriesCatalogQuery.data ?? []) {
      m.set(c.id, c.imageUrl)
    }
    return m
  }, [categoriesCatalogQuery.data])

  const debouncedMenuSearch = useDebounceValue(menuFilter, 350)
  const categoryFilter = activeCat === 'all' ? undefined : activeCat
  const searchParam = debouncedMenuSearch.trim().length > 0 ? debouncedMenuSearch.trim() : undefined

  const menuBaselineQuery = useQuery({
    queryKey: queryKeys.catalog.vendorProducts(vendorId, undefined, undefined),
    queryFn: () => catalogApi.fetchVendorProducts(vendorId, { limit: 200 }),
    enabled: Boolean(vendorId),
  })

  const menuDisplayInfiniteQuery = useInfiniteQuery({
    queryKey: [
      ...queryKeys.catalog.vendorProducts(vendorId, categoryFilter, searchParam),
      'infinite',
    ],
    queryFn: ({ pageParam }) =>
      catalogApi.fetchVendorProducts(vendorId, {
        categoryId: categoryFilter,
        search: searchParam,
        page: pageParam,
        limit: 24,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: Boolean(vendorId),
  })

  const ratingSummaryQuery = useQuery({
    queryKey: queryKeys.ratings.vendorSummary(vendorId),
    queryFn: () => ratingsApi.fetchVendorRatingSummary(vendorId),
    enabled: Boolean(vendorId),
    staleTime: 60_000,
  })

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

  const categories: CategoryTab[] = useMemo(() => {
    const items = menuBaselineQuery.data?.items ?? []
    return groupByCategory(items).map(({ id, name }) => ({ id, name }))
  }, [menuBaselineQuery.data])

  const displayItems = useMemo(
    () => menuDisplayInfiniteQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [menuDisplayInfiniteQuery.data],
  )
  const menuTotal =
    menuDisplayInfiniteQuery.data?.pages[0]?.total ?? displayItems.length

  const scrollWatchKey = `${activeCat}-${debouncedMenuSearch}-${menuDisplayInfiniteQuery.dataUpdatedAt}-${displayItems.length}`

  useInfiniteScrollSentinel(loadMoreRef, {
    enabled: displayItems.length > 0 && !menuDisplayInfiniteQuery.isLoading,
    hasNextPage: menuDisplayInfiniteQuery.hasNextPage,
    isFetchingNextPage: menuDisplayInfiniteQuery.isFetchingNextPage,
    fetchNextPage: menuDisplayInfiniteQuery.fetchNextPage,
    watchKey: scrollWatchKey,
  })

  const vendor = vendorQuery.data
  const showSticky = cart && cart.items.length > 0 && cart.vendorId === vendorId

  if (!vendorId) {
    return <p className="text-muted-foreground text-sm">Invalid shop link.</p>
  }

  return (
    <div className={cn('pb-6', showSticky && 'pb-28 lg:pb-6')}>
      {vendorQuery.isLoading ? (
        <Skeleton className="mb-6 aspect-6/1 w-full rounded-3xl" />
      ) : vendorQuery.isError || !vendor ? (
        <div className="space-y-1 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-destructive text-sm font-medium">Could not load this shop.</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Usually this means the shop ID in the URL is wrong, the listing was removed, or the API
            could not be reached (network or server). Open the shop again from Home or Search, or
            refresh the page.
          </p>
        </div>
      ) : (
        <header className="mb-6 overflow-hidden rounded-3xl border shadow-sm">
          <div className="bg-muted relative aspect-6/1 w-full">
            {vendor.bannerUrl ? (
              <img src={vendor.bannerUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center text-4xl font-semibold">
                {vendor.name.slice(0, 1)}
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            {!vendor.isOpen ? (
              <div className="absolute right-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Closed now
              </div>
            ) : null}
          </div>
          <div className="from-primary/10 via-background to-background border-border/60 border-t bg-linear-to-br p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-primary mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase">
                  <Sparkles className="size-3.5" />
                  Shop
                </p>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {vendor.name}
                </h1>
                {vendor.description ? (
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
                    {vendor.description}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
                <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
                  <p className="text-muted-foreground text-xs">Rating</p>
                  <p className="text-lg font-semibold">
                    {vendor.rating.toFixed(1)}
                  </p>
                </div>
                <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
                  <p className="text-muted-foreground text-xs">Prep time</p>
                  <p className="text-lg font-semibold">
                    {vendor.prepTime != null ? `${vendor.prepTime} min` : 'Fast'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-muted-foreground mt-4 flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-500 text-amber-500" aria-hidden />
                {vendor.rating.toFixed(1)} ({vendor.totalRatings})
              </span>
              {vendor.prepTime != null ? (
                <span className="inline-flex items-center gap-1">
                  <Timer className="size-3.5" aria-hidden />
                  {vendor.prepTime} min prep
                </span>
              ) : null}
              <span>{vendor.city}</span>
            </div>

            {ratingSummaryQuery.data && ratingSummaryQuery.data.totalRatings > 0 ? (
              <p className="text-muted-foreground mt-2 text-xs">
                {ratingSummaryQuery.data.totalRatings} verified reviews
                {ratingSummaryQuery.data.averageProductQuality != null ? (
                  <> · Food quality avg {ratingSummaryQuery.data.averageProductQuality.toFixed(1)}/5</>
                ) : null}
              </p>
            ) : null}
          </div>
        </header>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
        <div className="min-w-0">
          {menuBaselineQuery.isLoading ||
          (menuDisplayInfiniteQuery.isLoading && !menuDisplayInfiniteQuery.data) ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="aspect-3/4 rounded-xl" />
              ))}
            </div>
          ) : menuDisplayInfiniteQuery.isError ? (
            <div className="space-y-1 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-destructive text-sm font-medium">Menu could not be loaded.</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                The shop loaded but product data failed. Check your connection and try again, or pick
                another category after refreshing.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Browse this menu</h2>
                    <p className="text-muted-foreground text-sm">
                      Filter by category or search to narrow down this shop&apos;s live products.
                    </p>
                  </div>
                  <div className="text-muted-foreground hidden text-sm sm:block">
                    {menuTotal} item{menuTotal !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    className="bg-card ps-9"
                    placeholder="Search dishes or keywords in this menu…"
                    value={menuFilter}
                    onChange={(e) => setMenuFilter(e.target.value)}
                    aria-label="Filter menu"
                  />
                </div>

                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  <CategoryPill
                    label="All"
                    active={activeCat === 'all'}
                    onClick={() => setActiveCat('all')}
                    leadingIcon={<Grid2x2 className="size-4" aria-hidden />}
                  />
                  {categories.map((category) => (
                    <CategoryPill
                      key={category.id}
                      label={category.name}
                      imageUrl={
                        category.id !== '_uncat'
                          ? categoryImageById.get(category.id) ?? undefined
                          : undefined
                      }
                      active={activeCat === category.id}
                      onClick={() => setActiveCat(category.id)}
                    />
                  ))}
                </div>
              </div>

              {displayItems.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No dishes match your filter"
                  description="Try another category or remove some search terms."
                  className="bg-card/40"
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {displayItems.map((row, i) => {
                      const weightLabel =
                        row.quantityValue != null
                          ? `${row.quantityValue}${row.quantityUnit ?? ''}`.trim()
                          : null
                      return (
                        <ProductCard
                          key={row.id}
                          variant="minimal"
                          plpStyle
                          to={vendorProductPath(row.id)}
                          favoriteProductId={row.product.id}
                          name={row.product.name}
                          imageUrl={row.imageUrl ?? row.product.imageUrl}
                          description={row.description ?? row.product.description}
                          categoryName={row.product.category?.name ?? null}
                          subCategoryName={row.product.subCategory?.name ?? null}
                          vendorName={vendor?.name ?? 'Shop'}
                          merchLabel={pickMerchLabel(row.id, i)}
                          packInfo={{
                            weightLabel: weightLabel || null,
                            pieces: row.pieces ?? null,
                            servings: row.servings ?? null,
                          }}
                          price={row.price}
                          mrp={row.mrp}
                          cartAction={
                            <CartLineControls
                              cart={cart}
                              vendorProductId={row.id}
                              maxQty={Math.max(0, row.stock)}
                              isAvailable={row.isAvailable && vendor?.isOpen === true}
                              isAdding={addIsPending}
                              isUpdating={updateIsPending}
                              onAdd={(qty) => addWithSwitch(vendorId, row.id, qty)}
                              onUpdateQty={updateQty}
                              onRemove={removeLine}
                            />
                          }
                          meta={
                            <p className="text-muted-foreground text-xs">
                              {row.stock > 0
                                ? `${row.stock} left in stock`
                                : 'Restocking soon'}
                            </p>
                          }
                        />
                      )
                    })}
                  </div>
                  <div ref={loadMoreRef} className="h-8" />
                  {menuDisplayInfiniteQuery.isFetchingNextPage ? (
                    <p className="text-muted-foreground py-4 text-center text-xs">
                      Loading more…
                    </p>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>

        <aside className="border-border/60 mt-8 hidden lg:sticky lg:top-20 lg:mt-0 lg:block lg:max-h-[calc(100vh-6rem)] lg:rounded-3xl lg:border lg:bg-card/60 lg:p-4">
          <h2 className="mb-2 text-sm font-semibold">Cart</h2>
          <ScrollArea className="max-h-[min(70vh,520px)]">
            <CartPanel cart={cart} isLoading={false} />
          </ScrollArea>
        </aside>
      </div>

      {showSticky ? (
        <div
          className="fixed inset-x-0 z-20 lg:hidden"
          style={{
            bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="border-border/80 bg-background/98 mx-auto max-w-[1400px] overflow-hidden rounded-t-xl border border-b-0 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <p className="text-muted-foreground bg-muted/80 border-border/60 border-b px-3 py-1.5 text-[10px] leading-snug">
              Total includes items, delivery &amp; platform fees where applicable. Use Edit to change
              quantities on the cart page, or Cart for a quick review.
            </p>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs">{cart.vendorName}</p>
                <p className="font-semibold tabular-nums">{formatInr(cart.estimatedTotal)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to={ROUTES.cart}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'inline-flex gap-1 px-2.5',
                  )}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSheetOpen(true)}
                >
                  <ShoppingBag className="size-4" />
                  Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>Your cart</SheetTitle>
          </SheetHeader>
          <ScrollArea className="max-h-[65vh] pe-2">
            <CartPanel cart={cart} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cart has items from another shop. Adding from this menu will clear the current cart and start fresh here.
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
  )
}
