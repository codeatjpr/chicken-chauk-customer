export type CategoryDto = {
  id: string
  name: string
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  _count: { products: number }
}

export type ProductListItemDto = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  unit: string
  isActive: boolean
  category: { id: string; name: string } | null
}

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
  variant?: {
    id: string
    name: string
    weight: number
    unit: string
  }
  product: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    unit: string
    category: { id: string; name: string } | null
  }
}
