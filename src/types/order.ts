export type PaymentMethodDto =
  | 'UPI'
  | 'CARD'
  | 'COD'
  | 'WALLET'
  | 'NETBANKING'

export type OrderStatusDto =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentStatusDto = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'

export type CartValidationResultDto = {
  cartId: string
  vendorId: string
  deliveryAddressId: string
  paymentMethod: PaymentMethodDto
  couponCode?: string
  walletAmountToUse: number
  items: Array<{
    vendorProductId: string
    productId: string
    productName: string
    quantity: number
    unit: string
    priceAtOrder: number
    total: number
  }>
  itemsTotal: number
  deliveryFee: number
  platformFee: number
  taxAmount: number
  discount: number
  finalAmount: number
}

export type OrderListItemDto = {
  id: string
  finalAmount: number
  status: OrderStatusDto
  paymentMethod: PaymentMethodDto
  paymentStatus: PaymentStatusDto
  createdAt: string
  vendor: { id: string; name: string; logoUrl: string | null }
  previewImageUrl: string | null
  delivery: { status: string } | null
  _count: { items: number }
}

export type OrderItemDto = {
  id: string
  vendorProductId: string
  productName: string
  imageUrl: string | null
  quantity: number
  unit: string
  priceAtOrder: number
  total: number
}

export type OrderStatusLogDto = {
  status: OrderStatusDto
  note: string | null
  actorType: string
  timestamp: string
}

export type OrderDetailDto = {
  id: string
  vendorId: string
  finalAmount: number
  itemsTotal: number
  deliveryFee: number
  platformFee: number
  taxAmount: number
  discount: number
  walletAmountUsed: number
  status: OrderStatusDto
  paymentMethod: PaymentMethodDto
  paymentStatus: PaymentStatusDto
  specialInstructions: string | null
  isScheduled: boolean
  scheduledAt: string | null
  cancellationReason: string | null
  createdAt: string
  vendor: {
    id: string
    name: string
    phone: string
    addressLine: string | null
    latitude: number
    longitude: number
  }
  deliveryAddress: {
    id: string
    label: string
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    pincode: string
  } | null
  items: OrderItemDto[]
  statusLogs: OrderStatusLogDto[]
  delivery: {
    status: string
    rider?: {
      user: { name: string; phone: string }
    }
  } | null
}
