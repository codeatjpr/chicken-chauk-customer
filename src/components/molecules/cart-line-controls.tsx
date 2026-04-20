import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        size="sm"
        className="h-8 shrink-0 px-2.5 text-[11px] font-semibold sm:px-3 sm:text-xs"
        disabled={isAdding || maxQty < 1}
        onClick={() => onAdd(1)}
      >
        Add to cart
      </Button>
    )
  }

  return (
    <div className="border-input bg-background inline-flex items-center gap-0 rounded-full border p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
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
      <span className="min-w-[1.25rem] text-center text-sm font-medium tabular-nums">
        {line.quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        disabled={isUpdating || line.quantity >= maxQty}
        aria-label="Increase quantity"
        onClick={() => onUpdateQty(line.id, line.quantity + 1)}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}
