import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  CreditCard,
  Loader2Icon,
  MapPin,
  Plus,
  ShoppingBag,
  Tag,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AddAddressDialog } from '@/components/organisms/add-address-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { orderPath, ROUTES, vendorPath } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import * as addressesApi from '@/services/addresses.service'
import { validateCartForCheckout } from '@/services/cart.service'
import * as ordersApi from '@/services/orders.service'
import * as walletApi from '@/services/wallet.service'
import { cn } from '@/lib/utils'
import type { PaymentMethodDto } from '@/types/order'
import type { CouponValidationResultDto } from '@/types/wallet'
import { formatInr } from '@/utils/format'
import { getApiErrorMessage } from '@/utils/api-error'

const PAYMENT_OPTIONS: { value: PaymentMethodDto; label: string; hint?: string }[] = [
  { value: 'COD', label: 'Cash on delivery' },
  { value: 'UPI', label: 'UPI', hint: 'Pay after vendor confirms' },
  { value: 'CARD', label: 'Card' },
  { value: 'NETBANKING', label: 'Net banking' },
]

export function CheckoutPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: cart, isLoading: cartLoading } = useCartQuery()
  const [addressOpen, setAddressOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodDto>('COD')
  const [pickedAddressId, setPickedAddressId] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponPreview, setCouponPreview] = useState<CouponValidationResultDto | null>(null)
  const [walletToUse, setWalletToUse] = useState('')
  const [instructions, setInstructions] = useState('')

  const addressesQuery = useQuery({
    queryKey: queryKeys.addresses.list,
    queryFn: () => addressesApi.fetchAddresses(),
  })

  const walletQuery = useQuery({
    queryKey: queryKeys.wallet.summary,
    queryFn: () => walletApi.fetchWallet(),
  })

  const validateCouponMut = useMutation({
    mutationFn: () => {
      if (!cart) throw new Error('Cart missing')
      const code = couponCode.trim()
      if (!code.length) throw new Error('Enter a coupon code')
      return walletApi.validateCoupon({
        code,
        orderAmount: cart.estimatedTotal,
        vendorId: cart.vendorId,
      })
    },
    onSuccess: (res) => {
      setCouponPreview(res)
      toast.success(`Coupon applied · save ${formatInr(res.discount)}`)
    },
    onError: (e) => {
      setCouponPreview(null)
      toast.error(getApiErrorMessage(e, 'Coupon not applied'))
    },
  })

  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data])

  const fallbackAddressId = useMemo(() => {
    if (addresses.length === 0) return null
    return (addresses.find((a) => a.isDefault) ?? addresses[0]).id
  }, [addresses])

  const selectedAddressId = pickedAddressId ?? fallbackAddressId

  const addAddress = useMutation({
    mutationFn: addressesApi.createAddress,
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: queryKeys.addresses.list })
      setPickedAddressId(created.id)
    },
  })

  const maxWalletApplicable = useMemo(() => {
    if (!cart) return 0
    const afterCoupon =
      couponPreview && couponPreview.code === couponCode.trim().toUpperCase()
        ? couponPreview.finalAmount
        : cart.estimatedTotal
    const bal = walletQuery.data?.balance ?? 0
    return Math.max(0, Math.min(bal, afterCoupon))
  }, [cart, couponPreview, couponCode, walletQuery.data?.balance])

  const walletAmountToUse = useMemo(() => {
    const raw = Number.parseFloat(walletToUse.replace(/,/g, ''))
    if (!Number.isFinite(raw) || raw <= 0) return 0
    return Math.min(raw, maxWalletApplicable)
  }, [walletToUse, maxWalletApplicable])

  const appliedCouponCode = useMemo(() => {
    if (!couponPreview) return undefined
    const code = couponCode.trim().toUpperCase()
    return couponPreview.code === code ? couponPreview.code : undefined
  }, [couponPreview, couponCode])

  const validationPreviewQuery = useQuery({
    queryKey: [
      ...queryKeys.cart.summary,
      'checkout-preview',
      selectedAddressId ?? 'none',
      paymentMethod,
      appliedCouponCode ?? '',
      walletAmountToUse,
    ],
    queryFn: () =>
      validateCartForCheckout({
        deliveryAddressId: selectedAddressId!,
        paymentMethod,
        couponCode: appliedCouponCode,
        walletAmountToUse,
      }),
    enabled: Boolean(cart && selectedAddressId),
  })

  const placeOrder = useMutation({
    mutationFn: () => {
      if (!selectedAddressId) throw new Error('Choose a delivery address')
      const code = couponCode.trim()
      return ordersApi.validateAndPlaceOrder({
        deliveryAddressId: selectedAddressId,
        paymentMethod,
        couponCode: code.length ? code : undefined,
        walletAmountToUse,
        specialInstructions: instructions.trim() || undefined,
      })
    },
    onSuccess: ({ order }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart.summary })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
      void qc.invalidateQueries({ queryKey: queryKeys.wallet.summary })
      toast.success('Order placed')
      navigate(orderPath(order.id), { replace: true })
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not place order')),
  })

  const summary = useMemo(() => {
    if (!cart) return null
    const preview = validationPreviewQuery.data
    return {
      itemsTotal: preview?.itemsTotal ?? cart.itemsTotal,
      deliveryFee: preview?.deliveryFee ?? cart.deliveryFee,
      platformFee: preview?.platformFee ?? cart.platformFee,
      taxAmount: preview?.taxAmount ?? 0,
      discount: preview?.discount ?? 0,
      walletAmountUsed: preview?.walletAmountToUse ?? 0,
      estimatedTotal: cart.estimatedTotal,
      totalPayable: preview?.finalAmount ?? cart.estimatedTotal,
      hasValidatedTotals: Boolean(preview),
    }
  }, [cart, validationPreviewQuery.data])

  if (cartLoading) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-8 w-48" />
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="hidden h-80 rounded-2xl lg:block" />
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return <Navigate to={ROUTES.cart} replace />
  }

  return (
    <div className="pb-10 lg:pb-12">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBag className="text-primary size-6 shrink-0" aria-hidden />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            From{' '}
            <Link
              to={vendorPath(cart.vendorId)}
              className="text-foreground font-medium hover:underline"
            >
              {cart.vendorName}
            </Link>
          </p>
        </div>
      </div>

      {/* Desktop two-column | Mobile single column */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">

        {/* ── LEFT: Address + Payment + Coupon + Instructions ── */}
        <div className="space-y-5">

          {/* Delivery address */}
          <div className="border-border/70 bg-card rounded-2xl border p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="text-primary size-4 shrink-0" />
                <h2 className="font-semibold">Delivery address</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => setAddressOpen(true)}
              >
                <Plus className="size-3" />
                Add new
              </Button>
            </div>

            {addressesQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="border-border/60 rounded-xl border border-dashed px-4 py-8 text-center">
                <MapPin className="text-muted-foreground mx-auto mb-2 size-8" />
                <p className="text-muted-foreground text-sm">Add an address to continue.</p>
                <Button type="button" className="mt-4" onClick={() => setAddressOpen(true)}>
                  Add address
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {addresses.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setPickedAddressId(a.id)}
                      className={cn(
                        'w-full rounded-xl border p-3.5 text-start text-sm transition-colors',
                        selectedAddressId === a.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border/70 hover:bg-muted/40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">
                          {a.label}
                          {a.isDefault && (
                            <span className="text-muted-foreground ms-2 text-xs font-normal">
                              Default
                            </span>
                          )}
                        </p>
                        {selectedAddressId === a.id && (
                          <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1">
                        {a.addressLine1}
                        {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {a.city}, {a.state} {a.pincode}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Payment method */}
          <div className="border-border/70 bg-card rounded-2xl border p-5">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="text-primary size-4 shrink-0" />
              <h2 className="font-semibold">Payment method</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                    paymentMethod === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/70 bg-transparent hover:bg-muted/50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.hint && (
              <p className="text-muted-foreground mt-2.5 text-xs">
                {PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.hint}
              </p>
            )}
          </div>

          {/* Coupon + Wallet */}
          <div className="border-border/70 bg-card rounded-2xl border p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Tag className="text-primary size-4 shrink-0" />
              <h2 className="font-semibold">Savings</h2>
            </div>

            {/* Coupon */}
            <div className="space-y-2">
              <Label htmlFor="coupon">Coupon code</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value)
                    setCouponPreview(null)
                  }}
                  placeholder="Try a promo code"
                  autoCapitalize="characters"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  className="shrink-0 gap-1"
                  disabled={validateCouponMut.isPending || !cart || !couponCode.trim().length}
                  onClick={() => validateCouponMut.mutate()}
                >
                  {validateCouponMut.isPending ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <Tag className="size-4" />
                  )}
                  Apply
                </Button>
              </div>
              {couponPreview && couponPreview.code === couponCode.trim().toUpperCase() && (
                <p className="text-primary text-xs font-medium">
                  {couponPreview.title} · −{formatInr(couponPreview.discount)} · new subtotal{' '}
                  {formatInr(couponPreview.finalAmount)}
                </p>
              )}
            </div>

            {/* Wallet */}
            <div className="space-y-2">
              <Label htmlFor="wallet-use">Use wallet balance</Label>
              <Input
                id="wallet-use"
                inputMode="decimal"
                value={walletToUse}
                onChange={(e) => setWalletToUse(e.target.value)}
                placeholder="0"
              />
              <p className="text-muted-foreground text-xs">
                Available {formatInr(walletQuery.data?.balance ?? 0)} · up to{' '}
                {formatInr(maxWalletApplicable)} for this order
                {walletAmountToUse > 0 && (
                  <span className="text-foreground ms-1 font-medium">
                    · applying {formatInr(walletAmountToUse)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="border-border/70 bg-card rounded-2xl border p-5 space-y-3">
            <h2 className="font-semibold">Instructions for vendor</h2>
            <textarea
              id="notes"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={300}
              rows={3}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
              placeholder="e.g. Ring the doorbell twice, no spicy please…"
            />
            <p className="text-muted-foreground text-xs text-right">
              {instructions.length}/300
            </p>
          </div>

          {/* Back to cart — mobile only */}
          <div className="lg:hidden">
            <Link
              to={ROUTES.cart}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
            >
              Back to cart
            </Link>
          </div>
        </div>

        {/* ── RIGHT: Sticky order summary + Place order ── */}
        <div className="mt-6 lg:mt-0">
          <div className="border-border/70 bg-card lg:sticky lg:top-24 rounded-2xl border overflow-hidden">

            {/* Items preview */}
            <div className="border-border/50 border-b px-5 py-4">
              <h2 className="font-semibold">Order summary</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {cart.items.reduce((s, i) => s + i.quantity, 0)} item
                {cart.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''} from{' '}
                {cart.vendorName}
              </p>
            </div>

            {/* Items list */}
            <ul className="border-border/50 divide-border/50 divide-y border-b">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">{item.unit}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                    <p className="tabular-nums font-medium">{formatInr(item.total)}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Calculation */}
            {summary && (
              <div className="px-5 py-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items total</span>
                  <span className="tabular-nums text-foreground">{formatInr(summary.itemsTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery fee</span>
                  <span className="tabular-nums text-foreground">
                    {summary.deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-medium">FREE</span>
                    ) : (
                      formatInr(summary.deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform fee</span>
                  <span className="tabular-nums text-foreground">{formatInr(summary.platformFee)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes &amp; GST</span>
                  <span className="tabular-nums text-foreground">
                    {summary.hasValidatedTotals || summary.taxAmount > 0
                      ? formatInr(summary.taxAmount)
                      : '—'}
                  </span>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coupon discount</span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                      −{formatInr(summary.discount)}
                    </span>
                  </div>
                )}
                {summary.walletAmountUsed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wallet credit</span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                      −{formatInr(summary.walletAmountUsed)}
                    </span>
                  </div>
                )}

                <Separator className="my-1" />

                <div className="flex justify-between font-semibold text-base">
                  <span>{summary.hasValidatedTotals ? 'Total payable' : 'Estimated total'}</span>
                  <span className="tabular-nums">
                    {formatInr(summary.hasValidatedTotals ? summary.totalPayable : summary.estimatedTotal)}
                  </span>
                </div>

                {!summary.hasValidatedTotals && (
                  <p className="text-muted-foreground text-xs">
                    Select an address to see final totals.
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="border-border/50 border-t p-4 space-y-2">
              <Button
                type="button"
                className="w-full gap-2"
                size="lg"
                disabled={placeOrder.isPending || !selectedAddressId || addresses.length === 0}
                onClick={() => placeOrder.mutate()}
              >
                {placeOrder.isPending && <Loader2Icon className="size-4 animate-spin" />}
                Place order
              </Button>
              <Link
                to={ROUTES.cart}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'w-full justify-center text-muted-foreground hidden lg:flex',
                )}
              >
                Back to cart
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AddAddressDialog
        open={addressOpen}
        onOpenChange={setAddressOpen}
        onSubmit={async (values) => {
          await addAddress.mutateAsync({
            label: values.label,
            addressLine1: values.addressLine1.trim(),
            addressLine2: values.addressLine2?.trim() || undefined,
            city: values.city.trim(),
            state: values.state.trim(),
            pincode: values.pincode,
            latitude: values.latitude,
            longitude: values.longitude,
            isDefault: addresses.length === 0,
          })
        }}
      />
    </div>
  )
}
