import { useQuery } from '@tanstack/react-query'
import {
  BadgePercent,
  CheckCircle2,
  Layers,
  MapPin,
  Salad,
  Scale,
  Star,
  Tags,
  Timer,
  Utensils,
} from 'lucide-react'
import { useMemo } from 'react'
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
import { CategoryPill } from '@/components/molecules/category-pill'
import { CommerceProductCard } from '@/components/molecules/commerce-product-card'
import { EmptyState } from '@/components/molecules/empty-state'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { categoryPath, vendorPath } from '@/constants/routes'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import * as catalogApi from '@/services/catalog.service'
import { fetchDiscoverySearch } from '@/services/discovery.service'
import { listingSizeLabel, piecesDisplay, servingsDisplay } from '@/lib/pack-display'
import { RichTextBody } from '@/components/molecules/rich-text-body'
import { useLocationStore } from '@/stores/location-store'
import { formatInr } from '@/utils/format'
export function ProductPage() {
  const { id: productId = '' } = useParams<{ id: string }>()
  const { city, latitude, longitude } = useLocationStore()

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

  const categoriesQuery = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => catalogApi.fetchCategories(),
    staleTime: 300_000,
  })

  const productQuery = useQuery({
    queryKey: queryKeys.catalog.product(productId),
    queryFn: () => catalogApi.fetchProductById(productId),
    enabled: Boolean(productId),
  })

  const product = productQuery.data

  const searchQuery = useQuery({
    queryKey: [
      ...queryKeys.discovery.search(product?.name ?? '_', city, latitude, longitude),
      'product-offers',
      productId,
    ] as const,
    queryFn: () =>
      fetchDiscoverySearch({
        q: product!.name,
        city,
        latitude,
        longitude,
        limit: 50,
      }),
    enabled: Boolean(product?.name && productId),
  })

  const offers = useMemo(() => {
    const items = searchQuery.data?.products.items ?? []
    return items
      .filter((hit) => hit.product.id === productId)
      .sort((a, b) => a.price - b.price)
  }, [productId, searchQuery.data])

  const bestPrice = offers.length > 0 ? Math.min(...offers.map((offer) => offer.price)) : null

  /** Prefer in-stock open shops; cheapest within that pool for hero + primary add-to-cart. */
  const displayOffer = useMemo(() => {
    if (offers.length === 0) return null
    const open = offers.filter((h) => h.isAvailable && h.vendor.isOpen)
    const pool = open.length > 0 ? open : offers
    return pool.reduce((a, b) => (a.price <= b.price ? a : b))
  }, [offers])

  const heroDescriptionSource = useMemo(() => {
    if (!product) return ''
    if (displayOffer?.description?.trim()) return displayOffer.description
    return product.description ?? ''
  }, [product, displayOffer])

  const displayPctOff =
    displayOffer &&
    displayOffer.mrp != null &&
    displayOffer.mrp > displayOffer.price
      ? Math.round(((displayOffer.mrp - displayOffer.price) / displayOffer.mrp) * 100)
      : null

  const displaySpecCount = useMemo(() => {
    if (!displayOffer) return 0
    const w = listingSizeLabel(displayOffer.quantityValue, displayOffer.quantityUnit)?.trim()
    const hasW = Boolean(w)
    const hasP = Boolean(displayOffer.pieces?.trim())
    const hasS = Boolean(displayOffer.servings?.trim())
    return [hasW, hasP, hasS].filter(Boolean).length
  }, [displayOffer])

  if (!productId) {
    return <p className="text-muted-foreground text-sm">Invalid product link.</p>
  }

  return (
    <div className="space-y-6 pb-8">
      {categoriesQuery.data?.length ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Browse categories</h2>
            <p className="text-muted-foreground text-sm">
              Jump between collections without leaving the product flow.
            </p>
          </div>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {categoriesQuery.data.map((category) => (
              <CategoryPill
                key={category.id}
                label={category.name}
                imageUrl={category.imageUrl}
                to={categoryPath(category.id)}
                active={product?.category?.id === category.id}
              />
            ))}
          </div>
        </section>
      ) : null}

      {productQuery.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Skeleton className="aspect-video rounded-3xl lg:aspect-4/3" />
          <Skeleton className="min-h-112 rounded-3xl" />
        </div>
      ) : productQuery.isError || !product ? (
        <p className="text-destructive text-sm">Product not found.</p>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="from-primary/10 via-muted to-muted/70 relative aspect-video overflow-hidden rounded-3xl border bg-linear-to-br shadow-sm lg:aspect-4/3">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex size-full items-center justify-center text-6xl font-semibold">
                  {product.name.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="border-border/60 from-primary/5 via-background to-background rounded-3xl border bg-linear-to-br p-5 shadow-sm sm:p-6">
              {(product.category || product.subCategory) && (
                <div className="border-border/60 flex gap-3 border-b pb-4">
                  {product.category ? (
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
                        Category
                      </p>
                      <Link to={categoryPath(product.category.id)}>
                        <span className="border-primary/25 bg-primary/12 text-primary inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold">
                          <Tags className="size-3.5 shrink-0 opacity-90" aria-hidden />
                          <span className="truncate">{product.category.name}</span>
                        </span>
                      </Link>
                    </div>
                  ) : null}
                  {product.category && product.subCategory ? (
                    <div className="bg-border w-px shrink-0 self-stretch" aria-hidden />
                  ) : null}
                  {product.subCategory && product.category ? (
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
                        Sub category
                      </p>
                      <Link
                        to={`${categoryPath(product.category.id)}?sub=${encodeURIComponent(product.subCategory.id)}`}>
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-800 dark:text-sky-200">
                          <Layers className="size-3.5 shrink-0 opacity-90" aria-hidden />
                          <span className="truncate">{product.subCategory.name}</span>
                        </span>
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}

              {displayOffer ? (
                <Link
                  to={vendorPath(displayOffer.vendor.id)}
                  className="border-border/70 bg-muted/25 hover:bg-muted/40 mt-4 flex flex-wrap items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-colors">
                  <div className="bg-background flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-sm">
                    {displayOffer.vendor.logoUrl ? (
                      <img src={displayOffer.vendor.logoUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground text-lg font-semibold">
                        {displayOffer.vendor.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs font-medium">Sold by</p>
                    <p className="text-foreground truncate font-semibold">{displayOffer.vendor.name}</p>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                        {displayOffer.vendor.rating.toFixed(1)}
                      </span>
                      {displayOffer.vendor.prepTime != null ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Timer className="size-3" aria-hidden />
                          {displayOffer.vendor.prepTime} min prep
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px] font-semibold">
                    {offers.length} shops
                  </Badge>
                </Link>
              ) : offers.length > 0 ? (
                <div className="mt-4">
                  <Badge variant="outline">{offers.length} shops</Badge>
                </div>
              ) : null}

              <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>

              <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm">
                <CheckCircle2 className="text-emerald-600 size-4 shrink-0 dark:text-emerald-400" aria-hidden />
                <span>Fresh · Natural · No preservatives</span>
              </p>

              {heroDescriptionSource.trim() ? (
                <RichTextBody
                  source={heroDescriptionSource}
                  className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base"
                />
              ) : (
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
                  Fresh quality, curated for quick delivery and easy comparison across shops.
                </p>
              )}

              {displayOffer &&
              (listingSizeLabel(displayOffer.quantityValue, displayOffer.quantityUnit) ||
                displayOffer.pieces ||
                displayOffer.servings) ? (
                <div
                  className={
                    'border-border/70 bg-muted/20 mt-4 grid gap-2 rounded-2xl border p-3 sm:p-4 ' +
                    (displaySpecCount <= 1
                      ? 'grid-cols-1'
                      : displaySpecCount === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3')
                  }
                >
                  {listingSizeLabel(displayOffer.quantityValue, displayOffer.quantityUnit) ? (
                    <div className="min-w-0 text-center">
                      <div className="text-emerald-600 dark:text-emerald-400 mx-auto mb-1 flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
                        <Scale className="size-4" aria-hidden />
                      </div>
                      <p className="text-muted-foreground text-[10px] font-medium uppercase sm:text-xs">
                        Net weight
                      </p>
                      <p className="text-foreground mt-0.5 text-xs font-semibold tabular-nums sm:text-sm">
                        {listingSizeLabel(displayOffer.quantityValue, displayOffer.quantityUnit)}
                      </p>
                    </div>
                  ) : null}
                  {displayOffer.pieces ? (
                    <div className="min-w-0 text-center">
                      <div className="mx-auto mb-1 flex size-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300">
                        <Utensils className="size-4" aria-hidden />
                      </div>
                      <p className="text-muted-foreground text-[10px] font-medium uppercase sm:text-xs">
                        Pieces
                      </p>
                      <p className="text-foreground mt-0.5 text-xs font-semibold sm:text-sm">
                        {piecesDisplay(displayOffer.pieces)}
                      </p>
                    </div>
                  ) : null}
                  {displayOffer.servings ? (
                    <div className="min-w-0 text-center">
                      <div className="text-primary mx-auto mb-1 flex size-8 items-center justify-center rounded-lg bg-primary/12">
                        <Salad className="size-4" aria-hidden />
                      </div>
                      <p className="text-muted-foreground text-[10px] font-medium uppercase sm:text-xs">
                        Serves
                      </p>
                      <p className="text-foreground mt-0.5 text-xs font-semibold sm:text-sm">
                        {servingsDisplay(displayOffer.servings)}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {offers.length > 1 ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  Other pack sizes may apply — see each shop below.
                </p>
              ) : null}

              {displayOffer ? (
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
                        {formatInr(displayOffer.price)}
                      </span>
                      {displayPctOff != null && displayPctOff > 0 ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          {displayPctOff}% OFF
                        </span>
                      ) : null}
                    </div>
                    {displayOffer.mrp != null && displayOffer.mrp > displayOffer.price ? (
                      <p className="text-muted-foreground mt-1 text-sm">
                        MRP <span className="line-through tabular-nums">{formatInr(displayOffer.mrp)}</span>
                      </p>
                    ) : null}
                    <p className="text-muted-foreground mt-0.5 text-[11px]">(incl. of all taxes)</p>
                  </div>
                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end" onClick={(e) => e.stopPropagation()}>
                    <div className="w-full sm:w-auto">
                      <CartLineControls
                        cart={cart}
                        vendorProductId={displayOffer.id}
                        maxQty={displayOffer.stock ?? 999}
                        isAvailable={displayOffer.isAvailable && displayOffer.vendor.isOpen}
                        isAdding={addIsPending}
                        isUpdating={updateIsPending}
                        onAdd={(qty) => addWithSwitch(displayOffer.vendor.id, displayOffer.id, qty)}
                        onUpdateQty={updateQty}
                        onRemove={removeLine}
                        prominentAdd
                      />
                    </div>
                    {!displayOffer.isAvailable || !displayOffer.vendor.isOpen ? (
                      <p className="text-muted-foreground text-center text-xs sm:text-end">
                        This listing isn&apos;t available right now — pick another shop below.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
                  <p className="text-muted-foreground text-xs">Available in</p>
                  <p className="text-lg font-semibold">{city}</p>
                </div>
                <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
                  <p className="text-muted-foreground text-xs">Best live price</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {bestPrice != null ? formatInr(bestPrice) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Shop offers</h2>
                <p className="text-muted-foreground text-sm">
                  Compare live shop pricing, prep time, and add to cart directly.
                </p>
              </div>
              {bestPrice != null ? (
                <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:inline-flex">
                  <BadgePercent className="size-4" />
                  Best from {formatInr(bestPrice)}
                </div>
              ) : null}
            </div>

            {searchQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-40 rounded-3xl" />
                <Skeleton className="h-40 rounded-3xl" />
              </div>
            ) : offers.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title={`No shops are listing this item in ${city}`}
                description="Try another product or check back later for new availability."
                className="bg-card/40"
              />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {offers.map((hit) => (
                  <CommerceProductCard
                    key={hit.id}
                    name={hit.vendor.name}
                    href={vendorPath(hit.vendor.id)}
                    imageUrl={hit.imageUrl ?? hit.product.imageUrl}
                    description={hit.description ?? product.description}
                    categoryName={hit.product.category?.name ?? product.category?.name}
                    subCategoryName={hit.product.subCategory?.name ?? product.subCategory?.name}
                    unit={listingSizeLabel(hit.quantityValue, hit.quantityUnit) || undefined}
                    pieces={hit.pieces ?? null}
                    servings={hit.servings ?? null}
                    price={hit.price}
                    mrp={hit.mrp}
                    availabilityLabel={hit.isAvailable && hit.vendor.isOpen ? 'Available' : 'Closed'}
                    meta={
                      <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-amber-500 text-amber-500" aria-hidden />
                          {hit.vendor.rating.toFixed(1)}
                        </span>
                        {hit.vendor.prepTime != null ? (
                          <span className="inline-flex items-center gap-1">
                            <Timer className="size-3.5" aria-hidden />
                            {hit.vendor.prepTime} min prep
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden />
                          {hit.vendor.isOpen ? 'Open now' : 'Currently closed'}
                        </span>
                      </div>
                    }
                    action={
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
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

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
