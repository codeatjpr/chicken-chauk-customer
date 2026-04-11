import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/lib/utils'

const DIGITS = 6

type OtpInputProps = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  error?: boolean
  autoFocus?: boolean
  id?: string
}

export function OtpInput({
  value,
  onChange,
  disabled,
  error,
  autoFocus,
  id: idProp,
}: OtpInputProps) {
  const reactId = useId()
  const baseId = idProp ?? reactId
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const digitsOnly = value.replace(/\D/g, '').slice(0, DIGITS)

  const focusIndex = (i: number) => {
    const el = inputsRef.current[i]
    if (el) {
      el.focus()
      el.select()
    }
  }

  useEffect(() => {
    if (autoFocus) {
      focusIndex(0)
    }
  }, [autoFocus])

  const applyFullString = useCallback(
    (raw: string) => {
      const next = raw.replace(/\D/g, '').slice(0, DIGITS)
      onChange(next)
      const nextFocus = Math.min(next.length, DIGITS - 1)
      requestAnimationFrame(() => focusIndex(nextFocus))
    },
    [onChange],
  )

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    applyFullString(e.clipboardData.getData('text'))
  }

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digitsOnly[index]) {
        onChange(digitsOnly.slice(0, index) + digitsOnly.slice(index + 1))
      } else if (index > 0) {
        onChange(
          digitsOnly.slice(0, index - 1) + digitsOnly.slice(index),
        )
        focusIndex(index - 1)
      }
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      focusIndex(index - 1)
      e.preventDefault()
    }
    if (e.key === 'ArrowRight' && index < DIGITS - 1) {
      focusIndex(index + 1)
      e.preventDefault()
    }
  }

  const onChangeAt = (index: number, inputVal: string) => {
    const d = inputVal.replace(/\D/g, '').slice(-1)
    const left = digitsOnly.slice(0, index)
    const right = digitsOnly.slice(index + 1)
    const next = (left + d + right).slice(0, DIGITS)
    onChange(next)
    if (d && index < DIGITS - 1) {
      focusIndex(index + 1)
    }
  }

  return (
    <div
      className={cn(
        'flex justify-center gap-2 sm:gap-2.5',
        error && 'animate-cc-shake',
      )}
      role="group"
      aria-label="One-time password"
    >
      {Array.from({ length: DIGITS }, (_, i) => (
        <input
          key={`${baseId}-${i}`}
          id={`${baseId}-${i}`}
          ref={(el) => {
            inputsRef.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={digitsOnly[i] ?? ''}
          onPaste={i === 0 ? onPaste : undefined}
          onChange={(e) => onChangeAt(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          aria-invalid={error}
          className={cn(
            'border-input bg-background focus-visible:ring-ring/50 flex h-14 w-11 rounded-lg border text-center text-lg font-medium transition-[box-shadow,border-color] outline-none focus-visible:border-ring focus-visible:ring-[3px] sm:h-[60px] sm:w-[52px]',
            error && 'border-destructive ring-destructive/30',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        />
      ))}
    </div>
  )
}
