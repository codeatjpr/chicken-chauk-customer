import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useCartAddFeedbackStore } from '@/stores/cart-add-feedback-store'
import { cn } from '@/lib/utils'

const AUTO_DISMISS_MS = 5200

export function CartAddChips() {
  const chips = useCartAddFeedbackStore((s) => s.chips)
  const dismiss = useCartAddFeedbackStore((s) => s.dismiss)
  const clearAll = useCartAddFeedbackStore((s) => s.clearAll)

  useEffect(() => {
    if (chips.length === 0) return
    const t = window.setTimeout(() => clearAll(), AUTO_DISMISS_MS)
    return () => window.clearTimeout(t)
  }, [chips, clearAll])

  if (chips.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-3 max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 lg:px-6"
      aria-live="polite"
      aria-label="Recently added to cart">
      {chips.map((c) => (
        <div
          key={c.vendorProductId}
          className={cn(
            'pointer-events-auto flex max-w-md items-start gap-2 rounded-2xl border border-primary/25 bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur-md',
            'animate-in fade-in slide-in-from-bottom-2 duration-300',
          )}>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-semibold leading-snug">Added to cart</p>
            <p className="text-foreground mt-0.5 line-clamp-2 text-sm leading-snug">{c.productName}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Qty {c.quantity}
              {c.shopName ? ` · ${c.shopName}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(c.vendorProductId)}
            className="text-muted-foreground hover:text-foreground -me-0.5 rounded-lg p-1"
            aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
