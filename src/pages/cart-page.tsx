import { ShoppingCart } from 'lucide-react'
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
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'

export function CartPage() {
  const authed = useAuthStore(selectIsAuthenticated)
  const { data: cart, isLoading } = useCartQuery()
  const { addIsPending, updateIsPending, updateQty, removeLine, addWithSwitch } =
    useVendorCartActions()

  if (isLoading) {
    return (
      <div className="space-y-4 py-6 lg:grid lg:grid-cols-[1fr_min(420px,40vw)] lg:gap-0 lg:space-y-0">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
        <div className="bg-muted flex size-20 items-center justify-center rounded-full">
          <ShoppingCart className="text-muted-foreground size-9" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Your cart is empty</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse shops near you and add items to get started.
          </p>
        </div>
        <Link to={ROUTES.stores} className={cn(buttonVariants())}>
          Browse shops near you
        </Link>
      </div>
    )
  }

  const vendorId = cart.vendorId

  return (
    <div className="pb-8 lg:pb-12">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ordering from{' '}
          <Link to={vendorPath(vendorId)} className="text-foreground font-medium hover:underline">
            {cart.vendorName}
          </Link>
        </p>
      </div>

      {/* Desktop: scrollable lines + sticky summary rail (Zepto-style) */}
      <div className="lg:grid lg:grid-cols-[1fr_min(420px,40vw)] lg:min-h-[calc(100vh-7rem)] lg:items-start lg:gap-0">

        {/* ── LEFT: Cart items ── */}
        <div className="space-y-3 lg:max-h-[calc(100vh-7rem)] lg:min-h-0 lg:overflow-y-auto lg:pr-6 lg:pb-8">
          {cart.hasChanges && (
            <div className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 rounded-2xl border px-4 py-3 text-sm">
              Prices or availability may have changed since you added these items.
            </div>
          )}

          {cart.items.map((item) => (
            <div
              key={item.id}
              className="border-border/70 bg-card flex gap-4 rounded-2xl border p-4"
            >
              <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-xl">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-muted-foreground flex size-full items-center justify-center text-lg font-semibold">
                    {item.name.slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'font-semibold',
                    !item.isAvailable && 'text-muted-foreground line-through',
                  )}
                >
                  {item.name}
                </p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {item.unit} · {formatInr(item.currentPrice)} each (incl. of all taxes)
                </p>
                {item.priceChanged && (
                  <p className="text-amber-700 dark:text-amber-300 mt-1 text-xs">
                    Price updated since you added this item.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                <p className="text-base font-semibold tabular-nums">{formatInr(item.total)}</p>
                <CartLineControls
                  cart={cart}
                  vendorProductId={item.vendorProductId}
                  maxQty={Math.max(0, item.stock)}
                  isAvailable={item.isAvailable}
                  isAdding={addIsPending}
                  isUpdating={updateIsPending}
                  onAdd={(qty) => addWithSwitch(vendorId, item.vendorProductId, qty)}
                  onUpdateQty={updateQty}
                  onRemove={removeLine}
                />
              </div>
            </div>
          ))}

          <Link
            to={vendorPath(vendorId)}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'mt-2 w-full justify-center lg:w-auto',
            )}
          >
            + Add more items
          </Link>
        </div>

        {/* ── RIGHT: Order summary ── */}
        <div className="mt-6 lg:mt-0 lg:border-border lg:bg-card/30 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:border-l lg:pl-6">
          <div className="border-border/70 bg-card rounded-2xl border p-6 lg:shadow-sm">
            <h2 className="mb-4 text-base font-semibold">Order summary</h2>

            <div className="text-muted-foreground space-y-3 text-sm">
              <div className="flex justify-between">
                <span>
                  Items ({cart.items.reduce((s, i) => s + i.quantity, 0)})
                </span>
                <span className="tabular-nums text-foreground">{formatInr(cart.itemsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span
                  className={cn(
                    'tabular-nums',
                    cart.deliveryFee === 0
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-foreground',
                  )}
                >
                  {cart.deliveryFee === 0 ? 'FREE' : formatInr(cart.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee</span>
                <span
                  className={cn(
                    'tabular-nums',
                    cart.platformFee === 0
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-foreground',
                  )}
                >
                  {cart.platformFee === 0 ? 'FREE' : formatInr(cart.platformFee)}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between text-base font-semibold">
              <span>Estimated total</span>
              <span className="tabular-nums">{formatInr(cart.estimatedTotal)}</span>
            </div>

            {authed ? (
              <Link
                to={ROUTES.checkout}
                className={cn(buttonVariants({ size: 'lg' }), 'mt-5 flex w-full justify-center')}
              >
                Proceed to checkout
              </Link>
            ) : (
              <Link
                to={ROUTES.login}
                state={{ from: ROUTES.checkout }}
                className={cn(buttonVariants({ size: 'lg' }), 'mt-5 flex w-full justify-center')}
              >
                Sign in to checkout
              </Link>
            )}

            <p className="text-muted-foreground mt-3 text-center text-xs">
              {authed
                ? 'Prices are inclusive of all taxes. Fees follow platform settings at checkout.'
                : 'Sign in to place your order. Your cart is saved on this device until then.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
