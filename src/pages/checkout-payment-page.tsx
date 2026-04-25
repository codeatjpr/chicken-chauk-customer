import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Loader2Icon, MapPin, ShoppingBag, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { openRazorpayCheckout } from '@/components/organisms/pay-order-button'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { orderTrackingPath, ROUTES, vendorPath } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import * as addressesApi from '@/services/addresses.service'
import { validateCartForCheckout } from '@/services/cart.service'
import * as ordersApi from '@/services/orders.service'
import { cn } from '@/lib/utils'
import type { CartValidationResultDto, OrderDetailDto, PaymentMethodDto } from '@/types/order'
import { formatInr } from '@/utils/format'
import { getApiErrorMessage } from '@/utils/api-error'

export type CheckoutPaymentLocationState = {
  deliveryAddressId: string
  couponCode?: string
  walletAmountToUse: number
  specialInstructions?: string
}

/** Passed when returning from payment → checkout so fields can be restored */
export type CheckoutRestoreState = {
  restoreAddressId?: string
  restoreCoupon?: string
  restoreWalletInput?: string
  restoreInstructions?: string
}

type PaySession = {
  order: OrderDetailDto
  validation: CartValidationResultDto
}

function backToCheckoutState(
  s: CheckoutPaymentLocationState | null,
): CheckoutRestoreState | undefined {
  if (!s) return undefined
  return {
    restoreAddressId: s.deliveryAddressId,
    restoreCoupon: s.couponCode,
    restoreWalletInput:
      s.walletAmountToUse > 0 ? String(s.walletAmountToUse) : undefined,
    restoreInstructions: s.specialInstructions,
  }
}

function formatAddressFromDto(a: OrderDetailDto['deliveryAddress']): string {
  if (!a) return '—'
  const line2 = a.addressLine2 ? `, ${a.addressLine2}` : ''
  return `${a.addressLine1}${line2}, ${a.city}, ${a.state} ${a.pincode}`
}

type ListAddr = Awaited<ReturnType<typeof addressesApi.fetchAddresses>>[number]
function formatAddressList(a: ListAddr): string {
  const line2 = a.addressLine2 ? `, ${a.addressLine2}` : ''
  return `${a.addressLine1}${line2}, ${a.city}, ${a.state} ${a.pincode}`
}

const ONLINE_METHODS: { value: PaymentMethodDto; label: string }[] = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'NETBANKING', label: 'Net banking' },
]

