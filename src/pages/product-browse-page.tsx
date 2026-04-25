import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Search, Store, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
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
import { ProductCard } from '@/components/molecules/product-card'
import { ProductGridEmptyState } from '@/components/organisms/product-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { vendorProductPath } from '@/constants/routes'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import { PlpToolbar, type PlpSort } from '@/components/organisms/plp-toolbar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import * as catalogApi from '@/services/catalog.service'
import { fetchDiscoveryProducts } from '@/services/discovery.service'
import { useLocationStore } from '@/stores/location-store'
import { pickMerchLabel } from '@/lib/merch-label'
import { sortByPlp } from '@/lib/plp-sort'
import { cn } from '@/lib/utils'
import { useDebounceValue } from '@/hooks/use-debounce-value'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { useMinWidth } from '@/hooks/use-media-query'

export function ProductBrowsePage() {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isLg = useMinWidth(1024)
  const { city, latitude, longitude } = useLocationStore()
  const [sort, setSort] = useState<PlpSort>('relevance')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [filterSubCategoryId, setFilterSubCategoryId] = useState<string | null>(null)
  const [productSearchInput, setProductSearchInput] = useState('')
  const debouncedProductSearch = useDebounceValue(productSearchInput.trim(), 350)
  const productSearch =
    debouncedProductSearch.length > 0 ? debouncedProductSearch : undefined

  const categoriesQuery = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => catalogApi.fetchCategories(),
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

  const productsQuery = useInfiniteQuery({
    queryKey: queryKeys.discovery.products(
      city,
      latitude,
      longitude,
      filterCategoryId ?? undefined,
      filterSubCategoryId,
      productSearch,
    ),
    queryFn: ({ pageParam }) =>
      fetchDiscoveryProducts({
        city,
        latitude,
        longitude,
        ...(filterCategoryId ? { categoryId: filterCategoryId } : {}),
        ...(filterSubCategoryId ? { subCategoryId: filterSubCategoryId } : {}),
        ...(productSearch ? { search: productSearch } : {}),
        page: pageParam,
        limit: 24,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })

  const items = useMemo(
    () => productsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [productsQuery.data],
  )
  const total = productsQuery.data?.pages[0]?.total ?? items.length
  const sortedItems = useMemo(
    () => sortByPlp(items, isLg ? sort : 'relevance'),
    [items, sort, isLg],
  )

  const subCategoryOptions = useMemo(() => {
    if (!filterCategoryId) return []
    const cat = categoriesQuery.data?.find((c) => c.id === filterCategoryId)
    return cat?.subCategories ?? []
  }, [categoriesQuery.data, filterCategoryId])

  useEffect(() => {
    setFilterSubCategoryId(null)
  }, [filterCategoryId])

  useEffect(() => {
    if (!isLg) setFilterSubCategoryId(null)
  }, [isLg])

  const selectedCategoryName = useMemo(() => {
    if (!filterCategoryId) return null
    return categoriesQuery.data?.find((c) => c.id === filterCategoryId)?.name ?? null
  }, [categoriesQuery.data, filterCategoryId])

  const scrollWatchKey = `${filterCategoryId ?? ''}-${filterSubCategoryId ?? ''}-${productSearch ?? ''}-${productsQuery.dataUpdatedAt}-${items.length}`

  const effectiveView = isLg ? view : 'grid'

  useInfiniteScrollSentinel(loadMoreRef, {
    enabled: items.length > 0 && !productsQuery.isLoading,
    hasNextPage: productsQuery.hasNextPage,
    isFetchingNextPage: productsQuery.isFetchingNextPage,
    fetchNextPage: productsQuery.fetchNextPage,
    watchKey: scrollWatchKey,
  })

  return (
    <div className="space-y-4 pb-10">
      <div className="space-y-1">
        <h1 className="text-primary text-2xl font-semibold tracking-tight sm:text-3xl">All products</h1>
        <p className="text-muted-foreground text-sm">
          Premium quality meat and more, delivered fresh to your door.
        </p>
      </div>

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
        <Input
          value={productSearchInput}
          onChange={(e) => setProductSearchInput(e.target.value)}
          placeholder="Search products by name…"
          className="bg-card h-11 rounded-full border-border/80 ps-10 shadow-sm"
          aria-label="Search products"
        />
      </div>
      {productsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : productsQuery.isError ? (
        <p className="text-destructive text-sm">Could not load products.</p>
      ) : items.length === 0 ? (
        <ProductGridEmptyState
          icon={Store}
          title="No products available"
          description="The catalog is empty right now. Please check back shortly."
        />
      ) : (
        <>
          {isLg ? (
            <>
              {filterCategoryId && selectedCategoryName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary/12 text-primary border-primary/35 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm">
                    {selectedCategoryName}
                    <button
                      type="button"
                      onClick={() => setFilterCategoryId(null)}
                      className="hover:bg-primary/15 rounded-full p-0.5"
                      aria-label="Remove category filter">
                      <X className="size-3.5" />
                    </button>
                  </span>
                </div>
              ) : null}
              <PlpToolbar
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                showing={sortedItems.length}
                total={total}
                onFiltersClick={() => toast.info('More filters are coming soon.')}
                extra={
                  <div className="flex max-w-full flex-wrap items-center gap-2">
                    <Select
                    value={filterCategoryId ?? '__all__'}
                    onValueChange={(v) => setFilterCategoryId(v === '__all__' ? null : v)}
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
                      value={filterSubCategoryId ?? '__all__'}
                      onValueChange={(v) => setFilterSubCategoryId(v === '__all__' ? null : v)}
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
            </>
          ) : (
            <div className="border-border/80 bg-card/80 flex flex-col gap-3 rounded-xl border px-3 py-3">
              <div className="flex items-stretch gap-2">
                <Select
                  value={filterCategoryId ?? '__all__'}
                  onValueChange={(v) => setFilterCategoryId(v === '__all__' ? null : v)}
                >
                  <SelectTrigger
                    className={cn(
                      'h-11 min-w-0 flex-1 rounded-xl text-sm font-medium shadow-sm',
                      filterCategoryId
                        ? 'border-primary bg-primary/8 text-primary ring-2 ring-primary/25'
                        : '',
                    )}>
                    <SelectValue placeholder="Pick a category" />
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!filterCategoryId}
                  onClick={() => setFilterCategoryId(null)}
                  className="border-primary/30 text-primary h-11 shrink-0 rounded-xl px-3 font-semibold disabled:opacity-40">
                  Clear
                </Button>
              </div>
              {filterCategoryId && selectedCategoryName ? (
                <div className="flex flex-wrap gap-2">
                  <span className="bg-primary/12 text-primary border-primary/35 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm">
                    {selectedCategoryName}
                    <button
                      type="button"
                      onClick={() => setFilterCategoryId(null)}
                      className="hover:bg-primary/15 rounded-full p-0.5"
                      aria-label="Remove category filter">
                      <X className="size-3.5" />
                    </button>
                  </span>
                </div>
              ) : null}
              <p className="text-muted-foreground text-xs">
                Showing {sortedItems.length} of {total}
              </p>
            </div>
          )}
          <div
            className={cn(
              'grid gap-3',
              effectiveView === 'list'
                ? 'grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
            )}
          >
            {sortedItems.map((p, i) => {
              const weightLabel =
                p.quantityValue != null
                  ? `${p.quantityValue}${p.quantityUnit ?? ''}`.trim()
                  : null
              return (
                <ProductCard
                  key={p.id}
                  variant="minimal"
                  plpStyle={effectiveView === 'grid'}
                  listLayout={effectiveView === 'list'}
                  className={effectiveView === 'list' ? 'max-w-4xl' : undefined}
                  to={vendorProductPath(p.id)}
                  favoriteProductId={p.product.id}
                  name={p.product.name}
                  imageUrl={p.imageUrl ?? p.product.imageUrl}
                  description={p.description ?? p.product.description}
                  categoryName={p.product.category?.name ?? null}
                  subCategoryName={p.product.subCategory?.name ?? null}
                  vendorName={p.vendor.name}
                  merchLabel={pickMerchLabel(p.id, i)}
                  badges={[]}
                  packInfo={{
                    weightLabel: weightLabel || null,
                    pieces: p.pieces ?? null,
                    servings: p.servings ?? null,
                  }}
                  price={p.price}
                  mrp={p.mrp}
                  cartAction={
                    <CartLineControls
                      cart={cart}
                      vendorProductId={p.id}
                      maxQty={p.stock ?? 999}
                      isAvailable={p.isAvailable && p.vendor.isOpen}
                      isAdding={addIsPending}
                      isUpdating={updateIsPending}
                      onAdd={(qty) => addWithSwitch(p.vendor.id, p.id, qty)}
                      onUpdateQty={updateQty}
                      onRemove={removeLine}
                    />
                  }
                />
              )
            })}
          </div>
          <div ref={loadMoreRef} className="h-8" />
          {productsQuery.isFetchingNextPage && (
            <p className="text-muted-foreground py-4 text-center text-xs">
              Loading more…
            </p>
          )}
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
            <AlertDialogAction onClick={() => confirmVendorSwitch()}>
              Clear and continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
