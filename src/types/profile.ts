import type { AuthUser } from '@/types/auth'

export type ProfileWithStatsDto = AuthUser & {
  email?: string | null
  referralCode?: string | null
  createdAt?: string
  stats: {
    totalOrders: number
    deliveredOrders: number
    cancelledOrders: number
    walletBalance: number
  }
}
