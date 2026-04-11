export type VendorRatingSummaryDto = {
  averageRating: number
  totalRatings: number
  breakdown: {
    five: number
    four: number
    three: number
    two: number
    one: number
  }
  averageProductQuality: number | null
}

export type OrderRatingDto = {
  id: string
  orderId: string
  vendorRating: number | null
  riderRating: number | null
  productQualityRating: number | null
  comment: string | null
  isPublic: boolean
  createdAt: string
}

export type CanRateResponseDto = {
  canRate: boolean
  reason?: string
}
