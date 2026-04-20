import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { clearGuestCart, loadGuestCart } from '@/lib/guest-cart-storage'
import { addCartItem } from '@/services/cart.service'

/** Pushes the local guest cart to the server after sign-in. Returns true if anything was merged. */
export async function flushGuestCartToServer(qc: QueryClient): Promise<boolean> {
  const raw = loadGuestCart()
  if (!raw?.items.length) return false
  try {
    for (const line of raw.items) {
      await addCartItem({
        vendorProductId: line.vendorProductId,
        quantity: line.quantity,
      })
    }
    clearGuestCart()
    await qc.invalidateQueries({ queryKey: queryKeys.cart.guestSummary })
    await qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
    return true
  } catch {
    return false
  }
}
