import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { PaginatedResult } from '@/types/pagination'
import type { NearbyVendorDto, VendorPublicDto } from '@/types/vendor'

export async function fetchNearbyVendors(params: {
  latitude: number
  longitude: number
  city: string
  page?: number
  limit?: number
  radiusKm?: number
}): Promise<PaginatedResult<NearbyVendorDto>> {
  const { data } = await axiosInstance.get<
    ApiSuccess<PaginatedResult<NearbyVendorDto>>
  >('/vendors/nearby', {
    params: { page: 1, limit: 20, radiusKm: 5, ...params },
  })
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load vendors')
  }
  return data.data
}

export async function fetchVendorById(id: string): Promise<VendorPublicDto> {
  const { data } = await axiosInstance.get<ApiSuccess<VendorPublicDto>>(
    `/vendors/${id}`,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Vendor not found')
  }
  return data.data
}
