export type WalletSummaryDto = {
  id: string
  userId: string
  balance: number
  totalEarned: number
  totalSpent: number
  updatedAt: string
}

export type CouponValidationResultDto = {
  couponId: string
  code: string
  title: string
  discountType: 'FLAT' | 'PERCENT'
  discountValue: number
  discount: number
  finalAmount: number
}

export type WalletTransactionDto = {
  id: string
  walletId: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  reason: string
  referenceId: string | null
  referenceType: string | null
  note: string | null
  balanceAfter: number
  createdAt: string
}
