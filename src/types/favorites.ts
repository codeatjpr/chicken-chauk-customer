export type FavoriteVendorDto = {
  id: string
  name: string
  logoUrl: string | null
  rating: number
  isOpen: boolean
  prepTime: number
  addedAt?: string
}

export type FavoriteProductDto = {
  id: string
  name: string
  imageUrl: string | null
  unit: string
  category: { name: string }
  addedAt?: string
}

export type FavoritesResponseDto = {
  vendors: FavoriteVendorDto[]
  products: FavoriteProductDto[]
}
