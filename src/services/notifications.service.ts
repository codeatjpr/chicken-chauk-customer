import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { PaginatedResult } from '@/types/pagination'
import type { NotificationDto } from '@/types/notification'

export async function fetchNotifications(params?: {
  page?: number
  limit?: number
  unreadOnly?: boolean
}): Promise<PaginatedResult<NotificationDto>> {
  const { data } = await axiosInstance.get<
    ApiSuccess<PaginatedResult<NotificationDto>>
  >('/users/me/notifications', {
    params: { page: 1, limit: 30, ...params },
  })
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load notifications')
  }
  return data.data
}

export async function markNotificationRead(id: string): Promise<void> {
  const { data } = await axiosInstance.patch<ApiSuccess<null>>(
    `/users/me/notifications/${id}/read`,
  )
  if (!data.success) {
    throw new Error(data.message ?? 'Could not update notification')
  }
}
