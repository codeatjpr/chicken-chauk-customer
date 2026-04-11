import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { AuthUser } from '@/types/auth'
import type { ProfileWithStatsDto } from '@/types/profile'

export async function fetchProfileWithStats(): Promise<ProfileWithStatsDto> {
  const { data } = await axiosInstance.get<ApiSuccess<ProfileWithStatsDto>>(
    '/users/me/stats',
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load profile')
  }
  return data.data
}

export async function updateProfile(body: {
  name?: string
  email?: string
}): Promise<AuthUser> {
  const { data } = await axiosInstance.put<ApiSuccess<AuthUser>>(
    '/users/me',
    body,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not update profile')
  }
  return data.data
}
