import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAddToCart,
  useRemoveCartItem,
  useUpdateCartItem,
  useCartQuery,
} from '@/hooks/use-cart'
import { ROUTES } from '@/constants/routes'
import { setPendingCartAdd } from '@/lib/pending-cart'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'
import { getApiErrorMessage } from '@/utils/api-error'

export function useVendorCartActions() {
  const navigate = useNavigate()
  const location = useLocation()
  const authed = useAuthStore(selectIsAuthenticated)
  const { data: cart } = useCartQuery()
  const add = useAddToCart()
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const [switchOpen, setSwitchOpenState] = useState(false)
  const pending = useRef<{ vendorProductId: string; quantity: number } | null>(
    null,
  )

  const setSwitchOpen = (open: boolean) => {
    setSwitchOpenState(open)
    if (!open) pending.current = null
  }

  const addWithSwitch = (
    menuVendorId: string,
    vendorProductId: string,
    quantity: number,
  ) => {
    if (!authed) {
      setPendingCartAdd({
        vendorId: menuVendorId,
        vendorProductId,
        quantity,
        returnPath: `${location.pathname}${location.search}${location.hash}`,
      })
      navigate(ROUTES.login, {
        state: { from: `${location.pathname}${location.search}${location.hash}` },
      })
      toast.message('Sign in to add items to your cart')
      return
    }

    if (
      cart &&
      cart.items.length > 0 &&
      cart.vendorId !== menuVendorId
    ) {
      pending.current = { vendorProductId, quantity }
      setSwitchOpenState(true)
      return
    }
    add.mutate(
      { vendorProductId, quantity },
      {
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
    add.mutate(
      { vendorProductId: p.vendorProductId, quantity: p.quantity },
      {
        onSuccess: () => {
          pending.current = null
          setSwitchOpenState(false)
          toast.success('Cart updated for this vendor')
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
    updateQty: (itemId: string, quantity: number) =>
      update.mutate(
        { itemId, quantity },
        {
          onError: (e) =>
            toast.error(getApiErrorMessage(e, 'Could not update quantity')),
        },
      ),
    removeLine: (itemId: string) =>
      remove.mutate(itemId, {
        onError: (e) =>
          toast.error(getApiErrorMessage(e, 'Could not remove item')),
      }),
  }
}
