import type { PaginatedResult } from '@/types/pagination'

/** One slide in the home hero carousel (3:1 on all screen sizes; separate mobile/desktop assets optional). */
export type HeroCarouselSlideDto = {
  id: string
  title: string
  imageUrl: string
  imageUrlMobile?: string | null
  imageUrlDesktop?: string | null
  isClickable?: boolean
  linkType: 'VENDOR' | 'PRODUCT' | 'COUPON' | 'EXTERNAL' | 'STATIC'
  linkId: string | null
  externalUrl: string | null
  sortOrder: number
}

export type CategoryChipDto = {
  id: string
  name: string
  imageUrl: string | null
}

export type HomeVendorDto = {
  id: string
  name: string
  logoUrl: string | null
  bannerUrl: string | null
  rating: number
  totalRatings: number
  prepTime: number | null
  isOpen: boolean
  latitude: number
  longitude: number
  distanceKm: number
  isFavorite: boolean
}

export type PopularSearchDto = { query: string; count: number }

export type HomeScreenData = {
  heroCarousel: HeroCarouselSlideDto[]
  categories: CategoryChipDto[]
  topVendors: HomeVendorDto[]
  popularSearches: PopularSearchDto[]
  /** Server `CUSTOMER_DISCOVERY_RADIUS_KM` — use for nearby vendor requests. */
  discoveryRadiusKm: number
}

export type VendorSearchHit = {
  id: string
  name: string
  logoUrl: string | null
  bannerUrl: string | null
  rating: number
  totalRatings: number
  prepTime: number | null
  isOpen: boolean
  deliveryRadiusKm: number
  latitude: number
  longitude: number
  isFavorite: boolean
}

export type ProductSearchHit = {
  id: string
  imageUrl?: string | null
  price: number
  mrp?: number | null
  stock?: number
  isAvailable: boolean
  // Pack definition — vendor-specific
  description?: string | null
  quantityValue?: number | null
  quantityUnit?: string | null
  pieces?: string | null
  servings?: string | null
  product: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    category: { id: string; name: string } | null
    subCategory: { id: string; name: string } | null
  }
  vendor: {
    id: string
    name: string
    logoUrl: string | null
    isOpen: boolean
    rating: number
    prepTime: number | null
  }
}

export type DiscoverySearchData = {
  vendors: PaginatedResult<VendorSearchHit>
  products: PaginatedResult<ProductSearchHit>
  query: string
  city: string
}

export type DiscoveryProductFeedData = PaginatedResult<ProductSearchHit>
