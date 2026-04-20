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
  isActive: boolean
  category: { id: string; name: string } | null
}

export type ProductDetailDto = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  category: { id: string; name: string } | null
}

export type VendorProductDto = {
  id: string
  imageUrl?: string | null
  price: number
  mrp: number | null
  stock: number
  isAvailable: boolean
  sortOrder: number
  // Pack definition — varies per vendor listing
  description: string | null
  quantityValue: number | null
  quantityUnit: string | null
  pieces: string | null
  servings: string | null
  product: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    category: { id: string; name: string } | null
  }
}

export type VendorProductDetailDto = VendorProductDto & {
  vendor: {
    id: string
    name: string
    logoUrl: string | null
    bannerUrl: string | null
    addressLine: string
    city: string
    pincode: string
    rating: number
    totalRatings: number
    prepTime: number | null
    isOpen: boolean
    isActive: boolean
  }
}
