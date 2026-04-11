import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  useAddToCart,
  useRemoveCartItem,
  useUpdateCartItem,
  useCartQuery,
} from '@/hooks/use-cart'
import { getApiErrorMessage } from '@/utils/api-error'

export function useVendorCartActions() {
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
