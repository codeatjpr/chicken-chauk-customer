const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

let loading: Promise<void> | null = null

export function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay requires a browser'))
  }
  if (window.Razorpay) {
    return Promise.resolve()
  }
  if (loading) {
    return loading
  }
  loading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Razorpay')),
        { once: true },
      )
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      loading = null
      reject(new Error('Failed to load Razorpay checkout'))
    }
    document.body.appendChild(s)
  })
  return loading
}
