import { toast } from 'sonner'
import { loadRazorpayCheckoutScript } from '@/lib/load-razorpay'
import * as paymentsApi from '@/services/payments.service'
import { getApiErrorMessage } from '@/utils/api-error'

type RazorpayCheckoutOptions = {
  /** Called when the user closes the checkout without success (dismiss) — e.g. restore cart. */
  onDismiss?: () => void | Promise<void>
}

/** Opens Razorpay for an existing order (e.g. after place-order, or from order detail). */
export async function openRazorpayCheckout(
  orderId: string,
  finalAmountLabel: string,
  onPaid: () => void,
  options?: RazorpayCheckoutOptions,
): Promise<void> {
  await loadRazorpayCheckoutScript()
  const init = await paymentsApi.initiatePayment(orderId)
  const Razorpay = window.Razorpay
  if (!Razorpay) {
    throw new Error('Razorpay failed to initialize')
  }
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: init.keyId,
      amount: init.amount,
      currency: init.currency,
      name: 'Chicken Chauk',
      description: `Pay ${finalAmountLabel}`,
      order_id: init.razorpayOrderId,
      prefill: init.prefill,
      theme: { color: '#f97316' },
      handler: async (response: {
        razorpay_order_id: string
        razorpay_payment_id: string
        razorpay_signature: string
      }) => {
        try {
          await paymentsApi.verifyPayment({
            orderId: init.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          toast.success('Payment successful')
          onPaid()
          resolve()
        } catch (e) {
          toast.error(getApiErrorMessage(e, 'Payment could not be verified'))
          reject(e)
        }
      },
      modal: {
        ondismiss: () => {
          void (async () => {
            try {
              await options?.onDismiss?.()
            } finally {
              resolve()
            }
          })()
        },
      },
    })
    rzp.open()
  })
}
