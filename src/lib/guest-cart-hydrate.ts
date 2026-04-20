import { fetchVendorProductById } from '@/services/catalog.service'
import type { CartItemDetailDto, CartSummaryDto } from '@/types/cart'
import {
  clearGuestCart,
  loadGuestCart,
  saveGuestCart,
  type GuestCartLine,
} from '@/lib/guest-cart-storage'

/** Mirrors backend cart.service.ts fee rules for display parity. */
const DELIVERY_FEE_FREE_ABOVE = 500
const DELIVERY_FEE_BASE = 30
const PLATFORM_FEE_PERCENT = 2

function formatListingUnit(
  quantityValue: number | null | undefined,
  quantityUnit: string | null | undefined,
  pieces: string | null | undefined,
): string {
  if (quantityValue != null) {
    const u = (quantityUnit ?? '').trim()
    return u ? `${quantityValue} ${u}` : String(quantityValue)
  }
  return (pieces ?? '').trim() || '1 unit'
}

/**
 * Loads guest cart from storage, fetches live listing data, and returns a cart summary
 * shaped like the authenticated API response.
 */
export async function hydrateGuestCart(): Promise<CartSummaryDto | null> {
  const raw = loadGuestCart()
  if (!raw || raw.items.length === 0) return null

  const vps = await Promise.all(
    raw.items.map((l) => fetchVendorProductById(l.vendorProductId).catch(() => null)),
  )

  const adjustedLines: GuestCartLine[] = []
  const details: CartItemDetailDto[] = []

  for (let i = 0; i < raw.items.length; i++) {
    const line = raw.items[i]
    const vp = vps[i]
    if (!vp || vp.vendor.id !== raw.vendorId) continue

    const qty = Math.min(line.quantity, Math.max(0, vp.stock))
    if (qty <= 0) continue

    adjustedLines.push({ vendorProductId: line.vendorProductId, quantity: qty })

    const product = vp.product
    const currentPrice = vp.price
    const imageUrl = vp.imageUrl ?? product.imageUrl ?? null
    const unit = formatListingUnit(vp.quantityValue, vp.quantityUnit, vp.pieces)
    const isAvailable =
      vp.isAvailable && vp.vendor.isOpen && vp.vendor.isActive && vp.stock > 0

    details.push({
      id: `guest-${vp.id}`,
      vendorProductId: vp.id,
      productId: product.id,
      name: product.name,
      imageUrl,
      unit,
      categoryName: product.category?.name ?? '',
      quantity: qty,
      priceAtAdd: currentPrice,
      currentPrice,
      priceChanged: false,
      total: currentPrice * qty,
      stock: vp.stock,
      isAvailable,
    })
  }

  if (adjustedLines.length === 0) {
    clearGuestCart()
    return null
  }

  if (JSON.stringify(adjustedLines) !== JSON.stringify(raw.items)) {
    saveGuestCart({ vendorId: raw.vendorId, items: adjustedLines })
  }

  const vendor = vps.find((vp) => vp && vp.vendor.id === raw.vendorId)?.vendor
  if (!vendor) {
    clearGuestCart()
    return null
  }

  const itemsTotal = details.reduce((s, i) => s + i.total, 0)
  const deliveryFee = itemsTotal >= DELIVERY_FEE_FREE_ABOVE ? 0 : DELIVERY_FEE_BASE
  const platformFee = Math.round(itemsTotal * (PLATFORM_FEE_PERCENT / 100))
  const hasChanges = details.some((d) => !d.isAvailable)

  return {
    id: 'guest-cart',
    vendorId: raw.vendorId,
    vendorName: vendor.name,
    vendorPrepTime: vendor.prepTime ?? 20,
    vendorIsOpen: vendor.isOpen,
    items: details,
    itemsTotal,
    deliveryFee,
    platformFee,
    estimatedTotal: itemsTotal + deliveryFee + platformFee,
    totalItems: details.length,
    totalQuantity: details.reduce((s, i) => s + i.quantity, 0),
    hasChanges,
    unavailableItems: details.filter((d) => !d.isAvailable).map((d) => d.name),
  }
}
