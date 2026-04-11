import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { PaginatedResult } from '@/types/pagination'
import type {
  CouponValidationResultDto,
  WalletSummaryDto,
  WalletTransactionDto,
} from '@/types/wallet'

export async function fetchWallet(): Promise<WalletSummaryDto> {
  const { data } = await axiosInstance.get<ApiSuccess<WalletSummaryDto>>(
    '/wallet',
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load wallet')
  }
  return data.data
}

export async function fetchWalletTransactions(params: {
  page?: number
  limit?: number
  type?: 'CREDIT' | 'DEBIT'
}): Promise<PaginatedResult<WalletTransactionDto>> {
  const { data } = await axiosInstance.get<
    ApiSuccess<PaginatedResult<WalletTransactionDto>>
  >('/wallet/transactions', { params: { page: 1, limit: 20, ...params } })
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load transactions')
  }
  return data.data
}

export async function validateCoupon(body: {
  code: string
  orderAmount: number
  vendorId?: string
}): Promise<CouponValidationResultDto> {
  const { data } = await axiosInstance.post<
    ApiSuccess<CouponValidationResultDto>
  >('/wallet/coupons/validate', body)
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Invalid coupon')
  }
  return data.data
}
