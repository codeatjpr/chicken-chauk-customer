import { Link } from 'react-router-dom'
import { CartLineControls } from '@/components/molecules/cart-line-controls'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES, vendorPath } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import { formatInr } from '@/utils/format'
import { cn } from '@/lib/utils'

export function CartPage() {
  const { data: cart, isLoading } = useCartQuery()
  const {
    addIsPending,
    updateIsPending,
    updateQty,
    removeLine,
    addWithSwitch,
  } = useVendorCartActions()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
        <Link
          to={ROUTES.home}
          className={cn(buttonVariants(), 'inline-flex')}
        >
          Browse vendors
        </Link>
      </div>
    )
  }

  const vendorId = cart.vendorId

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Your cart</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          From{' '}
          <Link
            to={vendorPath(vendorId)}
            className="text-foreground font-medium hover:underline"
          >
            {cart.vendorName}
          </Link>
        </p>
      </div>

      <ul className="space-y-4">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className="border-border/80 flex gap-3 rounded-xl border p-3"
          >
            <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-lg">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground flex size-full items-center justify-center text-sm font-medium">
                  {item.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'font-medium',
                  !item.isAvailable && 'text-muted-foreground line-through',
                )}
              >
                {item.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {item.unit} · {formatInr(item.currentPrice)} each
              </p>
              {item.priceChanged && (
                <p className="text-amber-700 dark:text-amber-300 mt-1 text-xs">
                  Price updated since you added this item.
                </p>
              )}
              <p className="mt-2 text-sm font-semibold tabular-nums">
                {formatInr(item.total)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end justify-center">
              <CartLineControls
                cart={cart}
                vendorProductId={item.vendorProductId}
                maxQty={Math.max(0, item.stock)}
                isAvailable={item.isAvailable}
                isAdding={addIsPending}
                isUpdating={updateIsPending}
                onAdd={(qty) =>
                  addWithSwitch(vendorId, item.vendorProductId, qty)
                }
                onUpdateQty={updateQty}
                onRemove={removeLine}
              />
            </div>
          </li>
        ))}
      </ul>

      <Separator />

      <div className="text-muted-foreground space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Items</span>
          <span className="tabular-nums text-foreground">
            {formatInr(cart.itemsTotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span
            className={cn(
              'tabular-nums',
              cart.deliveryFee === 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-foreground',
            )}
          >
            {cart.deliveryFee === 0 ? 'FREE' : formatInr(cart.deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Platform fee</span>
          <span className="tabular-nums text-foreground">
            {formatInr(cart.platformFee)}
          </span>
        </div>
        <Separator className="my-3" />
        <div className="text-foreground flex justify-between text-base font-semibold">
          <span>Estimated total</span>
          <span className="tabular-nums">
            {formatInr(cart.estimatedTotal)}
          </span>
        </div>
      </div>

      <Link
        to={ROUTES.checkout}
        className={cn(buttonVariants(), 'flex w-full justify-center')}
      >
        Proceed to checkout
      </Link>
    </div>
  )
}
