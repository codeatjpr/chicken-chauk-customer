import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { openRazorpayCheckout } from '@/lib/open-razorpay-checkout'
import { getApiErrorMessage } from '@/utils/api-error'

type PayOrderButtonProps = {
  orderId: string
  finalAmountLabel: string
  /** Button label (default: Razorpay checkout) */
  buttonLabel?: string
  onPaid: () => void
}

export function PayOrderButton({
  orderId,
  finalAmountLabel,
  buttonLabel = 'Pay securely with Razorpay',
  onPaid,
}: PayOrderButtonProps) {
  const [busy, setBusy] = useState(false)

  const startPay = async () => {
    setBusy(true)
    try {
      await openRazorpayCheckout(orderId, finalAmountLabel, onPaid)
    } catch (e) {
      if (e) {
        toast.error(getApiErrorMessage(e, 'Could not open payment'))
      }
    } finally {
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
      {buttonLabel}
    </Button>
  )
}
