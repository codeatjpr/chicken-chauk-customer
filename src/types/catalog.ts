export type ProductDetailDto = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  unit: string
  isActive: boolean
  category: { id: string; name: string } | null
}

export type VendorProductDto = {
  id: string
  price: number
  mrp: number | null
  stock: number
  isAvailable: boolean
  sortOrder: number
  product: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    unit: string
    category: { id: string; name: string } | null
  }
}
