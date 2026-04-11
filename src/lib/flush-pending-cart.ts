import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { clearPendingCartAdd, getPendingCartAdd } from '@/lib/pending-cart'
import { addCartItem } from '@/services/cart.service'

/** Applies a stored “add to cart” after OTP + optional profile onboarding. */
export async function flushPendingCartAdd(qc: QueryClient): Promise<boolean> {
  const p = getPendingCartAdd()
  if (!p) return false
  try {
    await addCartItem({
      vendorProductId: p.vendorProductId,
      quantity: p.quantity,
    })
    clearPendingCartAdd()
    await qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
    return true
  } catch {
    clearPendingCartAdd()
    return false
  }
}
