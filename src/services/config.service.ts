import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'

export type PublicAppConfig = {
  supportPhone: string | null
  supportEmail: string | null
  deliveryFeeBase: number
  deliveryFeeFreeAbove: number
  platformFeePercent: number
  /** INR per order; when > 0, platform fee is this flat amount instead of percent of subtotal. */
  platformFeeFixed?: number
}

export async function fetchPublicConfig(): Promise<PublicAppConfig> {
  const { data } = await axiosInstance.get<ApiSuccess<PublicAppConfig>>('/config/public')
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load config')
  }
  return data.data
}
