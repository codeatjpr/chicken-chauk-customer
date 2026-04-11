import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import type { CartSummaryDto } from '@/types/cart'
import { formatInr } from '@/utils/format'

type CartPanelProps = {
  cart: CartSummaryDto | null | undefined
  isLoading?: boolean
  showCheckout?: boolean
  onCheckout?: () => void
}

export function CartPanel({
  cart,
  isLoading,
  showCheckout = true,
  onCheckout,
}: CartPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-center text-sm">
        Cart is empty — add items from a vendor menu.
      </div>
    )
  }

  return (
    <div className="flex max-h-[min(70vh,520px)] flex-col gap-3">
      <div className="text-muted-foreground text-xs font-medium">
        Ordering from{' '}
        <span className="text-foreground font-semibold">{cart.vendorName}</span>
      </div>
      {cart.hasChanges && (
        <p className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 rounded-lg border px-2 py-1.5 text-xs">
          Prices or availability changed since you added items.
        </p>
      )}
      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pe-1">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className="flex gap-2 text-sm"
            data-unavailable={!item.isAvailable}
          >
            <div className="min-w-0 flex-1">
              <p
                className={`font-medium ${!item.isAvailable ? 'text-muted-foreground line-through' : ''}`}
              >
                {item.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {item.unit} · {formatInr(item.currentPrice)} each
              </p>
            </div>
            <div className="text-end">
              <p className="font-medium tabular-nums">{formatInr(item.total)}</p>
              <p className="text-muted-foreground text-xs">×{item.quantity}</p>
            </div>
          </li>
        ))}
      </ul>
      <Separator />
      <div className="text-muted-foreground space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Items</span>
          <span className="tabular-nums text-foreground">
            {formatInr(cart.itemsTotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span
            className={`tabular-nums ${cart.deliveryFee === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}
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
        <Separator className="my-2" />
        <div className="text-foreground flex justify-between text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatInr(cart.estimatedTotal)}</span>
        </div>
      </div>
      {showCheckout && (
        <div className="flex flex-col gap-2">
          <Link
            to={ROUTES.checkout}
            className={cn(buttonVariants(), 'w-full justify-center')}
          >
            Checkout
          </Link>
          <Link
            to={ROUTES.cart}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-full justify-center',
            )}
          >
            View full cart
          </Link>
        </div>
      )}
      {onCheckout && (
        <button
          type="button"
          className={cn(buttonVariants(), 'w-full')}
          onClick={onCheckout}
        >
          Proceed to checkout
        </button>
      )}
    </div>
  )
}
