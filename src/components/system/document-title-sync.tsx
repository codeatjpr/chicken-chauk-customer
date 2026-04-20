import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { queryKeys } from '@/constants/query-keys'
import type { VendorProductDetailDto } from '@/types/catalog'

const BRAND = 'Chicken Chauk'

function withBrand(segment: string): string {
  const s = segment.trim()
  if (!s || s === BRAND) return BRAND
  return `${s} · ${BRAND}`
}

/**
 * Keeps `document.title` in sync with the route (and React Query cache when available).
 */
export function DocumentTitleSync() {
  const { pathname } = useLocation()
  const qc = useQueryClient()
  const [cacheTick, setCacheTick] = useState(0)

  const needsCachedName =
    /^\/(vendors|products|categories|vendor-products)\/[^/]+$/.test(pathname)

  useEffect(() => {
    if (!needsCachedName) return
    let t: ReturnType<typeof setTimeout>
    return qc.getQueryCache().subscribe(() => {
      clearTimeout(t)
      t = setTimeout(() => setCacheTick((n) => n + 1), 50)
    })
  }, [needsCachedName, qc])

  useLayoutEffect(() => {
    const p = pathname

    if (p === '/' || p === '') {
      document.title = withBrand('Fresh meat & groceries')
      return
    }

    if (p === '/login') {
      document.title = withBrand('Sign in')
      return
    }

    if (p === '/home') {
      document.title = withBrand('Home')
      return
    }

    if (p === '/browse') {
      document.title = withBrand('Browse')
      return
    }

    if (p.startsWith('/search')) {
      document.title = withBrand('Search')
      return
    }

    if (p === '/cart') {
      document.title = withBrand('Cart')
      return
    }

    if (p === '/checkout') {
      document.title = withBrand('Checkout')
      return
    }

    if (p === '/help') {
      document.title = withBrand('Help')
      return
    }

    if (p === '/onboarding') {
      document.title = withBrand('Your profile')
      return
    }

    if (p === '/orders') {
      document.title = withBrand('Orders')
      return
    }

    if (p === '/profile') {
      document.title = withBrand('Account')
      return
    }

    if (p === '/profile/addresses') {
      document.title = withBrand('Addresses')
      return
    }

    if (p === '/wallet') {
      document.title = withBrand('Wallet')
      return
    }

    if (p === '/favorites') {
      document.title = withBrand('Saved')
      return
    }

    if (p === '/notifications') {
      document.title = withBrand('Notifications')
      return
    }

    const catMatch = /^\/categories\/([^/]+)$/.exec(p)
    if (catMatch) {
      const id = catMatch[1]
      const cached = qc.getQueryData<{ name?: string }>(queryKeys.catalog.category(id))
      document.title = withBrand(cached?.name ?? 'Category')
      return
    }

    const vendorMatch = /^\/vendors\/([^/]+)$/.exec(p)
    if (vendorMatch) {
      const id = vendorMatch[1]
      const cached = qc.getQueryData<{ name?: string }>(queryKeys.vendors.detail(id))
      document.title = withBrand(cached?.name ?? 'Shop')
      return
    }

    const productMatch = /^\/products\/([^/]+)$/.exec(p)
    if (productMatch) {
      const id = productMatch[1]
      const cached = qc.getQueryData<{ name?: string }>(queryKeys.catalog.product(id))
      document.title = withBrand(cached?.name ?? 'Product')
      return
    }

    const vpMatch = /^\/vendor-products\/([^/]+)$/.exec(p)
    if (vpMatch) {
      const id = vpMatch[1]
      const cached = qc.getQueryData<VendorProductDetailDto>(queryKeys.catalog.vendorProduct(id))
      const name = cached?.product.name
      document.title = withBrand(name ?? 'Item')
      return
    }

    const orderTrack = /^\/orders\/([^/]+)\/tracking$/.exec(p)
    if (orderTrack) {
      document.title = withBrand('Tracking')
      return
    }

    const orderDetail = /^\/orders\/([^/]+)$/.exec(p)
    if (orderDetail) {
      document.title = withBrand('Order')
      return
    }

    document.title = BRAND
  }, [pathname, qc, cacheTick])

  return null
}
