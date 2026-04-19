import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  PackageX,
  Salad,
  ShieldCheck,
  Star,
  Store,
  Timer,
  Weight,
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
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { categoryPath, vendorPath } from '@/constants/routes'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import { fetchVendorProductById } from '@/services/catalog.service'
import { formatInr } from '@/utils/format'
import { cn } from '@/lib/utils'

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

  const isAvailableForPurchase = Boolean(vp?.isAvailable && vp?.vendor.isOpen && vp?.vendor.isActive)
  const discount =
    vp?.mrp != null && vp.mrp > vp.price
      ? Math.round(((vp.mrp - vp.price) / vp.mrp) * 100)
      : null

  if (!id) {
    return <p className="text-muted-foreground text-sm">Invalid product link.</p>
  }

  return (
    <div className="space-y-6 pb-10">
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Skeleton className="aspect-square rounded-3xl" />
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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          {/* ── Product image ─────────────────────────────────────────── */}
          <div className="relative">
            <div
              className={cn(
                'from-muted via-muted to-muted/60 relative aspect-square overflow-hidden rounded-3xl border bg-linear-to-br shadow-sm',
                !isAvailableForPurchase && 'opacity-80',
              )}
            >
              {vp.imageUrl ?? vp.product.imageUrl ? (
                <img
                  src={(vp.imageUrl ?? vp.product.imageUrl)!}
                  alt={vp.product.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex size-full items-center justify-center text-6xl font-semibold">
                  {vp.product.name.slice(0, 1)}
                </div>
              )}
              {discount != null && (
                <div className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow">
                  {discount}% off
                </div>
              )}
              {!isAvailableForPurchase && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/30 backdrop-blur-[2px]">
                  <span className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white">
                    {!vp.vendor.isOpen ? 'Store closed' : 'Unavailable'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Product details ───────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Breadcrumb badges */}
            <div className="flex flex-wrap gap-2">
              {vp.product.category ? (
                <Link to={categoryPath(vp.product.category.id)}>
                  <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                    {vp.product.category.name}
                  </Badge>
                </Link>
              ) : null}
              {isAvailableForPurchase ? (
                <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
                  <CheckCircle2 className="size-3" />
                  In stock
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <XCircle className="size-3" />
                  {!vp.vendor.isOpen ? 'Store closed' : 'Unavailable'}
                </Badge>
              )}
            </div>

            {/* Name */}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {vp.product.name}
              </h1>
              {/* Quantity row: weight + pieces + servings */}
              {(vp.quantityValue || vp.pieces || vp.servings) ? (
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {vp.quantityValue ? (
                    <span className="inline-flex items-center gap-1">
                      <Weight className="size-3.5" />
                      {vp.quantityValue} {vp.quantityUnit ?? ''}
                    </span>
                  ) : null}
                  {vp.pieces ? (
                    <span className="inline-flex items-center gap-1">
                      <Layers className="size-3.5" />
                      {vp.pieces}
                    </span>
                  ) : null}
                  {vp.servings ? (
                    <span className="inline-flex items-center gap-1">
                      <Salad className="size-3.5" />
                      {vp.servings}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {(vp.description ?? vp.product.description) ? (
                <div
                  className="prose prose-sm dark:prose-invert mt-3 max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: (vp.description ?? vp.product.description)! }}
                />
              ) : null}
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold tracking-tight tabular-nums">
                {formatInr(vp.price)}
              </p>
              {vp.mrp != null && vp.mrp > vp.price ? (
                <div className="mb-0.5">
                  <p className="text-muted-foreground text-sm line-through tabular-nums">
                    {formatInr(vp.mrp)}
                  </p>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    You save {formatInr(vp.mrp - vp.price)}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Add to cart */}
            <div className="flex items-center gap-3">
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
              />
              {!isAvailableForPurchase && (
                <p className="text-muted-foreground text-xs">
                  {!vp.vendor.isOpen
                    ? 'This store is currently closed. Check back later.'
                    : 'This item is not available right now.'}
                </p>
              )}
            </div>

            <Separator />

            {/* Vendor info card */}
            <div className="bg-card rounded-2xl border p-4">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Sold by
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
                <div className="min-w-0 flex-1">
                  <p className="font-semibold group-hover:text-primary transition-colors">
                    {vp.vendor.name}
                  </p>
                  <div className="text-muted-foreground mt-1 flex flex-wrap gap-3 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3 fill-amber-500 text-amber-500" />
                      {vp.vendor.rating.toFixed(1)}{' '}
                      <span className="opacity-60">({vp.vendor.totalRatings})</span>
                    </span>
                    {vp.vendor.prepTime != null && (
                      <span className="inline-flex items-center gap-1">
                        <Timer className="size-3" />
                        {vp.vendor.prepTime} min
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {vp.vendor.city}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                    vp.vendor.isOpen
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {vp.vendor.isOpen ? 'Open' : 'Closed'}
                </div>
              </Link>
            </div>

            {/* Product details list */}
            <div className="bg-card rounded-2xl border divide-y">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Availability
                </span>
                <span className="font-medium">
                  {vp.stock > 0
                    ? `${vp.stock} units in stock`
                    : 'Out of stock'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="size-4" />
                  Prep time
                </span>
                <span className="font-medium">
                  {vp.vendor.prepTime != null ? `${vp.vendor.prepTime} min` : 'Quick'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="size-4" />
                  Location
                </span>
                <span className="font-medium">{vp.vendor.city}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
