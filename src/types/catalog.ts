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

export type ProductVariantDto = {
  id: string
  name: string
  weight: number
  unit: string
  isActive: boolean
  sortOrder: number
}

export type ProductDetailDto = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  unit: string
  isActive: boolean
  category: { id: string; name: string } | null
  variants: ProductVariantDto[]
}

export type VendorProductDto = {
  id: string
  imageUrl?: string | null
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
    isActive?: boolean
    sortOrder?: number
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
