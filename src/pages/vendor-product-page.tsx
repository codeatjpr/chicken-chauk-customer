import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  PackageX,
  Salad,
  Scale,
  Star,
  Store,
  Timer,
  Utensils,
  XCircle,
} from 'lucide-react'
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
import { ProductCard } from '@/components/molecules/product-card'
import { ProductImageGallery } from '@/components/molecules/product-image-gallery'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { categoryPath, vendorPath, vendorProductPath } from '@/constants/routes'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import { pickMerchLabel } from '@/lib/merch-label'
import { RichTextBody } from '@/components/molecules/rich-text-body'
import { listingSizeLabel, piecesDisplay, servingsDisplay } from '@/lib/pack-display'
import { cn } from '@/lib/utils'
import { fetchVendorProductById, fetchVendorProducts } from '@/services/catalog.service'
import { formatInr } from '@/utils/format'

function shopAddressBlock(v: {
  addressLine: string
  city: string
  pincode: string
}): string {
  const main = [v.addressLine, v.city].filter(Boolean).join(', ')
  return v.pincode ? `${main} - ${v.pincode}` : main
}

export function VendorProductPage() {
  const { id = '' } = useParams<{ id: string }>()

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

  const vpQuery = useQuery({
    queryKey: queryKeys.catalog.vendorProduct(id),
    queryFn: () => fetchVendorProductById(id),
    enabled: Boolean(id),
  })

  const vp = vpQuery.data

  const similarQuery = useQuery({
    queryKey: [...queryKeys.catalog.vendorProducts(vp?.vendor.id ?? ''), 'similar', id] as const,
    queryFn: () => fetchVendorProducts(vp!.vendor.id, { limit: 24 }),
    enabled: Boolean(vp?.vendor.id),
  })

  const similarItems = useMemo(() => {
    const items = similarQuery.data?.items ?? []
    return items.filter((row) => row.id !== id).slice(0, 8)
  }, [similarQuery.data?.items, id])

  const isAvailableForPurchase = Boolean(
    vp?.isAvailable && vp?.vendor.isOpen && vp?.vendor.isActive,
  )
  const discount =
    vp?.mrp != null && vp.mrp > vp.price
      ? Math.round(((vp.mrp - vp.price) / vp.mrp) * 100)
      : null

  if (!id) {
    return <p className="text-muted-foreground text-sm">Invalid product link.</p>
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <Link
          to={-1 as never}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'inline-flex gap-1.5 -ms-2')}
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </div>

      {vpQuery.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <Skeleton className="aspect-4/3 w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-1/2 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      ) : vpQuery.isError || !vp ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <PackageX className="text-muted-foreground size-12" />
          <p className="text-lg font-semibold">Product not found</p>
          <p className="text-muted-foreground text-sm">
            This listing may have been removed or is no longer available.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
            <ProductImageGallery
              urls={[vp.imageUrl, vp.product.imageUrl]}
              alt={vp.product.name}
              fallbackLetter={vp.product.name}
              discountPercent={discount}
              unavailable={!isAvailableForPurchase}
              unavailableLabel={
                !vp.vendor.isOpen
                  ? 'Shop closed'
                  : !vp.vendor.isActive
                    ? 'Shop unavailable'
                    : 'Unavailable'
              }
            />

            {/* ── Main copy & buy box ── */}
            <div className="space-y-5">
              {vp.product.category || vp.product.subCategory ? (
                <div className="flex flex-wrap items-stretch gap-2 sm:gap-3">
                  {vp.product.category ? (
                    <Link
                      to={categoryPath(vp.product.category.id)}
                      className={cn(
                        'border-primary/35 from-primary/15 hover:border-primary/50 focus-visible:ring-primary/30',
                        'inline-flex min-h-13 min-w-0 max-w-full flex-col justify-center rounded-2xl border bg-linear-to-br to-primary/5',
                        'px-3 py-2 shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-4',
                      )}
                    >
                      <span className="text-primary/80 text-[10px] font-bold uppercase tracking-wider">
                        Category
                      </span>
                      <span className="text-primary mt-0.5 text-sm font-semibold sm:text-base">
                        {vp.product.category.name}
                      </span>
                    </Link>
                  ) : null}
                  {vp.product.subCategory && vp.product.category ? (
                    <Link
                      to={`${categoryPath(vp.product.category.id)}?sub=${encodeURIComponent(
                        vp.product.subCategory.id,
                      )}`}
                      className={cn(
                        'border-emerald-500/35 from-emerald-500/12 hover:border-emerald-500/55 focus-visible:ring-emerald-500/30',
                        'inline-flex min-h-13 min-w-0 max-w-full flex-col justify-center rounded-2xl border border-dashed bg-linear-to-br to-emerald-600/5',
                        'px-3 py-2 shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-4',
                      )}
                    >
                      <span className="text-emerald-800/80 dark:text-emerald-300/90 text-[10px] font-bold uppercase tracking-wider">
                        Sub-category
                      </span>
                      <span className="mt-0.5 text-sm font-semibold text-emerald-950 dark:text-emerald-100 sm:text-base">
                        {vp.product.subCategory.name}
                      </span>
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {vp.product.name}
                </h1>
                {vp.product.description?.trim() ? (
                  <RichTextBody
                    source={vp.product.description}
                    className="text-muted-foreground mt-3"
                  />
                ) : null}
              </div>

              {(listingSizeLabel(vp.quantityValue, vp.quantityUnit) || vp.pieces || vp.servings) && (
                <div className="flex flex-wrap gap-2">
                  {listingSizeLabel(vp.quantityValue, vp.quantityUnit) ? (
                    <span className="bg-muted/80 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                      <Scale className="size-4 shrink-0 opacity-70" aria-hidden />
                      {listingSizeLabel(vp.quantityValue, vp.quantityUnit)}
                    </span>
                  ) : null}
                  {vp.pieces ? (
                    <span className="bg-muted/80 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                      <Utensils className="size-4 shrink-0 opacity-70" aria-hidden />
                      <span className="text-foreground">{piecesDisplay(vp.pieces)}</span>
                    </span>
                  ) : null}
                  {vp.servings ? (
                    <span className="bg-muted/80 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                      <Salad className="size-4 shrink-0 opacity-70" aria-hidden />
                      <span className="text-foreground">{servingsDisplay(vp.servings)}</span>
                    </span>
                  ) : null}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-3xl font-bold tracking-tight tabular-nums">
                      {formatInr(vp.price)}
                    </p>
                    {discount != null ? (
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {discount}% off
                      </span>
                    ) : null}
                  </div>
                  {vp.mrp != null && vp.mrp > vp.price ? (
                    <p className="text-muted-foreground text-sm">
                      <span className="tabular-nums line-through">MRP: {formatInr(vp.mrp)}</span>
                      <span className="ms-2 text-xs">(incl. of all taxes)</span>
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs">(incl. of all taxes)</p>
                  )}
                </div>
                <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                  <CartLineControls
                    cart={cart}
                    vendorProductId={vp.id}
                    maxQty={Math.max(0, vp.stock)}
                    isAvailable={isAvailableForPurchase}
                    isAdding={addIsPending}
                    isUpdating={updateIsPending}
                    onAdd={(qty) => addWithSwitch(vp.vendor.id, vp.id, qty)}
                    onUpdateQty={updateQty}
                    onRemove={removeLine}
                    prominentAdd
                  />
                  {!isAvailableForPurchase && (
                    <p className="text-muted-foreground text-right text-xs">
                      {!vp.vendor.isOpen
                        ? 'This shop is closed right now.'
                        : !vp.vendor.isActive
                          ? 'This shop is not accepting orders.'
                          : 'This item is not available right now.'}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* ── Shop (single block — no duplicate prep/location rows) ── */}
              <div className="bg-card rounded-2xl border p-4">
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                  Shop
                </p>
                <Link
                  to={vendorPath(vp.vendor.id)}
                  className="group flex items-start gap-3 rounded-xl transition-colors hover:bg-muted/50 -mx-1 px-1 py-1"
                >
                  <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-xl border">
                    {vp.vendor.logoUrl ? (
                      <img
                        src={vp.vendor.logoUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex size-full items-center justify-center text-lg font-semibold">
                        <Store className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {vp.vendor.name}
                    </p>
                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-500 text-amber-500" aria-hidden />
                        {vp.vendor.rating.toFixed(1)}
                        <span className="opacity-70">({vp.vendor.totalRatings} ratings)</span>
                      </span>
                      {vp.vendor.prepTime != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Timer className="size-3.5" aria-hidden />
                          {vp.vendor.prepTime} min prep
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-medium',
                          vp.vendor.isOpen ? 'text-emerald-700 dark:text-emerald-400' : '',
                        )}
                      >
                        {vp.vendor.isOpen ? (
                          <>
                            <CheckCircle2 className="size-3.5" aria-hidden />
                            Open now
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3.5" aria-hidden />
                            Closed
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-foreground flex items-start gap-2 text-sm leading-snug">
                      <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>{shopAddressBlock(vp.vendor)}</span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {vp.stock > 0
                        ? `${vp.stock} units in stock`
                        : 'Out of stock'}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Shop-specific listing copy (master product copy stays in the column above) */}
          {vp.description?.trim() ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight">About this listing</h2>
              <RichTextBody source={vp.description} className="text-muted-foreground" />
            </section>
          ) : null}

          {/* ── Similar from this shop ── */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Similar products from this shop</h2>
              <Link
                to={vendorPath(vp.vendor.id)}
                className="text-primary text-sm font-medium hover:underline"
              >
                View shop menu
              </Link>
            </div>
            {similarQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-3/4 rounded-xl" />
                ))}
              </div>
            ) : similarItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">No other items from this shop yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {similarItems.map((row, i) => {
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
                      vendorName={vp.vendor.name}
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
                          isAvailable={row.isAvailable && vp.vendor.isOpen}
                          isAdding={addIsPending}
                          isUpdating={updateIsPending}
                          onAdd={(qty) => addWithSwitch(vp.vendor.id, row.id, qty)}
                          onUpdateQty={updateQty}
                          onRemove={removeLine}
                        />
                      }
                    />
                  )
                })}
              </div>
            )}
          </section>
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
