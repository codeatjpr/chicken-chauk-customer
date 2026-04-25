import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Grid2x2, PackageSearch, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
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
import { CategoryPill } from '@/components/molecules/category-pill'
import { ProductCard } from '@/components/molecules/product-card'
import { ProductGridEmptyState } from '@/components/organisms/product-grid'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { vendorProductPath } from '@/constants/routes'
import { pickMerchLabel } from '@/lib/merch-label'
import { sortByPlp } from '@/lib/plp-sort'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import * as catalogApi from '@/services/catalog.service'
import { fetchDiscoveryProducts } from '@/services/discovery.service'
import { useLocationStore } from '@/stores/location-store'

export function CategoryProductsPage() {
  const { categoryId = '' } = useParams<{ categoryId: string }>()
  const [searchParams] = useSearchParams()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { city, latitude, longitude } = useLocationStore()
  const [subOverride, setSubOverride] = useState<string | null | undefined>(undefined)
  const [trackedCategoryId, setTrackedCategoryId] = useState(categoryId)
  if (trackedCategoryId !== categoryId) {
    setTrackedCategoryId(categoryId)
    setSubOverride(undefined)
  }

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

  const categoryQuery = useQuery({
    queryKey: queryKeys.catalog.category(categoryId),
    queryFn: () => catalogApi.fetchCategoryById(categoryId),
    enabled: Boolean(categoryId),
  })

  const productsQuery = useInfiniteQuery({
    queryKey: queryKeys.discovery.products(
      city,
      latitude,
      longitude,
      categoryId,
      subCategoryId,
    ),
    queryFn: ({ pageParam }) =>
      fetchDiscoveryProducts({
        city,
        latitude,
        longitude,
        categoryId,
        ...(subCategoryId ? { subCategoryId } : {}),
        page: pageParam,
        limit: 24,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: Boolean(categoryId),
  })

  const items = useMemo(
    () => productsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [productsQuery.data],
  )
  const total = productsQuery.data?.pages[0]?.total ?? items.length
  const sortedItems = useMemo(() => sortByPlp(items, 'relevance'), [items])

  const cat = categoryQuery.data
  const subCategories = useMemo(() => cat?.subCategories ?? [], [cat?.subCategories])
  const urlSubCategoryId = useMemo(() => {
    const raw = searchParams.get('sub')?.trim()
    if (!raw) return null
    return subCategories.some((s) => s.id === raw) ? raw : null
  }, [searchParams, subCategories])

  const subCategoryId = subOverride !== undefined ? subOverride : urlSubCategoryId

  const setSubCategoryId = (id: string | null) => {
    setSubOverride(id)
  }

  const activeSubCategoryName = useMemo(() => {
    if (!subCategoryId) return null
    return subCategories.find((s) => s.id === subCategoryId)?.name ?? null
  }, [subCategories, subCategoryId])

  const scrollWatchKey = `${categoryId}-${subCategoryId ?? ''}-${productsQuery.dataUpdatedAt}-${items.length}`

  useInfiniteScrollSentinel(loadMoreRef, {
    enabled: Boolean(cat) && items.length > 0 && !productsQuery.isLoading,
    hasNextPage: productsQuery.hasNextPage,
    isFetchingNextPage: productsQuery.isFetchingNextPage,
    fetchNextPage: productsQuery.fetchNextPage,
    watchKey: scrollWatchKey,
  })

  if (!categoryId) {
    return (
      <p className="text-muted-foreground text-sm">Invalid category link.</p>
    )
  }

  return (
    <div className="space-y-4 pb-10">
      {categoryQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-56 rounded-md" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : categoryQuery.isError || !cat ? (
        <p className="text-destructive text-sm">Category not found.</p>
      ) : (
        <>
          <div>
            <h1 className="text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
              {cat.name}
            </h1>
            {cat.tagline ? (
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">{cat.tagline}</p>
            ) : null}
          </div>

          {subCategories.length > 0 ? (
            <div className="space-y-3">
              <div className="no-scrollbar -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 pt-1">
                <CategoryPill
                  label="All"
                  active={subCategoryId === null}
                  onClick={() => setSubCategoryId(null)}
                  leadingIcon={<Grid2x2 className="size-4" aria-hidden />}
                  className="shrink-0"
                />
                {subCategories.map((s) => {
                  const active = subCategoryId === s.id
                  return (
                    <CategoryPill
                      key={s.id}
                      label={s.name}
                      imageUrl={s.imageUrl}
                      active={active}
                      onClick={() => setSubCategoryId(s.id)}
                      className="shrink-0"
                    />
                  )
                })}
              </div>
              {subCategoryId && activeSubCategoryName ? (
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <span className="bg-primary/12 text-primary border-primary/35 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm">
                    {activeSubCategoryName}
                    <button
                      type="button"
                      onClick={() => setSubCategoryId(null)}
                      className="hover:bg-primary/15 -me-0.5 rounded-full p-0.5"
                      aria-label="Clear subcategory filter">
                      <X className="size-3.5" />
                    </button>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Showing {sortedItems.length} of {total}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground px-1 text-xs">
                  Showing {sortedItems.length} of {total}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Showing {sortedItems.length} of {total}
            </p>
          )}
        </>
      )}

      {cat && productsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : cat && productsQuery.isError ? (
        <p className="text-destructive text-sm">Could not load products.</p>
      ) : cat && items.length === 0 ? (
        <ProductGridEmptyState
          icon={PackageSearch}
          title="No products in this category yet"
          description="We couldn't find anything live in this collection right now."
        />
      ) : cat ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sortedItems.map((p, i) => {
              const weightLabel =
                p.quantityValue != null
                  ? `${p.quantityValue}${p.quantityUnit ?? ''}`.trim()
                  : null
              return (
                <ProductCard
                  key={p.id}
                  variant="minimal"
                  plpStyle
                  listLayout={false}
                  to={vendorProductPath(p.id)}
                  favoriteProductId={p.product.id}
                  name={p.product.name}
                  imageUrl={p.imageUrl ?? p.product.imageUrl}
                  description={p.description ?? p.product.description}
                  categoryName={p.product.category?.name ?? cat.name}
                  subCategoryName={p.product.subCategory?.name ?? null}
                  vendorName={p.vendor.name}
                  merchLabel={pickMerchLabel(p.id, i)}
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
      ) : null}

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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
