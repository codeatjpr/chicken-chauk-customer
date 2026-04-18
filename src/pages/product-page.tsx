import { useQuery } from '@tanstack/react-query'
import { BadgePercent, MapPin, Sparkles, Star, Timer } from 'lucide-react'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
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
import { useLocationStore } from '@/stores/location-store'
import { formatInr } from '@/utils/format'
import {
  formatVariantNameWithWeight,
  formatVariantWeightAndUnit,
} from '@/utils/variant-display'

export function ProductPage() {
  const { id: productId = '' } = useParams<{ id: string }>()
  const { city } = useLocationStore()

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

  const variantsQuery = useQuery({
    queryKey: queryKeys.catalog.productVariants(productId),
    queryFn: () => catalogApi.fetchProductVariants(productId),
    enabled: Boolean(productId),
  })

  const product = productQuery.data

  const searchQuery = useQuery({
    queryKey: [
      ...queryKeys.discovery.search(product?.name ?? '_', city),
      'product-offers',
      productId,
    ] as const,
    queryFn: () =>
      fetchDiscoverySearch({
        q: product!.name,
        city,
        limit: 50,
      }),
    enabled: Boolean(product?.name && productId),
  })

  const variants = useMemo(() => {
    if (variantsQuery.data?.length) return variantsQuery.data
    return product?.variants?.filter((variant) => variant.isActive) ?? []
  }, [product?.variants, variantsQuery.data])

  const offers = useMemo(() => {
    const items = searchQuery.data?.products.items ?? []
    return items
      .filter((hit) => hit.product.id === productId)
      .sort((a, b) => a.price - b.price)
  }, [productId, searchQuery.data])

  const bestPrice = offers.length > 0 ? Math.min(...offers.map((offer) => offer.price)) : null

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
          <Skeleton className="aspect-square rounded-3xl" />
          <Skeleton className="h-112 rounded-3xl" />
        </div>
      ) : productQuery.isError || !product ? (
        <p className="text-destructive text-sm">Product not found.</p>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="from-primary/10 via-muted to-muted/70 relative aspect-square overflow-hidden rounded-3xl border bg-linear-to-br shadow-sm">
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

            <div className="from-primary/10 via-background to-background border-border/60 rounded-3xl border bg-linear-to-br p-6 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {product.category ? (
                  <Badge variant="secondary">{product.category.name}</Badge>
                ) : null}
                <Badge variant="outline">{product.unit}</Badge>
                {offers.length > 0 ? <Badge variant="outline">{offers.length} vendors</Badge> : null}
              </div>

              <p className="text-primary mt-4 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase">
                <Sparkles className="size-3.5" />
                Product detail
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {product.name}
              </h1>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
                {product.description ?? 'Fresh quality, curated for quick delivery and easy comparison across vendors.'}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
                  <p className="text-muted-foreground text-xs">Available in</p>
                  <p className="text-lg font-semibold">{city}</p>
                </div>
                <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
                  <p className="text-muted-foreground text-xs">Best live price</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {bestPrice != null ? formatInr(bestPrice) : 'Unavailable'}
                  </p>
                </div>
              </div>

              {variants.length > 0 ? (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold tracking-tight">Available variants</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variants.map((variant) => (
                      <Badge key={variant.id} variant="outline" className="rounded-full px-3 py-1">
                        {formatVariantNameWithWeight(
                          variant.name,
                          variant.weight,
                          variant.unit,
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Vendor offers</h2>
                <p className="text-muted-foreground text-sm">
                  Compare live vendor pricing, prep time, and add to cart directly.
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
                title={`No vendors are listing this item in ${city}`}
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
                    description={
                      hit.variant
                        ? `${product.name} · ${formatVariantWeightAndUnit(hit.variant.weight, hit.variant.unit)}`
                        : product.description
                    }
                    categoryName={product.category?.name}
                    unit={product.unit}
                    variantLabel={
                      hit.variant
                        ? formatVariantNameWithWeight(
                            hit.variant.name,
                            hit.variant.weight,
                            hit.variant.unit,
                          )
                        : undefined
                    }
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
