import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'

export type DrivingRouteDto = {
  encodedPolyline: string | null
  durationSeconds: number | null
}

export async function fetchDrivingRoute(params: {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
}): Promise<DrivingRouteDto> {
  const { data } = await axiosInstance.get<ApiSuccess<DrivingRouteDto>>('/maps/route', {
    params,
  })
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load route')
  }
  return data.data
}
