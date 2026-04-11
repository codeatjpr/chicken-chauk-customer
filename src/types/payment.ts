export type PaymentInitiationDto = {
  razorpayOrderId: string
  amount: number
  currency: string
  keyId: string
  orderId: string
  prefill?: {
    name?: string
    contact?: string
    email?: string
  }
}
