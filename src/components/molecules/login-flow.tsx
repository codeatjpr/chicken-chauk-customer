import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Loader2Icon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { OtpInput } from '@/components/molecules/otp-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  OTP_LOCKOUT_MS,
  OTP_MAX_FAILED_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SEC,
} from '@/constants/auth-ui'
import { ROUTES } from '@/constants/routes'
import { flushGuestCartToServer } from '@/lib/flush-guest-cart'
import { flushPendingCartAdd } from '@/lib/flush-pending-cart'
import * as authApi from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth-store'
import { getApiErrorMessage } from '@/utils/api-error'
import { indianMobileSchema, maskPhoneForOtpStep } from '@/utils/phone'
import { profileNeedsDisplayName } from '@/utils/profile'

const phoneSchema = z.object({ phone: indianMobileSchema })
type PhoneForm = z.infer<typeof phoneSchema>

export type LoginFlowProps = {
  /** Called after successful sign-in (and any cart flush). */
  onSuccess?: (isNewUser: boolean) => void
  /** Called when the user cancels (only shown when onCancel is provided). */
  onCancel?: () => void
  /** "from" path for onboarding redirect (defaults to /home). */
  from?: string
}

export function LoginFlow({ onSuccess, onCancel, from = ROUTES.home }: LoginFlowProps) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const signIn = useAuthStore((s) => s.signIn)

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone10, setPhone10] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [resendAt, setResendAt] = useState<number | null>(null)
  const [clock, setClock] = useState(() => Date.now())
  const verifySubmittedRef = useRef(false)

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
    mode: 'onBlur',
  })

  const sendMutation = useMutation({
    mutationFn: (phone: string) => authApi.sendOtp(phone),
    onSuccess: (_, phone) => {
      setPhone10(phone)
      setStep('otp')
      setOtp('')
      setOtpError(false)
      setFailedAttempts(0)
      setLockoutUntil(null)
      verifySubmittedRef.current = false
      setResendAt(Date.now() + OTP_RESEND_COOLDOWN_SEC * 1000)
      setClock(Date.now())
      toast.success('OTP sent to your mobile number')
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not send OTP'))
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      authApi.verifyOtp(phone, code),
    onSuccess: async (data) => {
      setOtpError(false)
      signIn(data.tokens, data.user)
      toast.success(data.isNewUser ? 'Welcome!' : 'Signed in')

      if (profileNeedsDisplayName(data.user)) {
        navigate(ROUTES.onboarding, { replace: true, state: { from } })
        return
      }

      const guestMerged = await flushGuestCartToServer(qc)
      const pendingAdded = await flushPendingCartAdd(qc)
      if (guestMerged) toast.success('Your cart was saved to your account')
      if (pendingAdded) toast.success('Added to cart')

      onSuccess?.(data.isNewUser)
    },
    onError: (err) => {
      verifySubmittedRef.current = false
      setOtp('')
      setOtpError(true)
      const msg = getApiErrorMessage(err, 'Invalid OTP')
      setFailedAttempts((f) => {
        const next = f + 1
        if (next >= OTP_MAX_FAILED_ATTEMPTS) {
          setLockoutUntil(Date.now() + OTP_LOCKOUT_MS)
          toast.error('Too many incorrect attempts. Try again in 10 minutes.')
        } else {
          toast.error(msg)
        }
        return next
      })
    },
  })

  const isLocked = lockoutUntil != null && clock < lockoutUntil
  const lockoutRemainingSec = isLocked ? Math.ceil((lockoutUntil! - clock) / 1000) : 0
  const resendRemainingSec =
    resendAt != null && clock < resendAt ? Math.ceil((resendAt - clock) / 1000) : 0

  useEffect(() => {
    if (step !== 'otp') return
    const t = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [step])

  const runVerify = useCallback(
    (code: string) => {
      if (code.length !== 6 || isLocked || verifyMutation.isPending) return
      verifyMutation.mutate({ phone: phone10, code })
    },
    [phone10, isLocked, verifyMutation],
  )

  useEffect(() => {
    if (step !== 'otp' || otp.length !== 6 || verifySubmittedRef.current) return
    verifySubmittedRef.current = true
    runVerify(otp)
  }, [otp, step, runVerify])

  const onPhoneSubmit = phoneForm.handleSubmit((values) => {
    sendMutation.mutate(values.phone)
  })

  const resendOtp = () => {
    if (isLocked || resendRemainingSec > 0 || sendMutation.isPending) return
    sendMutation.mutate(phone10)
  }

  const backToPhone = () => {
    setStep('phone')
    setOtp('')
    setOtpError(false)
    setFailedAttempts(0)
    setLockoutUntil(null)
    verifySubmittedRef.current = false
  }

  const formatLockout = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (step === 'phone') {
    return (
      <div className="space-y-4">
        <form onSubmit={onPhoneSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lf-phone">Mobile number</Label>
            <div className="bg-background border-input focus-within:ring-primary/20 flex h-11 w-full overflow-hidden rounded-xl border bg-clip-padding shadow-sm focus-within:ring-2 [&_input]:bg-transparent">
              <span className="text-muted-foreground border-input flex shrink-0 items-center border-e px-3 text-sm">
                +91
              </span>
              <Input
                id="lf-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="10-digit mobile number"
                className="border-0 shadow-none focus-visible:ring-0 h-full rounded-none text-base"
                aria-invalid={Boolean(phoneForm.formState.errors.phone)}
                {...phoneForm.register('phone')}
              />
            </div>
            {phoneForm.formState.errors.phone && (
              <p className="text-destructive text-sm" role="alert">
                {phoneForm.formState.errors.phone.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="h-12 w-full justify-between gap-2 rounded-2xl px-5 text-base font-semibold"
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <span>Get OTP</span>
                <ArrowRight className="size-5 shrink-0" aria-hidden />
              </>
            )}
          </Button>
        </form>
        {onCancel && (
          <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={backToPhone}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Change number
      </button>

      {isLocked && (
        <div
          className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
          role="alert"
        >
          Too many attempts. Try again in {formatLockout(lockoutRemainingSec)}.
        </div>
      )}

      <p className="text-muted-foreground text-sm">Code sent to {maskPhoneForOtpStep(phone10)}</p>

      <OtpInput
        value={otp}
        onChange={(next) => {
          setOtp(next)
          setOtpError(false)
          if (next.length < 6) verifySubmittedRef.current = false
        }}
        disabled={isLocked || verifyMutation.isPending}
        error={otpError}
        autoFocus
      />

      {failedAttempts > 0 && !isLocked && (
        <p className="text-destructive text-center text-sm" role="status">
          {OTP_MAX_FAILED_ATTEMPTS - failedAttempts > 0
            ? `Incorrect OTP. ${OTP_MAX_FAILED_ATTEMPTS - failedAttempts} attempt${OTP_MAX_FAILED_ATTEMPTS - failedAttempts !== 1 ? 's' : ''} left.`
            : null}
        </p>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={resendOtp}
          disabled={isLocked || resendRemainingSec > 0 || sendMutation.isPending}
          className="text-primary text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resendRemainingSec > 0 ? `Resend in ${resendRemainingSec}s` : 'Resend OTP'}
        </button>
      </div>
    </div>
  )
}
