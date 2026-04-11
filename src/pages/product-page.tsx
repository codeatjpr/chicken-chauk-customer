import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Star, Timer } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES, vendorPath } from '@/constants/routes'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import { fetchProductById } from '@/services/catalog.service'
import { fetchDiscoverySearch } from '@/services/discovery.service'
import { useLocationStore } from '@/stores/location-store'
import { formatInr } from '@/utils/format'

export function ProductPage() {
  const { id: productId = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
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

  const productQuery = useQuery({
    queryKey: queryKeys.catalog.product(productId),
    queryFn: () => fetchProductById(productId),
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

  const offers = useMemo(() => {
    const items = searchQuery.data?.products.items ?? []
    return items.filter((h) => h.product.id === productId)
  }, [searchQuery.data, productId])

  if (!productId) {
    return (
      <p className="text-muted-foreground text-sm">Invalid product link.</p>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Link
          to={ROUTES.home}
          className="text-muted-foreground text-sm hover:underline"
        >
          Home
        </Link>
      </div>

      {productQuery.isLoading ? (
        <Skeleton className="aspect-square max-w-sm rounded-xl" />
      ) : productQuery.isError || !product ? (
        <p className="text-destructive text-sm">Product not found.</p>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="bg-muted aspect-square w-full max-w-sm shrink-0 overflow-hidden rounded-xl">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground flex size-full items-center justify-center text-5xl font-semibold">
                  {product.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {product.name}
              </h1>
              {product.category && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {product.category.name}
                </p>
              )}
              <p className="text-muted-foreground mt-3 text-sm">
                {product.description ?? 'Fresh quality, delivered fast.'}
              </p>
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">Sold as </span>
                <span className="font-medium">{product.unit}</span>
              </p>
            </div>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-tight">
              Available from vendors
            </h2>
            {searchQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            ) : offers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No vendors are listing this item in {city} right now.
              </p>
            ) : (
              <ul className="space-y-3">
                {offers.map((hit) => (
                  <li
                    key={hit.id}
                    className="border-border/80 bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={vendorPath(hit.vendor.id)}
                        className="font-medium hover:underline"
                      >
                        {hit.vendor.name}
                      </Link>
                      <div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Star
                            className="size-3.5 fill-amber-500 text-amber-500"
                            aria-hidden
                          />
                          {hit.vendor.rating.toFixed(1)}
                        </span>
                        {hit.vendor.prepTime != null && (
                          <span className="inline-flex items-center gap-1">
                            <Timer className="size-3.5" aria-hidden />
                            {hit.vendor.prepTime} min
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden />
                          {hit.vendor.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <p className="mt-2 font-semibold tabular-nums">
                        {formatInr(hit.price)}
                      </p>
                    </div>
                    <div className="flex shrink-0 justify-end">
                      <CartLineControls
                        cart={cart}
                        vendorProductId={hit.id}
                        maxQty={999}
                        isAvailable={hit.isAvailable && hit.vendor.isOpen}
                        isAdding={addIsPending}
                        isUpdating={updateIsPending}
                        onAdd={(qty) =>
                          addWithSwitch(hit.vendor.id, hit.id, qty)
                        }
                        onUpdateQty={updateQty}
                        onRemove={removeLine}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <AlertDialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cart has items from another vendor. Continuing will clear
              your current cart.
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