export function CheckoutPaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const state = location.state as CheckoutPaymentLocationState | null

  const { data: cart, isLoading: cartLoading, isFetching: cartFetching } = useCartQuery()
  const [paySession, setPaySession] = useState<PaySession | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodDto>('UPI')

  const addressesId = state?.deliveryAddressId
  const walletAmountToUse = state?.walletAmountToUse ?? 0
  const couponForApi = state?.couponCode?.trim() || undefined

  const addressesQuery = useQuery({
    queryKey: queryKeys.addresses.list,
    queryFn: () => addressesApi.fetchAddresses(),
    enabled: Boolean(!paySession && addressesId),
  })

  const selectedFromList = useMemo((): ListAddr | undefined => {
    if (!addressesId || !addressesQuery.data) return undefined
    return addressesQuery.data.find((a) => a.id === addressesId)
  }, [addressesId, addressesQuery.data])

  const validationQuery = useQuery({
    queryKey: [
      ...queryKeys.cart.summary,
      'payment-validate',
      addressesId ?? 'none',
      couponForApi ?? '',
      walletAmountToUse,
    ],
    queryFn: () =>
      validateCartForCheckout({
        deliveryAddressId: addressesId!,
        couponCode: couponForApi,
        walletAmountToUse,
      }),
    enabled: Boolean(
      !paySession && cart && cart.items.length > 0 && addressesId,
    ),
  })

  const displayVendorName = paySession
    ? paySession.order.vendor.name
    : (cart?.vendorName ?? '—')
  const displayVendorId = paySession
    ? paySession.order.vendorId
    : (cart?.vendorId ?? '')

  const lineItems = paySession
    ? paySession.order.items
    : (cart?.items.map((i) => ({
        id: i.id,
        productName: i.name,
        unit: i.unit,
        total: i.total,
      })) ?? [])

  const summary = useMemo(() => {
    if (paySession) {
      const o = paySession.order
      return {
        itemsTotal: o.itemsTotal,
        deliveryFee: o.deliveryFee,
        platformFee: o.platformFee,
        discount: o.discount,
        walletAmountUsed: o.walletAmountUsed,
        totalPayable: o.finalAmount,
        hasFinal: true,
        estimatedTotal: o.finalAmount,
      }
    }
    if (!cart) return null
    const v = validationQuery.data
    return {
      itemsTotal: v?.itemsTotal ?? cart.itemsTotal,
      deliveryFee: v?.deliveryFee ?? cart.deliveryFee,
      platformFee: v?.platformFee ?? cart.platformFee,
      discount: v?.discount ?? 0,
      walletAmountUsed: v?.walletAmountToUse ?? 0,
      totalPayable: v?.finalAmount ?? cart.estimatedTotal,
      estimatedTotal: cart.estimatedTotal,
      hasFinal: Boolean(v),
    }
  }, [paySession, cart, validationQuery.data])

  const placeAndSettle = useMutation({
    mutationFn: () => {
      if (!state) throw new Error('Missing checkout state')
      return ordersApi.validateAndPlaceOrder({
        deliveryAddressId: state.deliveryAddressId,
        paymentMethod,
        couponCode: couponForApi,
        walletAmountToUse: state.walletAmountToUse,
        specialInstructions: state.specialInstructions,
      })
    },
    onSuccess: async ({ order, validation }) => {
      void qc.setQueryData(queryKeys.cart.summary, null)
      setPaySession({ order, validation })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
      void qc.invalidateQueries({ queryKey: queryKeys.wallet.summary })

      if (order.finalAmount <= 0 || order.paymentStatus === 'SUCCESS') {
        toast.success('Order placed')
        void qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
        navigate(orderTrackingPath(order.id), { replace: true })
        return
      }
      if (order.paymentStatus === 'PENDING' && order.finalAmount > 0) {
        try {
          await openRazorpayCheckout(
            order.id,
            formatInr(order.finalAmount),
            () => {
              setPaySession(null)
              void qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
              void qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
              void qc.invalidateQueries({ queryKey: queryKeys.wallet.summary })
              toast.success('Order placed')
              navigate(orderTrackingPath(order.id), { replace: true })
            },
            {
              onDismiss: async () => {
                let latest: OrderDetailDto
                try {
                  latest = await ordersApi.fetchOrderById(order.id)
                } catch {
                  return
                }
                if (latest.paymentStatus === 'SUCCESS' || latest.status === 'CANCELLED') {
                  return
                }
                try {
                  await ordersApi.abandonUnpaidCheckout(order.id)
                  setPaySession(null)
                  await qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
                  await qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
                  await qc.invalidateQueries({ queryKey: queryKeys.wallet.summary })
                  toast.info(
                    'Payment window closed. Your bag was restored — you can try again or change checkout details.',
                  )
                } catch (e) {
                  toast.error(
                    getApiErrorMessage(
                      e,
                      'Could not restore your bag. You can try again from your order.',
                    ),
                  )
                }
              },
            },
          )
        } catch {
          // network / initiate errors — order exists; show pay on order
        }
        return
      }
      void qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
      navigate(orderTrackingPath(order.id), { replace: true })
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not complete order')),
  })

  const canShowPage =
    paySession || (cart && cart.items.length > 0 && state?.deliveryAddressId)

  const handleBackToCheckout = async () => {
    if (
      paySession &&
      paySession.order.paymentStatus === 'PENDING' &&
      paySession.order.finalAmount > 0 &&
      paySession.order.status === 'PLACED'
    ) {
      try {
        await ordersApi.abandonUnpaidCheckout(paySession.order.id)
        setPaySession(null)
        await qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
        await qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
        await qc.invalidateQueries({ queryKey: queryKeys.wallet.summary })
        toast.info('We moved your items back to the bag for checkout.')
      } catch (e) {
        toast.error(getApiErrorMessage(e, 'Could not return to checkout'))
        return
      }
    }
    navigate(ROUTES.checkout, { state: backToCheckoutState(state) })
  }

  if (cartLoading && !paySession) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-8 w-48" />
        <div className="lg:grid lg:grid-cols-[1fr_min(420px,40vw)] lg:gap-0 lg:min-h-[calc(100vh-5rem)]">
          <div className="space-y-4 p-1 lg:pr-6">
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="hidden min-h-80 rounded-2xl lg:block" />
        </div>
      </div>
    )
  }

  if (!state?.deliveryAddressId) {
    return <Navigate to={ROUTES.checkout} replace />
  }

  if (!canShowPage) {
    return <Navigate to={ROUTES.cart} replace />
  }

  return (
    <div className="pb-10 lg:pb-0">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => void handleBackToCheckout()}
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Back to checkout
        </button>
        <div className="flex items-center gap-3">
          <ShoppingBag className="text-primary size-6 shrink-0" aria-hidden />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              From{' '}
              {displayVendorId ? (
                <Link
                  to={vendorPath(displayVendorId)}
                  className="text-foreground font-medium hover:underline"
                >
                  {displayVendorName}
                </Link>
              ) : (
                displayVendorName
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_min(420px,40vw)] lg:min-h-[calc(100vh-7rem)] lg:gap-0">
        <div className="space-y-5 lg:border-border lg:max-h-[calc(100vh-7rem)] lg:min-h-0 lg:overflow-y-auto lg:pr-6 lg:pb-8">
          <div className="border-border/70 bg-card rounded-2xl border p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="text-primary size-4 shrink-0" />
              <h2 className="font-semibold">Delivery address</h2>
            </div>
            {paySession?.order.deliveryAddress ? (
              <div className="text-sm leading-relaxed">
                <p className="text-foreground font-medium">
                  {paySession.order.deliveryAddress.label}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {formatAddressFromDto(paySession.order.deliveryAddress)}
                </p>
                {(paySession.order.deliveryAddress.mapFormattedAddress ||
                  paySession.order.deliveryAddress.plusCode) && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {paySession.order.deliveryAddress.plusCode && (
                      <span className="text-foreground font-mono">
                        {paySession.order.deliveryAddress.plusCode}
                        {paySession.order.deliveryAddress.mapFormattedAddress ? ' · ' : null}
                      </span>
                    )}
                    {paySession.order.deliveryAddress.mapFormattedAddress}
                  </p>
                )}
                <p className="text-muted-foreground mt-2 text-xs">
                  Chosen at checkout. To change, use &quot;Back to checkout&quot; above
                  {paySession && ' — your bag is restored if you go back or cancel payment'}.
                </p>
              </div>
            ) : selectedFromList ? (
              <div className="text-sm leading-relaxed">
                <p className="text-foreground font-medium">
                  {selectedFromList.label}
                  {selectedFromList.isDefault && (
                    <span className="text-muted-foreground"> (default)</span>
                  )}
                </p>
                <p className="text-muted-foreground mt-0.5">{formatAddressList(selectedFromList)}</p>
                {(selectedFromList.mapFormattedAddress || selectedFromList.plusCode) && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {selectedFromList.plusCode && (
                      <span className="text-foreground font-mono">{selectedFromList.plusCode} · </span>
                    )}
                    {selectedFromList.mapFormattedAddress}
                  </p>
                )}
                <p className="text-muted-foreground mt-2 text-xs">
                  To change, go back to checkout.
                </p>
              </div>
            ) : addressesQuery.isLoading ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : (
              <p className="text-muted-foreground text-sm">Loading address…</p>
            )}
          </div>

          <div className="border-border/70 bg-card rounded-2xl border p-5">
            <h2 className="mb-3 font-semibold">How would you like to pay?</h2>
            <div className="flex flex-wrap gap-2">
              {ONLINE_METHODS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  className={cn(
                    'rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                    paymentMethod === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/70 bg-transparent hover:bg-muted/50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Cash on delivery is not available. You can use UPI, card, or net banking via Razorpay.
            </p>
          </div>

          <div className="border-border/70 bg-card rounded-2xl border p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="text-primary size-4 shrink-0" />
              <h2 className="font-semibold">Savings (from checkout)</h2>
            </div>
            {couponForApi && (
              <p className="text-muted-foreground text-sm">Coupon: {couponForApi}</p>
            )}
            {walletAmountToUse > 0 && (
              <p className="text-muted-foreground text-sm">
                Wallet credit: {formatInr(walletAmountToUse)}
              </p>
            )}
            {!couponForApi && walletAmountToUse <= 0 && (
              <p className="text-muted-foreground text-sm">No coupon or wallet applied.</p>
            )}
            <p className="text-muted-foreground text-xs">
              To change coupon or wallet, go back to checkout.
            </p>
          </div>
        </div>

        <div className="mt-6 lg:mt-0 lg:border-border lg:bg-card/30 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:border-l lg:pl-6">
          <div className="border-border/70 bg-card lg:rounded-2xl lg:border lg:shadow-sm">
            <div className="border-border/50 border-b px-5 py-4">
              <h2 className="font-semibold">Bill summary</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Prices include all taxes. No extra GST.
              </p>
            </div>
            <ul className="border-border/50 divide-border/50 max-h-48 divide-y overflow-y-auto">
              {lineItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.productName}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.unit} (incl. of all taxes)
                    </p>
                  </div>
                  <p className="shrink-0 tabular-nums font-medium">{formatInr(item.total)}</p>
                </li>
              ))}
            </ul>
            {summary && (
              <div className="px-5 py-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items total</span>
                  <span className="tabular-nums text-foreground">
                    {formatInr(summary.itemsTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span
                    className={cn(
                      'tabular-nums',
                      summary.deliveryFee === 0 && 'text-emerald-600 font-medium dark:text-emerald-400',
                    )}
                  >
                    {summary.deliveryFee === 0 ? 'FREE' : formatInr(summary.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform fee</span>
                  <span
                    className={cn(
                      'tabular-nums',
                      summary.platformFee === 0 && 'text-emerald-600 font-medium dark:text-emerald-400',
                    )}
                  >
                    {summary.platformFee === 0 ? 'FREE' : formatInr(summary.platformFee)}
                  </span>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Coupon</span>
                    <span className="tabular-nums">−{formatInr(summary.discount)}</span>
                  </div>
                )}
                {summary.walletAmountUsed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wallet</span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                      −{formatInr(summary.walletAmountUsed)}
                    </span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatInr(summary.hasFinal ? summary.totalPayable : summary.estimatedTotal)}
                  </span>
                </div>
              </div>
            )}

            <div className="border-border/50 space-y-2 border-t p-4">
              <Button
                type="button"
                className="w-full gap-2 bg-[#f97316] text-lg font-semibold text-white hover:bg-[#ea580c]"
                size="lg"
                disabled={
                  placeAndSettle.isPending ||
                  (!!cart && !paySession && !validationQuery.data) ||
                  (cartFetching && !paySession) ||
                  (!!paySession && !paySession.order.id)
                }
                onClick={() => {
                  if (paySession) {
                    void (async () => {
                      const { order } = paySession
                      try {
                        await openRazorpayCheckout(
                          order.id,
                          formatInr(order.finalAmount),
                          () => {
                            setPaySession(null)
                            void qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
                            void qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
                            void qc.invalidateQueries({ queryKey: queryKeys.wallet.summary })
                            toast.success('Order placed')
                            navigate(orderTrackingPath(order.id), { replace: true })
                          },
                          {
                            onDismiss: async () => {
                              let latest: OrderDetailDto
                              try {
                                latest = await ordersApi.fetchOrderById(order.id)
                              } catch {
                                return
                              }
                              if (latest.paymentStatus === 'SUCCESS' || latest.status === 'CANCELLED') {
                                return
                              }
                              try {
                                await ordersApi.abandonUnpaidCheckout(order.id)
                                setPaySession(null)
                                await qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
                                await qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
                                await qc.invalidateQueries({ queryKey: queryKeys.wallet.summary })
                                toast.info(
                                  'Payment window closed. Your bag was restored — you can try again or change details.',
                                )
                              } catch (e) {
                                toast.error(
                                  getApiErrorMessage(
                                    e,
                                    'Could not restore your bag. Pay from the order, or try again later.',
                                  ),
                                )
                              }
                            },
                          },
                        )
                      } catch {
                        // open errors
                      }
                    })()
                    return
                  }
                  placeAndSettle.mutate()
                }}
              >
                {placeAndSettle.isPending && <Loader2Icon className="size-4 animate-spin" />}
                {summary
                  ? `Click to pay ${formatInr(summary.hasFinal ? summary.totalPayable : summary.estimatedTotal)}`
                  : 'Pay'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
