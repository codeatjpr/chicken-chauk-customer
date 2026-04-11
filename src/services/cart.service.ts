import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { CartSummaryDto } from '@/types/cart'
import type { CartValidationResultDto, PaymentMethodDto } from '@/types/order'

export async function clearCart(): Promise<void> {
  const { data } = await axiosInstance.delete<ApiSuccess<null>>('/cart')
  if (!data.success) {
    throw new Error(data.message ?? 'Could not clear cart')
  }
}

export async function fetchCart(): Promise<CartSummaryDto | null> {
  const { data } = await axiosInstance.get<ApiSuccess<CartSummaryDto | null>>(
    '/cart',
  )
  if (!data.success) {
    throw new Error(data.message ?? 'Cart error')
  }
  return data.data ?? null
}

export async function addCartItem(body: {
  vendorProductId: string
  quantity: number
}): Promise<CartSummaryDto> {
  const { data } = await axiosInstance.post<ApiSuccess<CartSummaryDto>>(
    '/cart/items',
    body,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not add to cart')
  }
  return data.data
}

export async function updateCartItem(
  itemId: string,
  body: { quantity: number },
): Promise<CartSummaryDto> {
  const { data } = await axiosInstance.put<ApiSuccess<CartSummaryDto>>(
    `/cart/items/${itemId}`,
    body,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not update cart')
  }
  return data.data
}

export async function validateCartForCheckout(body: {
  deliveryAddressId: string
  paymentMethod: PaymentMethodDto
  couponCode?: string
  walletAmountToUse?: number
}): Promise<CartValidationResultDto> {
  const { data } = await axiosInstance.post<
    ApiSuccess<CartValidationResultDto>
  >('/cart/validate', {
    walletAmountToUse: 0,
    ...body,
  })
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Cart validation failed')
  }
  return data.data
}

export async function removeCartItem(
  itemId: string,
): Promise<CartSummaryDto | null> {
  const { data } = await axiosInstance.delete<
    ApiSuccess<CartSummaryDto | null>
  >(`/cart/items/${itemId}`)
  if (!data.success) {
    throw new Error(data.message ?? 'Could not remove item')
  }
  return data.data ?? null
}
