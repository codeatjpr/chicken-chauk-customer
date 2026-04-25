import { axiosInstance } from '@/lib/axiosInstance'
import { getDiscoveryRadiusKm } from '@/stores/discovery-config-store'
import type { ApiSuccess } from '@/types/api'
import type { PaginatedResult } from '@/types/pagination'
import type { NearbyVendorDto, VendorPublicDto } from '@/types/vendor'

export async function fetchNearbyVendors(params: {
  latitude: number
  longitude: number
  /** Optional; omit for listings purely by radius (recommended with GPS). */
  city?: string
  page?: number
  limit?: number
  /** Defaults to server discovery radius (from home screen, or fallback constant). */
  radiusKm?: number
}): Promise<PaginatedResult<NearbyVendorDto>> {
  const { page = 1, limit = 20, radiusKm = getDiscoveryRadiusKm(), ...rest } = params
  const { data } = await axiosInstance.get<
    ApiSuccess<PaginatedResult<NearbyVendorDto>>
  >('/vendors/nearby', {
    params: { page, limit, radiusKm, ...rest },
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
