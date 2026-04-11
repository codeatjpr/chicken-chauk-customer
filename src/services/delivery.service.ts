import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { DeliveryDetailDto, RiderLocationDto } from '@/types/delivery'

export async function fetchDeliveryForOrder(
  orderId: string,
): Promise<DeliveryDetailDto> {
  const { data } = await axiosInstance.get<ApiSuccess<DeliveryDetailDto>>(
    `/delivery/orders/${orderId}`,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Delivery not found')
  }
  return data.data
}

export async function fetchRiderLocation(
  riderId: string,
): Promise<RiderLocationDto | null> {
  const { data } = await axiosInstance.get<
    ApiSuccess<RiderLocationDto | null>
  >(`/delivery/riders/${riderId}/location`)
  if (!data.success) {
    throw new Error(data.message ?? 'Could not load rider location')
  }
  return data.data ?? null
}
