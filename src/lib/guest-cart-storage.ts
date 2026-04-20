const STORAGE_KEY = 'chicken-chauk-guest-cart'

export type GuestCartLine = {
  vendorProductId: string
  quantity: number
}

export type GuestCartStored = {
  vendorId: string
  items: GuestCartLine[]
}

export function loadGuestCart(): GuestCartStored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as GuestCartStored
    if (!p?.vendorId || !Array.isArray(p.items)) return null
    return p
  } catch {
    return null
  }
}

export function saveGuestCart(state: GuestCartStored | null): void {
  if (!state || state.items.length === 0) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearGuestCart(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** Replace cart with a single line (used after vendor switch). */
export function setGuestCartSingle(vendorId: string, vendorProductId: string, quantity: number): void {
  saveGuestCart({
    vendorId,
    items: [{ vendorProductId, quantity }],
  })
}

export function upsertGuestLine(
  vendorId: string,
  vendorProductId: string,
  quantityDelta: number,
): GuestCartStored {
  let cart = loadGuestCart()
  if (!cart || cart.vendorId !== vendorId) {
    cart = { vendorId, items: [] }
  }
  const idx = cart.items.findIndex((i) => i.vendorProductId === vendorProductId)
  if (idx >= 0) {
    const nextQty = cart.items[idx].quantity + quantityDelta
    if (nextQty <= 0) {
      cart.items.splice(idx, 1)
    } else {
      cart.items[idx] = { vendorProductId, quantity: nextQty }
    }
  } else if (quantityDelta > 0) {
    cart.items.push({ vendorProductId, quantity: quantityDelta })
  }
  if (cart.items.length === 0) {
    clearGuestCart()
    return { vendorId, items: [] }
  }
  saveGuestCart(cart)
  return cart
}

export function setGuestLineQuantity(vendorProductId: string, quantity: number): GuestCartStored | null {
  const cart = loadGuestCart()
  if (!cart) return null
  const idx = cart.items.findIndex((i) => i.vendorProductId === vendorProductId)
  if (idx < 0) return cart
  if (quantity <= 0) {
    cart.items.splice(idx, 1)
  } else {
    cart.items[idx] = { vendorProductId, quantity }
  }
  if (cart.items.length === 0) {
    clearGuestCart()
    return null
  }
  saveGuestCart(cart)
  return cart
}

export function removeGuestLine(vendorProductId: string): GuestCartStored | null {
  const cart = loadGuestCart()
  if (!cart) return null
  cart.items = cart.items.filter((i) => i.vendorProductId !== vendorProductId)
  if (cart.items.length === 0) {
    clearGuestCart()
    return null
  }
  saveGuestCart(cart)
  return cart
}
