import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { FavoritesResponseDto } from '@/types/favorites'

export async function fetchFavorites(params?: {
  type?: 'VENDOR' | 'PRODUCT'
}): Promise<FavoritesResponseDto> {
  const { data } = await axiosInstance.get<ApiSuccess<FavoritesResponseDto>>(
    '/discovery/favorites',
    { params: params?.type ? { type: params.type } : undefined },
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load favorites')
  }
  return data.data
}
