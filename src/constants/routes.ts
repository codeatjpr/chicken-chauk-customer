export const ROUTES = {
  root: '/',
  login: '/login',
  home: '/home',
  search: '/search',
  orders: '/orders',
  profile: '/profile',
  profileAddresses: '/profile/addresses',
  wallet: '/wallet',
  favorites: '/favorites',
  notifications: '/notifications',
  help: '/help',
  cart: '/cart',
  checkout: '/checkout',
} as const

export function vendorPath(id: string) {
  return `/vendors/${id}`
}

export function productPath(id: string) {
  return `/products/${id}`
}

export function orderPath(id: string) {
  return `/orders/${id}`
}

export function orderTrackingPath(id: string) {
  return `/orders/${id}/tracking`
}

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
