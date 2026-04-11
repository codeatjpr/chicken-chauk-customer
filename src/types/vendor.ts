export type VendorPublicDto = {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  city: string
  latitude: number
  longitude: number
  rating: number
  totalRatings: number
  prepTime: number | null
  minOrderAmount: number | null
  deliveryRadiusKm: number
  isOpen: boolean
  isActive: boolean
  timings: Array<{
    id: string
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
  }>
}

export type NearbyVendorDto = VendorPublicDto & {
  distanceKm: number
}
