/** Client-side OTP verify failures before showing long lockout UI */
export const OTP_MAX_FAILED_ATTEMPTS = 5
/** After max failures, block OTP UI for this many ms (product spec) */
export const OTP_LOCKOUT_MS = 10 * 60 * 1000
/** Minimum seconds before “Resend OTP” */
export const OTP_RESEND_COOLDOWN_SEC = 60
