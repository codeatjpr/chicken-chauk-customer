/**
 * Optional Sentry bootstrap. Set `VITE_SENTRY_DSN` in `.env` to enable.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
    })
  })
}
