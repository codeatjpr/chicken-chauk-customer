const STORAGE_KEY = 'chicken-chauk-pending-cart-add'

export type PendingCartAdd = {
  vendorId: string
  vendorProductId: string
  quantity: number
  /** Path + search to return to after sign-in (e.g. `/vendors/uuid`). */
  returnPath: string
}

export function setPendingCartAdd(payload: PendingCartAdd) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function getPendingCartAdd(): PendingCartAdd | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PendingCartAdd
    if (
      !p?.vendorProductId ||
      !p?.vendorId ||
      typeof p.quantity !== 'number'
    ) {
      return null
    }
    return p
  } catch {
    return null
  }
}

export function clearPendingCartAdd() {
  sessionStorage.removeItem(STORAGE_KEY)
}
