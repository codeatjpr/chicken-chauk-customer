import { z } from 'zod'

/** Matches backend `indianPhoneSchema`: 10 digits, starts with 6–9 */
export const indianMobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')

/** Last 10 digits (handles values stored with or without country code). */
export function normalizeIndianMobileDigits(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

export function toDisplayPhone(phone10: string): string {
  const d = normalizeIndianMobileDigits(phone10)
  if (d.length !== 10) return phone10
  return `${d.slice(0, 5)} ${d.slice(5)}`
}

/** Single formatted line: +91 98765 43210 */
export function formatIndianMobileDisplay(phone: string): string {
  const d = normalizeIndianMobileDigits(phone)
  if (d.length !== 10) return phone.trim()
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`
}

/** Mask for UI: +91 98XXX XXXXX (last 5 visible) */
export function maskPhoneForOtpStep(phone10: string): string {
  const d = normalizeIndianMobileDigits(phone10)
  if (d.length !== 10) return phone10
  return `+91 ${d.slice(0, 2)}XXX ${d.slice(5)}`
}
