export type CartItemDetailDto = {
  id: string
  vendorProductId: string
  productId: string
  name: string
  imageUrl: string | null
  unit: string
  categoryName: string
  quantity: number
  priceAtAdd: number
  currentPrice: number
  priceChanged: boolean
  total: number
  stock: number
  isAvailable: boolean
}

export type CartSummaryDto = {
  id: string
  vendorId: string
  vendorName: string
  vendorPrepTime: number
  vendorIsOpen: boolean
  items: CartItemDetailDto[]
  itemsTotal: number
  deliveryFee: number
  platformFee: number
  estimatedTotal: number
  totalItems: number
  totalQuantity: number
  hasChanges: boolean
  unavailableItems: string[]
}
