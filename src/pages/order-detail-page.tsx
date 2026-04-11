import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2Icon, MapPin, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { OrderRatingSection } from '@/components/organisms/order-rating-section'
import { PayOrderButton } from '@/components/organisms/pay-order-button'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { orderTrackingPath, ROUTES, vendorPath } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import { reorderFromOrder } from '@/lib/reorder-from-order'
import * as ordersApi from '@/services/orders.service'
import type { OrderDetailDto } from '@/types/order'
import { formatInr } from '@/utils/format'
import { getApiErrorMessage } from '@/utils/api-error'
import { cn } from '@/lib/utils'
import { customerCanCancel, orderStatusLabel } from '@/utils/order-status'
import { canReorderFromOrder } from '@/utils/order-reorder'

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [reorderOpen, setReorderOpen] = useState(false)

  const { data: cart } = useCartQuery()

  const orderQuery = useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.fetchOrderById(id),
    enabled: Boolean(id),
  })

  const o = orderQuery.data

  const reorderMut = useMutation({
    mutationFn: async (order: OrderDetailDto) => {
      await reorderFromOrder(order, qc)
    },
    onSuccess: (_data, order) => {
      toast.success('Cart updated — same items as this order')
      setReorderOpen(false)
      navigate(vendorPath(order.vendorId))
    },
    onError: (e) =>
      toast.error(
        getApiErrorMessage(
          e,
          'Could not add items — they may be unavailable now',
        ),
      ),
  })

  const cancelMut = useMutation({
    mutationFn: (reason: string) => ordersApi.cancelOrder(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(id) })
      toast.success('Order cancelled')
      setCancelOpen(false)
      setCancelReason('')
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not cancel order')),
  })

  if (!id) {
    return (
      <p className="text-muted-foreground text-sm">Invalid order link.</p>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Link
          to={ROUTES.orders}
          className="text-muted-foreground text-sm hover:underline"
        >
          All orders
        </Link>
      </div>

      {orderQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : orderQuery.isError || !o ? (
        <p className="text-destructive text-sm">Order not found.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Order details
              </h1>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatWhen(o.createdAt)}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {orderStatusLabel(o.status)}
            </Badge>
          </div>

          <section className="border-border/80 bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-xs font-medium">
              Restaurant
            </p>
            <Link
              to={vendorPath(o.vendor.id)}
              className="mt-1 font-semibold hover:underline"
            >
              {o.vendor.name}
            </Link>
            <p className="text-muted-foreground mt-2 text-xs">
              {o.paymentMethod.replace('_', ' ')} · Payment{' '}
              {o.paymentStatus.toLowerCase()}
            </p>
            {o.delivery &&
              o.delivery.status !== 'DELIVERED' &&
              o.delivery.status !== 'FAILED' && (
                <Link
                  to={orderTrackingPath(o.id)}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    'mt-3 inline-flex gap-1.5',
                  )}
                >
                  <MapPin className="size-3.5" aria-hidden />
                  Live tracking
                </Link>
              )}
          </section>

          {o.paymentMethod !== 'COD' &&
            o.paymentStatus === 'PENDING' &&
            o.status !== 'CANCELLED' &&
            o.status !== 'REFUNDED' && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold tracking-tight">
                  Complete payment
                </h2>
                <p className="text-muted-foreground text-xs">
                  Pay online to confirm with Razorpay. COD orders skip this step.
                </p>
                <PayOrderButton
                  orderId={o.id}
                  finalAmountLabel={formatInr(o.finalAmount)}
                  onPaid={() => {
                    void qc.invalidateQueries({
                      queryKey: queryKeys.orders.detail(id),
                    })
                    void qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
                  }}
                />
              </section>
            )}

          {o.deliveryAddress && (
            <section>
              <h2 className="mb-2 text-sm font-semibold tracking-tight">
                Deliver to
              </h2>
              <div className="border-border/80 text-muted-foreground rounded-xl border p-3 text-sm">
                <p className="text-foreground font-medium">
                  {o.deliveryAddress.label}
                </p>
                <p className="mt-1">
                  {o.deliveryAddress.addressLine1}
                  {o.deliveryAddress.addressLine2
                    ? `, ${o.deliveryAddress.addressLine2}`
                    : ''}
                </p>
                <p>
                  {o.deliveryAddress.city}, {o.deliveryAddress.state}{' '}
                  {o.deliveryAddress.pincode}
                </p>
              </div>
            </section>
          )}

          {o.specialInstructions && (
            <section>
              <h2 className="mb-2 text-sm font-semibold tracking-tight">
                Your note
              </h2>
              <p className="text-muted-foreground text-sm">
                {o.specialInstructions}
              </p>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-tight">
              Items
            </h2>
            <ul className="space-y-2">
              {o.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-2 text-sm"
                >
                  <span>
                    {item.productName}{' '}
                    <span className="text-muted-foreground">
                      ×{item.quantity} {item.unit}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatInr(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          <div className="text-muted-foreground space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>Items</span>
              <span className="tabular-nums text-foreground">
                {formatInr(o.itemsTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="tabular-nums text-foreground">
                {formatInr(o.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee</span>
              <span className="tabular-nums text-foreground">
                {formatInr(o.platformFee)}
              </span>
            </div>
            {o.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="tabular-nums text-foreground">
                  {formatInr(o.taxAmount)}
                </span>
              </div>
            )}
            {o.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span className="tabular-nums">−{formatInr(o.discount)}</span>
              </div>
            )}
            {o.walletAmountUsed > 0 && (
              <div className="flex justify-between">
                <span>Wallet</span>
                <span className="tabular-nums text-foreground">
                  −{formatInr(o.walletAmountUsed)}
                </span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="text-foreground flex justify-between text-base font-semibold">
              <span>Total paid</span>
              <span className="tabular-nums">{formatInr(o.finalAmount)}</span>
            </div>
          </div>

          {o.statusLogs.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold tracking-tight">
                Timeline
              </h2>
              <ol className="border-border/60 space-y-2 border-s-2 ps-4 text-sm">
                {o.statusLogs.map((log, idx) => (
                  <li key={`${log.timestamp}-${idx}`} className="relative">
                    <span className="bg-background absolute -start-[21px] top-1.5 size-2 rounded-full ring-2 ring-current" />
                    <p className="font-medium">{orderStatusLabel(log.status)}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatWhen(log.timestamp)}
                      {log.note ? ` · ${log.note}` : ''}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {canReorderFromOrder(o) && (
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2"
              disabled={reorderMut.isPending}
              onClick={() => {
                if (cart && cart.totalQuantity > 0) setReorderOpen(true)
                else reorderMut.mutate(o)
              }}
            >
              {reorderMut.isPending ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : (
                <RotateCcw className="size-4" aria-hidden />
              )}
              Order again
            </Button>
          )}

          {customerCanCancel(o.status) && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/10 w-full"
              onClick={() => setCancelOpen(true)}
            >
              Cancel order
            </Button>
          )}

          <OrderRatingSection
            orderId={o.id}
            vendorId={o.vendorId}
            hasRider={Boolean(o.delivery?.rider)}
            enabled={o.status === 'DELIVERED'}
          />
        </>
      )}

      <AlertDialog open={reorderOpen} onOpenChange={setReorderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current cart will be cleared and replaced with the items
              from this order. Some items may fail if they are no longer
              listed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={reorderMut.isPending || !o}
              onClick={(e) => {
                e.preventDefault()
                if (o) reorderMut.mutate(o)
              }}
            >
              {reorderMut.isPending && (
                <Loader2Icon className="me-2 size-4 animate-spin" />
              )}
              Replace cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone if the vendor has not started preparing
              your food.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={3}
            maxLength={300}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              disabled={
                cancelMut.isPending ||
                (cancelReason.trim().length > 0 &&
                  cancelReason.trim().length < 3)
              }
              onClick={(e) => {
                e.preventDefault()
                const trimmed = cancelReason.trim()
                if (trimmed.length > 0 && trimmed.length < 3) {
                  toast.error('Reason must be at least 3 characters')
                  return
                }
                const reason =
                  trimmed.length >= 3 ? trimmed : 'Cancelled by customer'
                cancelMut.mutate(reason)
              }}
            >
              {cancelMut.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
