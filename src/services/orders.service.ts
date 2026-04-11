import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { PaginatedResult } from '@/types/pagination'
import { validateCartForCheckout } from '@/services/cart.service'
import type {
  CartValidationResultDto,
  OrderDetailDto,
  OrderListItemDto,
  PaymentMethodDto,
} from '@/types/order'

export async function placeOrder(body: {
  cartId: string
  deliveryAddressId: string
  paymentMethod: PaymentMethodDto
  couponCode?: string
  walletAmountToUse?: number
  specialInstructions?: string
  isScheduled?: boolean
  scheduledAt?: string
}): Promise<OrderDetailDto> {
  const { data } = await axiosInstance.post<ApiSuccess<OrderDetailDto>>(
    '/orders',
    {
      walletAmountToUse: 0,
      isScheduled: false,
      ...body,
    },
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not place order')
  }
  return data.data
}

export async function validateAndPlaceOrder(params: {
  deliveryAddressId: string
  paymentMethod: PaymentMethodDto
  couponCode?: string
  walletAmountToUse?: number
  specialInstructions?: string
}): Promise<{ validation: CartValidationResultDto; order: OrderDetailDto }> {
  const walletAmountToUse = params.walletAmountToUse ?? 0
  const validation = await validateCartForCheckout({
    deliveryAddressId: params.deliveryAddressId,
    paymentMethod: params.paymentMethod,
    couponCode: params.couponCode,
    walletAmountToUse,
  })
  const order = await placeOrder({
    cartId: validation.cartId,
    deliveryAddressId: params.deliveryAddressId,
    paymentMethod: params.paymentMethod,
    couponCode: params.couponCode,
    walletAmountToUse,
    specialInstructions: params.specialInstructions,
  })
  return { validation, order }
}

export async function fetchMyOrders(params: {
  page?: number
  limit?: number
  activeOnly?: boolean
}): Promise<PaginatedResult<OrderListItemDto>> {
  const { data } = await axiosInstance.get<
    ApiSuccess<PaginatedResult<OrderListItemDto>>
  >('/orders', { params: { page: 1, limit: 20, ...params } })
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load orders')
  }
  return data.data
}

export async function fetchOrderById(id: string): Promise<OrderDetailDto> {
  const { data } = await axiosInstance.get<ApiSuccess<OrderDetailDto>>(
    `/orders/${id}`,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Order not found')
  }
  return data.data
}

export async function cancelOrder(
  id: string,
  reason: string,
): Promise<OrderDetailDto> {
  const { data } = await axiosInstance.post<ApiSuccess<OrderDetailDto>>(
    `/orders/${id}/cancel`,
    { reason },
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not cancel order')
  }
  return data.data
}
