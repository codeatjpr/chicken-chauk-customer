import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import * as cartApi from '@/services/cart.service'
import { getApiErrorMessage } from '@/utils/api-error'

export function useCartQuery() {
  return useQuery({
    queryKey: queryKeys.cart.summary,
    queryFn: () => cartApi.fetchCart(),
  })
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cartApi.addCartItem,
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.cart.summary, data)
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
    },
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      itemId,
      quantity,
    }: {
      itemId: string
      quantity: number
    }) => cartApi.updateCartItem(itemId, { quantity }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.cart.summary, data)
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
    },
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cartApi.removeCartItem,
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.cart.summary, data)
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
    },
  })
}

export { getApiErrorMessage as getCartErrorMessage }
