import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { DiscoveryProductFeedData, DiscoverySearchData, HomeScreenData } from '@/types/discovery'
import { useDiscoveryConfigStore } from '@/stores/discovery-config-store'

export async function fetchHomeScreen(params: {
  city: string
  latitude: number
  longitude: number
}): Promise<HomeScreenData> {
  const { data } = await axiosInstance.get<ApiSuccess<HomeScreenData>>(
    '/discovery/home',
    { params },
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load home')
  }
  const payload = data.data
  if (typeof payload.discoveryRadiusKm === 'number') {
    useDiscoveryConfigStore.getState().setRadiusKm(payload.discoveryRadiusKm)
  }
  return payload
}

export async function fetchDiscoverySearch(params: {
  q: string
  city: string
  latitude: number
  longitude: number
  page?: number
  limit?: number
}): Promise<DiscoverySearchData> {
  const { data } = await axiosInstance.get<ApiSuccess<DiscoverySearchData>>(
    '/discovery/search',
    { params: { page: 1, limit: 20, ...params } },
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Search failed')
  }
  return data.data
}

export async function fetchDiscoveryProducts(params: {
  city: string
  latitude: number
  longitude: number
  categoryId?: string
  subCategoryId?: string
  search?: string
  page?: number
  limit?: number
}): Promise<DiscoveryProductFeedData> {
  const { data } = await axiosInstance.get<ApiSuccess<DiscoveryProductFeedData>>(
    '/discovery/products',
    { params: { page: 1, limit: 24, ...params } },
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load products')
  }
  return data.data
}

export async function toggleFavoriteApi(body: {
  type: 'VENDOR' | 'PRODUCT'
  referenceId: string
}): Promise<{ isFavorite: boolean; message: string }> {
  const { data } = await axiosInstance.post<
    ApiSuccess<{ isFavorite: boolean; message: string }>
  >('/discovery/favorites', body)
  if (!data.success || data.data == null) {
    throw new Error(data.message ?? 'Favorite failed')
  }
  return data.data
}
