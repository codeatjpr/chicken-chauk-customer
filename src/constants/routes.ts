export const ROUTES = {
  root: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  home: '/home',
  browse: '/browse',
  search: '/search',
  /** All nearby shops / vendors (grid + shop icons). */
  stores: '/stores',
  orders: '/orders',
  profile: '/profile',
  profileAddresses: '/profile/addresses',
  wallet: '/wallet',
  favorites: '/favorites',
  notifications: '/notifications',
  help: '/help',
  cart: '/cart',
  checkout: '/checkout',
  /** Pay online after address / coupon (post–checkout v2) */
  checkoutPayment: '/checkout/payment',
} as const

export function vendorPath(id: string) {
  return `/vendors/${id}`
}

export function productPath(id: string) {
  return `/products/${id}`
}

export function vendorProductPath(id: string) {
  return `/vendor-products/${id}`
}

export function categoryPath(id: string) {
  return `/categories/${id}`
}

export function orderPath(id: string) {
  return `/orders/${id}`
}

export function orderTrackingPath(id: string) {
  return `/orders/${id}/tracking`
}

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
