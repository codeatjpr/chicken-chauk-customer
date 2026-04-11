import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { loadRazorpayCheckoutScript } from '@/lib/load-razorpay'
import * as paymentsApi from '@/services/payments.service'
import { getApiErrorMessage } from '@/utils/api-error'

type PayOrderButtonProps = {
  orderId: string
  finalAmountLabel: string
  onPaid: () => void
}

export function PayOrderButton({
  orderId,
  finalAmountLabel,
  onPaid,
}: PayOrderButtonProps) {
  const [busy, setBusy] = useState(false)

  const startPay = async () => {
    setBusy(true)
    try {
      await loadRazorpayCheckoutScript()
      const init = await paymentsApi.initiatePayment(orderId)
      const Razorpay = window.Razorpay
      if (!Razorpay) {
        throw new Error('Razorpay failed to initialize')
      }
      const rzp = new Razorpay({
        key: init.keyId,
        amount: init.amount,
        currency: init.currency,
        name: 'Chicken Chauk',
        description: `Pay ${finalAmountLabel}`,
        order_id: init.razorpayOrderId,
        prefill: init.prefill,
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          try {
            await paymentsApi.verifyPayment({
              orderId: init.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            toast.success('Payment successful')
            setBusy(false)
            onPaid()
          } catch (e) {
            toast.error(
              getApiErrorMessage(e, 'Payment could not be verified'),
            )
            setBusy(false)
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      })
      rzp.open()
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not open payment'))
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      className="w-full gap-2"
      disabled={busy}
      onClick={() => void startPay()}
    >
      {busy && <Loader2Icon className="size-4 animate-spin" />}
      Pay securely with Razorpay
    </Button>
  )
}
