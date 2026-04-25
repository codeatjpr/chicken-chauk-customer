import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Loader2Icon, MapPin, Plus, ShoppingBag, Tag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AddAddressDialog } from '@/components/organisms/add-address-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES, vendorPath } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import * as addressesApi from '@/services/addresses.service'
import { validateCartForCheckout } from '@/services/cart.service'
import * as walletApi from '@/services/wallet.service'
import type { CheckoutRestoreState } from '@/pages/checkout-payment-page'
import { cn } from '@/lib/utils'
import type { CouponValidationResultDto } from '@/types/wallet'
import { formatInr } from '@/utils/format'
import { getApiErrorMessage } from '@/utils/api-error'

type UserAddress = Awaited<ReturnType<typeof addressesApi.fetchAddresses>>[number]

function formatAddressLines(a: UserAddress): string {
  const line2 = a.addressLine2 ? `, ${a.addressLine2}` : ''
  return `${a.addressLine1}${line2}, ${a.city}, ${a.state} ${a.pincode}`
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const restore = (location.state as CheckoutRestoreState | null) ?? null
  const qc = useQueryClient()
  const { data: cart, isLoading: cartLoading } = useCartQuery()
  const [addressOpen, setAddressOpen] = useState(false)
  const [pickedAddressId, setPickedAddressId] = useState<string | null>(() => restore?.restoreAddressId ?? null)
  const [couponCode, setCouponCode] = useState(() => restore?.restoreCoupon ?? '')
  const [couponPreview, setCouponPreview] = useState<CouponValidationResultDto | null>(null)
  const [walletToUse, setWalletToUse] = useState(() => restore?.restoreWalletInput ?? '')
  const [instructions, setInstructions] = useState(() => restore?.restoreInstructions ?? '')
  const [continueToPayBusy, setContinueToPayBusy] = useState(false)

  useEffect(() => {
    if (restore?.restoreAddressId) setPickedAddressId(restore.restoreAddressId)
    if (restore?.restoreCoupon != null) setCouponCode(restore.restoreCoupon)
    if (restore?.restoreWalletInput != null) setWalletToUse(restore.restoreWalletInput)
    if (restore?.restoreInstructions != null) setInstructions(restore.restoreInstructions)
  }, [restore?.restoreAddressId, restore?.restoreCoupon, restore?.restoreWalletInput, restore?.restoreInstructions])

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
      appliedCouponCode ?? '',
      walletAmountToUse,
    ],
    queryFn: () =>
      validateCartForCheckout({
        deliveryAddressId: selectedAddressId!,
        couponCode: appliedCouponCode,
        walletAmountToUse,
      }),
    enabled: Boolean(cart && selectedAddressId),
    retry: 2,
  })

  const selectedAddress = useMemo((): UserAddress | undefined => {
    if (!selectedAddressId) return undefined
    return addresses.find((a) => a.id === selectedAddressId)
  }, [addresses, selectedAddressId])

  const summary = useMemo(() => {
    if (!cart) return null
    const preview = validationPreviewQuery.data
    return {
      itemsTotal: preview?.itemsTotal ?? cart.itemsTotal,
      deliveryFee: preview?.deliveryFee ?? cart.deliveryFee,
      platformFee: preview?.platformFee ?? cart.platformFee,
      discount: preview?.discount ?? 0,
      walletAmountUsed: preview?.walletAmountToUse ?? 0,
      estimatedTotal: cart.estimatedTotal,
      totalPayable: preview?.finalAmount ?? cart.estimatedTotal,
      hasValidatedTotals: Boolean(preview),
    }
  }, [cart, validationPreviewQuery.data])

  const goToPayment = async () => {
    if (!selectedAddressId || addresses.length === 0) {
      toast.error('Choose a delivery address')
      return
    }
    setContinueToPayBusy(true)
    try {
      // Always re-run validation on click so we don’t block on a slow/failed first fetch.
      const result = await validationPreviewQuery.refetch()
      if (result.isError || !result.data) {
        toast.error(
          getApiErrorMessage(
            result.error,
            'Could not load totals. Check your address and connection, then try again.',
          ),
        )
        return
      }
      navigate(ROUTES.checkoutPayment, {
        replace: false,
        state: {
          deliveryAddressId: selectedAddressId,
          couponCode: appliedCouponCode,
          walletAmountToUse,
          specialInstructions: instructions.trim() || undefined,
        },
      })
    } finally {
      setContinueToPayBusy(false)
    }
  }

  if (cartLoading) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-8 w-48" />
        <div className="lg:grid lg:grid-cols-[1fr_min(420px,40vw)] lg:min-h-[calc(100vh-5rem)] lg:gap-0">
          <div className="space-y-4 p-1 lg:pr-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="hidden min-h-80 rounded-2xl lg:block" />
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return <Navigate to={ROUTES.cart} replace />
  }

  return (
    <div className="pb-10 lg:pb-0">
      <div className="mb-6">
        <Link
          to={ROUTES.cart}
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Back to cart
        </Link>
        <div className="flex items-center gap-3">
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
            <p className="text-muted-foreground mt-1 text-xs">
              Payment is on the next step. Prices are inclusive of all taxes.
            </p>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_min(420px,40vw)] lg:min-h-[calc(100vh-7rem)] lg:gap-0">
        <div className="space-y-5 lg:max-h-[calc(100vh-7rem)] lg:min-h-0 lg:overflow-y-auto lg:pr-6 lg:pb-8">
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
                <Skeleton className="h-12 rounded-xl" />
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
              <div className="space-y-2">
                <Select
                  value={selectedAddressId ?? undefined}
                  onValueChange={(v) => setPickedAddressId(v)}
                >
                  <SelectTrigger
                    aria-label="Select delivery address"
                    className="border-primary/40 focus-visible:ring-primary/30 h-auto min-h-11 items-start py-2.5 text-left shadow-none"
                  >
                    <div
                      data-slot="select-value"
                      className="min-w-0 flex-1 pr-1 text-left"
                    >
                      {selectedAddress ? (
                        <div className="space-y-0.5">
                          <p className="text-foreground font-medium leading-tight">
                            {selectedAddress.label}
                            {selectedAddress.isDefault && (
                              <span className="text-muted-foreground font-normal"> (default)</span>
                            )}
                          </p>
                          <p className="text-muted-foreground line-clamp-2 text-xs leading-snug">
                            {formatAddressLines(selectedAddress)}
                          </p>
                          {(selectedAddress.plusCode || selectedAddress.mapFormattedAddress) && (
                            <p className="text-muted-foreground line-clamp-1 text-[0.7rem] leading-snug">
                              {selectedAddress.plusCode && (
                                <span className="text-foreground font-mono">{selectedAddress.plusCode} · </span>
                              )}
                              {selectedAddress.mapFormattedAddress}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select an address</span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent align="start" position="popper" sideOffset={6}>
                    {addresses.map((a) => (
                      <SelectItem
                        key={a.id}
                        value={a.id}
                        textValue={`${a.label} ${formatAddressLines(a)}`}
                        className="py-2.5"
                      >
                        <div className="w-full min-w-0 pr-1 text-left">
                          <p className="text-foreground font-medium leading-tight">
                            {a.label}
                            {a.isDefault && (
                              <span className="text-muted-foreground font-normal"> (default)</span>
                            )}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                            {formatAddressLines(a)}
                          </p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="border-border/70 bg-card rounded-2xl border p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Tag className="text-primary size-4 shrink-0" />
              <h2 className="font-semibold">Savings</h2>
            </div>
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
                  placeholder="Enter promo code (e.g. SAVE20)"
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
            <div className="space-y-2">
              <Label htmlFor="wallet-use">Use wallet balance</Label>
              <Input
                id="wallet-use"
                inputMode="decimal"
                value={walletToUse}
                onChange={(e) => setWalletToUse(e.target.value)}
                placeholder="₹ amount to apply (e.g. 50)"
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

          <div className="border-border/70 bg-card rounded-2xl border p-5 space-y-3">
            <h2 className="font-semibold">Instructions for the shop</h2>
            <textarea
              id="notes"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={300}
              rows={3}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
              placeholder="e.g. Leave at gate, ring doorbell twice, less spicy…"
            />
            <p className="text-muted-foreground text-xs text-right">
              {instructions.length}/300
            </p>
          </div>

          <div className="lg:hidden">
            <Link
              to={ROUTES.cart}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
            >
              Back to cart
            </Link>
          </div>
        </div>

        <div className="mt-6 lg:mt-0 lg:border-border lg:bg-card/30 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:border-l lg:pl-6">
          <div className="border-border/70 bg-card overflow-hidden lg:rounded-2xl lg:border lg:shadow-sm">
            <div className="border-border/50 border-b px-5 py-4">
              <h2 className="font-semibold">Order summary</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {cart.items.reduce((s, i) => s + i.quantity, 0)} item
                {cart.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''} from{' '}
                {cart.vendorName}
              </p>
            </div>

            <ul className="border-border/50 max-h-52 divide-y divide-border/50 overflow-y-auto border-b">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.unit} (incl. of all taxes)
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                    <p className="tabular-nums font-medium">{formatInr(item.total)}</p>
                  </div>
                </li>
              ))}
            </ul>

            {summary && (
              <div className="px-5 py-4 space-y-2.5 text-sm">
                <p className="text-muted-foreground text-xs">Prices are inclusive of all taxes.</p>
                <div className="flex justify-between text-muted-foreground">
                  <span>Items total</span>
                  <span className="tabular-nums text-foreground">{formatInr(summary.itemsTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
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
                  <span
                    className={cn(
                      'tabular-nums text-foreground',
                      summary.platformFee === 0 && 'text-emerald-600 font-medium',
                    )}
                  >
                    {summary.platformFee === 0 ? 'FREE' : formatInr(summary.platformFee)}
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
                  <span>{summary.hasValidatedTotals ? 'Total' : 'Estimated total'}</span>
                  <span className="tabular-nums">
                    {formatInr(
                      summary.hasValidatedTotals ? summary.totalPayable : summary.estimatedTotal,
                    )}
                  </span>
                </div>

                {validationPreviewQuery.isError && (
                  <p className="text-destructive text-xs">
                    {getApiErrorMessage(
                      validationPreviewQuery.error,
                      'We could not confirm totals. Click Continue again or refresh the page.',
                    )}
                  </p>
                )}
                {!summary.hasValidatedTotals &&
                  !validationPreviewQuery.isError &&
                  selectedAddressId && (
                    <p className="text-muted-foreground text-xs">
                      {validationPreviewQuery.isFetching || validationPreviewQuery.isLoading
                        ? 'Calculating final totals…'
                        : 'Final totals will appear in a moment.'}
                    </p>
                  )}
                {!selectedAddressId && (
                  <p className="text-muted-foreground text-xs">Select an address to see final totals.</p>
                )}
              </div>
            )}

            <div className="border-border/50 space-y-2 border-t p-4">
              <Button
                type="button"
                className="w-full gap-2 bg-[#f97316] text-base font-semibold text-white hover:bg-[#ea580c] lg:text-lg"
                size="lg"
                disabled={continueToPayBusy || !selectedAddressId || addresses.length === 0}
                onClick={() => void goToPayment()}
              >
                {continueToPayBusy && <Loader2Icon className="size-4 animate-spin" />}
                {continueToPayBusy ? 'Loading totals…' : 'Continue to payment'}
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
            mapFormattedAddress: values.mapFormattedAddress?.trim() || undefined,
            plusCode: values.plusCode?.trim() || undefined,
            isDefault: addresses.length === 0,
          })
        }}
      />
    </div>
  )
}
