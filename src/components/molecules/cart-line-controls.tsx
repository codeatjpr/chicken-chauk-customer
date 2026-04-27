import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CartSummaryDto } from '@/types/cart'

type CartLineControlsProps = {
  cart: CartSummaryDto | null | undefined
  vendorProductId: string
  maxQty: number
  isAvailable: boolean
  isAdding: boolean
  isUpdating: boolean
  onAdd: (qty: number) => void
  onUpdateQty: (itemId: string, qty: number) => void
  onRemove: (itemId: string) => void
  /** Larger primary CTA for product detail hero */
  prominentAdd?: boolean
}

export function CartLineControls({
  cart,
  vendorProductId,
  maxQty,
  isAvailable,
  isAdding,
  isUpdating,
  onAdd,
  onUpdateQty,
  onRemove,
  prominentAdd = false,
}: CartLineControlsProps) {
  const line = cart?.items.find((i) => i.vendorProductId === vendorProductId)

  if (!isAvailable) {
    return (
      <span className="text-muted-foreground text-xs font-medium">
        Out of stock
      </span>
    )
  }

  if (!line) {
    return (
      <Button
        type="button"
        size={prominentAdd ? 'lg' : 'sm'}
        className={cn(
          'shrink-0 font-semibold',
          prominentAdd
            ? 'h-10 w-auto gap-1.5 self-end rounded-lg px-4 text-sm shadow-sm sm:h-12 sm:min-w-48 sm:gap-2 sm:rounded-xl sm:px-6 sm:text-[0.9375rem]'
            : 'h-8 px-2.5 text-[11px] sm:px-3 sm:text-xs',
          prominentAdd &&
            'bg-primary text-primary-foreground border-0 hover:bg-primary/92 focus-visible:ring-primary/35',
        )}
        disabled={isAdding || maxQty < 1}
        onClick={() => onAdd(1)}
      >
        {prominentAdd ? <ShoppingCart className="size-4 shrink-0 opacity-95 sm:size-[1.15rem]" aria-hidden /> : null}
        Add to Cart
      </Button>
    )
  }

  if (prominentAdd) {
    return (
      <div
        className={cn(
          'text-foreground ml-auto flex w-auto shrink-0 items-stretch overflow-hidden rounded-lg border bg-card shadow-sm sm:rounded-xl',
          'border-border/90',
          'max-w-[10.25rem] sm:max-w-none',
        )}
        role="group"
        aria-label="Quantity"
      >
        <button
          type="button"
          disabled={isUpdating}
          aria-label={line.quantity <= 1 ? 'Remove from cart' : 'Decrease quantity'}
          onClick={() => {
            if (line.quantity <= 1) {
              onRemove(line.id)
            } else {
              onUpdateQty(line.id, line.quantity - 1)
            }
          }}
          className={cn(
            'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            'flex min-w-9 flex-1 items-center justify-center px-2 py-2 transition-colors sm:min-w-11 sm:px-3 sm:py-3',
            'focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
            'focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none',
            line.quantity <= 1 && 'hover:text-destructive',
          )}
        >
          {line.quantity <= 1 ? (
            <Trash2 className="size-4 sm:size-4.5" strokeWidth={2} aria-hidden />
          ) : (
            <Minus className="size-4 sm:size-4.5" strokeWidth={2} aria-hidden />
          )}
        </button>
        <div
          className={cn(
            'border-border/70 bg-muted/25 flex min-w-10 items-center justify-center border-x px-2 py-1.5 sm:min-w-12 sm:px-3 sm:py-2',
            'text-base font-semibold tabular-nums tracking-tight sm:text-lg',
          )}
        >
          {line.quantity}
        </div>
        <button
          type="button"
          disabled={isUpdating || line.quantity >= maxQty}
          aria-label="Increase quantity"
          onClick={() => onUpdateQty(line.id, line.quantity + 1)}
          className={cn(
            'text-muted-foreground hover:text-primary flex min-w-9 flex-1 items-center justify-center px-2 py-2 transition-colors sm:min-w-11 sm:px-3 sm:py-3',
            'hover:bg-muted/70 disabled:pointer-events-none disabled:opacity-40',
            'focus-visible:ring-ring focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none',
          )}
        >
          <Plus className="size-4 sm:size-4.5" strokeWidth={2} aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-input bg-background text-foreground inline-flex items-stretch overflow-hidden rounded-lg border shadow-sm',
      )}
      role="group"
      aria-label="Quantity"
    >
      <Button
        type="button"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground h-8 min-w-8 shrink-0 rounded-none px-2 hover:bg-muted/60"
        disabled={isUpdating}
        aria-label={line.quantity <= 1 ? 'Remove from cart' : 'Decrease quantity'}
        onClick={() => {
          if (line.quantity <= 1) {
            onRemove(line.id)
          } else {
            onUpdateQty(line.id, line.quantity - 1)
          }
        }}
      >
        {line.quantity <= 1 ? (
          <Trash2 className="text-destructive size-3.5" />
        ) : (
          <Minus className="size-3.5" />
        )}
      </Button>
      <span className="border-input flex min-w-7 items-center justify-center border-x bg-muted/15 px-1.5 text-center text-xs font-semibold tabular-nums">
        {line.quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        className="text-muted-foreground hover:text-primary h-8 min-w-8 shrink-0 rounded-none px-2 hover:bg-muted/60"
        disabled={isUpdating || line.quantity >= maxQty}
        aria-label="Increase quantity"
        onClick={() => onUpdateQty(line.id, line.quantity + 1)}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}
