import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import type { OrderDetailDto } from '@/types/order'
import * as cartApi from '@/services/cart.service'

/**
 * Clears the cart and adds each line from a past order (same vendor).
 * Callers should confirm with the user if the current cart is non-empty.
 */
export async function reorderFromOrder(
  order: OrderDetailDto,
  qc: QueryClient,
): Promise<void> {
  await cartApi.clearCart()
  for (const line of order.items) {
    await cartApi.addCartItem({
      vendorProductId: line.vendorProductId,
      quantity: line.quantity,
    })
  }
  await qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
}
