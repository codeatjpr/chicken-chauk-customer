import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type {
  CanRateResponseDto,
  OrderRatingDto,
  VendorRatingSummaryDto,
} from '@/types/rating'

export async function fetchVendorRatingSummary(
  vendorId: string,
): Promise<VendorRatingSummaryDto> {
  const { data } = await axiosInstance.get<ApiSuccess<VendorRatingSummaryDto>>(
    `/ratings/vendors/${vendorId}/summary`,
  )
  if (!data.success || data.data == null) {
    throw new Error(data.message ?? 'Could not load ratings')
  }
  return data.data
}

export async function fetchCanRate(orderId: string): Promise<CanRateResponseDto> {
  const { data } = await axiosInstance.get<ApiSuccess<CanRateResponseDto>>(
    `/ratings/orders/${orderId}/can-rate`,
  )
  if (!data.success || data.data == null) {
    throw new Error(data.message ?? 'Could not check rating')
  }
  return data.data
}

export async function fetchMyOrderRating(
  orderId: string,
): Promise<OrderRatingDto | null> {
  const { data } = await axiosInstance.get<ApiSuccess<OrderRatingDto | null>>(
    `/ratings/orders/${orderId}`,
  )
  if (!data.success) {
    throw new Error(data.message ?? 'Could not load rating')
  }
  return data.data ?? null
}

export async function submitRating(body: {
  orderId: string
  vendorRating?: number
  riderRating?: number
  productQualityRating?: number
  comment?: string
  isPublic?: boolean
}): Promise<OrderRatingDto> {
  const { data } = await axiosInstance.post<ApiSuccess<OrderRatingDto>>(
    '/ratings',
    body,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not submit rating')
  }
  return data.data
}
