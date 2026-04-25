import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  useAddToCart,
  useRemoveCartItem,
  useUpdateCartItem,
  useCartQuery,
} from '@/hooks/use-cart'
import { queryKeys } from '@/constants/query-keys'
import { fetchVendorProductById } from '@/services/catalog.service'
import {
  loadGuestCart,
  removeGuestLine,
  setGuestCartSingle,
  setGuestLineQuantity,
  upsertGuestLine,
} from '@/lib/guest-cart-storage'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'
import { getApiErrorMessage } from '@/utils/api-error'
import { useCartAddFeedbackStore } from '@/stores/cart-add-feedback-store'

type PendingSwitch = {
  vendorProductId: string
  quantity: number
  menuVendorId: string
}

export function useVendorCartActions() {
  const qc = useQueryClient()
  const authed = useAuthStore(selectIsAuthenticated)
  const { data: cart } = useCartQuery()
  const add = useAddToCart()
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const [switchOpen, setSwitchOpenState] = useState(false)
  const pending = useRef<PendingSwitch | null>(null)

  const setSwitchOpen = (open: boolean) => {
    setSwitchOpenState(open)
    if (!open) pending.current = null
  }

  const invalidateGuestCart = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.cart.guestSummary })
  }

  const addWithSwitch = (
    menuVendorId: string,
    vendorProductId: string,
    quantity: number,
  ) => {
    if (!authed) {
      const guest = loadGuestCart()
      if (guest && guest.items.length > 0 && guest.vendorId !== menuVendorId) {
        pending.current = { vendorProductId, quantity, menuVendorId }
        setSwitchOpenState(true)
        return
      }

      void (async () => {
        try {
          const vp = await fetchVendorProductById(vendorProductId)
          if (!vp || vp.vendor.id !== menuVendorId) {
            toast.error('This product is not available')
            return
          }
          if (!vp.isAvailable || !vp.vendor.isActive) {
            toast.error('This product is not available')
            return
          }
          if (!vp.vendor.isOpen) {
            toast.message('This shop is closed right now')
            return
          }
          const g = loadGuestCart()
          if (g && g.items.length > 0 && g.vendorId !== menuVendorId) {
            pending.current = { vendorProductId, quantity, menuVendorId }
            setSwitchOpenState(true)
            return
          }
          const existing = g?.items.find((i) => i.vendorProductId === vendorProductId)
          const nextQty = (existing?.quantity ?? 0) + quantity
          if (nextQty > vp.stock) {
            toast.error(
              vp.stock <= 0
                ? 'Out of stock'
                : `Only ${vp.stock} available in stock`,
            )
            return
          }
          upsertGuestLine(menuVendorId, vendorProductId, quantity)
          invalidateGuestCart()
          useCartAddFeedbackStore.getState().push({
            vendorProductId,
            productName: vp.product.name,
            quantity: nextQty,
            shopName: vp.vendor.name,
          })
        } catch (e) {
          toast.error(getApiErrorMessage(e, 'Could not add to cart'))
        }
      })()
      return
    }

    if (cart && cart.items.length > 0 && cart.vendorId !== menuVendorId) {
      pending.current = { vendorProductId, quantity, menuVendorId }
      setSwitchOpenState(true)
      return
    }
    add.mutate(
      { vendorProductId, quantity },
      {
        onSuccess: (data) => {
          const line = data.items.find((i) => i.vendorProductId === vendorProductId)
          useCartAddFeedbackStore.getState().push({
            vendorProductId,
            productName: line?.name ?? 'Item',
            quantity: line?.quantity ?? quantity,
            shopName: data.vendorName,
          })
        },
        onError: (e) =>
          toast.error(getApiErrorMessage(e, 'Could not add to cart')),
      },
    )
  }

  const confirmVendorSwitch = () => {
    const p = pending.current
    if (!p) {
      setSwitchOpenState(false)
      return
    }

    if (!authed) {
      void (async () => {
        try {
          const vp = await fetchVendorProductById(p.vendorProductId)
          if (!vp || vp.vendor.id !== p.menuVendorId) {
            toast.error('This product is not available')
            pending.current = null
            setSwitchOpenState(false)
            return
          }
          if (!vp.isAvailable || !vp.vendor.isActive || !vp.vendor.isOpen) {
            toast.error('This product is not available')
            pending.current = null
            setSwitchOpenState(false)
            return
          }
          const qty = Math.min(p.quantity, vp.stock)
          if (qty <= 0) {
            toast.error('Out of stock')
            pending.current = null
            setSwitchOpenState(false)
            return
          }
          setGuestCartSingle(p.menuVendorId, p.vendorProductId, qty)
          pending.current = null
          setSwitchOpenState(false)
          invalidateGuestCart()
          useCartAddFeedbackStore.getState().push({
            vendorProductId: p.vendorProductId,
            productName: vp.product.name,
            quantity: qty,
            shopName: vp.vendor.name,
          })
          toast.success('Cart updated for this shop')
        } catch (e) {
          toast.error(getApiErrorMessage(e, 'Could not update cart'))
        }
      })()
      return
    }

    add.mutate(
      { vendorProductId: p.vendorProductId, quantity: p.quantity },
      {
        onSuccess: (data) => {
          pending.current = null
          setSwitchOpenState(false)
          const line = data.items.find((i) => i.vendorProductId === p.vendorProductId)
          useCartAddFeedbackStore.getState().push({
            vendorProductId: p.vendorProductId,
            productName: line?.name ?? 'Item',
            quantity: line?.quantity ?? p.quantity,
            shopName: data.vendorName,
          })
          toast.success('Cart updated for this shop')
        },
        onError: (e) =>
          toast.error(getApiErrorMessage(e, 'Could not update cart')),
      },
    )
  }

  return {
    cart,
    addWithSwitch,
    switchOpen,
    setSwitchOpen,
    confirmVendorSwitch,
    addIsPending: add.isPending,
    updateIsPending: update.isPending,
    removeIsPending: remove.isPending,
    updateQty: (itemId: string, quantity: number) => {
      if (itemId.startsWith('guest-')) {
        const vendorProductId = itemId.replace(/^guest-/, '')
        setGuestLineQuantity(vendorProductId, quantity)
        invalidateGuestCart()
        return
      }
      update.mutate(
        { itemId, quantity },
        {
          onError: (e) =>
            toast.error(getApiErrorMessage(e, 'Could not update quantity')),
        },
      )
    },
    removeLine: (itemId: string) => {
      if (itemId.startsWith('guest-')) {
        const vendorProductId = itemId.replace(/^guest-/, '')
        removeGuestLine(vendorProductId)
        invalidateGuestCart()
        return
      }
      remove.mutate(itemId, {
        onError: (e) =>
          toast.error(getApiErrorMessage(e, 'Could not remove item')),
      })
    },
  }
}
