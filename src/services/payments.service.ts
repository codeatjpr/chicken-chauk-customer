import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { PaymentInitiationDto } from '@/types/payment'

export async function initiatePayment(orderId: string): Promise<PaymentInitiationDto> {
  const { data } = await axiosInstance.post<ApiSuccess<PaymentInitiationDto>>(
    '/payments/initiate',
    { orderId },
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not start payment')
  }
  return data.data
}

export async function verifyPayment(body: {
  orderId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}): Promise<void> {
  const { data } = await axiosInstance.post<ApiSuccess<{ success: true }>>(
    '/payments/verify',
    body,
  )
  if (!data.success) {
    throw new Error(data.message ?? 'Payment verification failed')
  }
}
