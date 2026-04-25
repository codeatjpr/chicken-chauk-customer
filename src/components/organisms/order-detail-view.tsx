import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon, MapPin, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { orderTrackingPath, vendorPath } from '@/constants/routes'
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

type OrderDetailViewProps = {
  orderId: string
  /** Called after a reorder succeeds so the parent can navigate. */
  onReorderSuccess?: (vendorId: string) => void
  /** Called after cancel succeeds. */
  onCancelSuccess?: () => void
}

export function OrderDetailView({ orderId, onReorderSuccess, onCancelSuccess }: OrderDetailViewProps) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [reorderOpen, setReorderOpen] = useState(false)

  const { data: cart } = useCartQuery()

  const orderQuery = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => ordersApi.fetchOrderById(orderId),
    enabled: Boolean(orderId),
  })

  const o = orderQuery.data

  const reorderMut = useMutation({
    mutationFn: async (order: OrderDetailDto) => {
      await reorderFromOrder(order, qc)
    },
    onSuccess: (_data, order) => {
      toast.success('Cart updated — same items as this order')
      setReorderOpen(false)
      if (onReorderSuccess) {
        onReorderSuccess(order.vendorId)
      } else {
        navigate(vendorPath(order.vendorId))
      }
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not add items — they may be unavailable now')),
  })

  const cancelMut = useMutation({
    mutationFn: (reason: string) => ordersApi.cancelOrder(orderId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
      toast.success('Order cancelled')
      setCancelOpen(false)
      setCancelReason('')
      onCancelSuccess?.()
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not cancel order')),
  })

  if (!orderId) {
    return <p className="text-muted-foreground text-sm p-4">Select an order to view details.</p>
  }

  if (orderQuery.isLoading) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (orderQuery.isError || !o) {
    return <p className="text-destructive text-sm p-4">Order not found.</p>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Order details</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">{formatWhen(o.createdAt)}</p>
        </div>
        <Badge variant="secondary">{orderStatusLabel(o.status)}</Badge>
      </div>

      {/* Restaurant info */}
      <div className="border-border/70 bg-card rounded-2xl border p-4 space-y-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Restaurant</p>
        <Link to={vendorPath(o.vendor.id)} className="font-semibold hover:underline block">
          {o.vendor.name}
        </Link>
        <p className="text-muted-foreground text-xs">
          {o.paymentMethod.replace('_', ' ')} · Payment {o.paymentStatus.toLowerCase()}
        </p>
        {o.delivery &&
          o.delivery.status !== 'DELIVERED' &&
          o.delivery.status !== 'FAILED' && (
            <Link
              to={orderTrackingPath(o.id)}
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'inline-flex gap-1.5')}
            >
              <MapPin className="size-3.5" aria-hidden />
              Live tracking
            </Link>
          )}
      </div>

      {/* Pending payment */}
      {o.paymentMethod !== 'COD' &&
        o.paymentStatus === 'PENDING' &&
        o.status !== 'CANCELLED' &&
        o.status !== 'REFUNDED' && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Complete payment</p>
            <PayOrderButton
              orderId={o.id}
              finalAmountLabel={formatInr(o.finalAmount)}
              onPaid={() => {
                void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
                void qc.invalidateQueries({ queryKey: queryKeys.orders.prefix })
              }}
            />
          </div>
        )}

      {/* Items */}
      <div>
        <p className="mb-3 text-sm font-semibold">Items ({o.items.length})</p>
        <ul className="space-y-2">
          {o.items.map((item) => (
            <li
              key={item.id}
              className="border-border/70 bg-card flex items-center gap-3 rounded-xl border p-3 text-sm"
            >
              <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-xs font-semibold">
                    {item.productName.slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.productName}</p>
                <p className="text-muted-foreground text-xs">
                  ×{item.quantity} {item.unit} · (incl. of all taxes)
                </p>
              </div>
              <span className="shrink-0 tabular-nums font-medium">{formatInr(item.total)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Price breakdown */}
      <div className="border-border/70 bg-card rounded-2xl border p-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Items</span>
          <span className="tabular-nums text-foreground">{formatInr(o.itemsTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span
            className={cn(
              'tabular-nums text-foreground',
              o.deliveryFee === 0 && 'text-emerald-600 dark:text-emerald-400 font-medium',
            )}
          >
            {o.deliveryFee === 0 ? 'FREE' : formatInr(o.deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Platform fee</span>
          <span
            className={cn(
              'tabular-nums text-foreground',
              o.platformFee === 0 && 'text-emerald-600 dark:text-emerald-400 font-medium',
            )}
          >
            {o.platformFee === 0 ? 'FREE' : formatInr(o.platformFee)}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          Item prices are inclusive of all taxes. No extra GST.
        </p>
        {o.discount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Discount</span>
            <span className="tabular-nums">−{formatInr(o.discount)}</span>
          </div>
        )}
        {o.walletAmountUsed > 0 && (
          <div className="flex justify-between">
            <span>Wallet</span>
            <span className="tabular-nums text-foreground">−{formatInr(o.walletAmountUsed)}</span>
          </div>
        )}
        <Separator className="my-1" />
        <div className="flex justify-between text-base font-semibold text-foreground">
          <span>Total paid</span>
          <span className="tabular-nums">{formatInr(o.finalAmount)}</span>
        </div>
      </div>

      {/* Delivery address */}
      {o.deliveryAddress && (
        <div>
          <p className="mb-2 text-sm font-semibold">Deliver to</p>
          <div className="border-border/70 rounded-xl border p-3 text-sm text-muted-foreground">
            <p className="text-foreground font-medium">{o.deliveryAddress.label}</p>
            <p className="mt-1">
              {o.deliveryAddress.addressLine1}
              {o.deliveryAddress.addressLine2 ? `, ${o.deliveryAddress.addressLine2}` : ''}
            </p>
            <p>
              {o.deliveryAddress.city}, {o.deliveryAddress.state} {o.deliveryAddress.pincode}
            </p>
            {(o.deliveryAddress.mapFormattedAddress || o.deliveryAddress.plusCode) && (
              <div className="border-border/50 mt-2 border-t border-dotted pt-2">
                <p className="text-muted-foreground text-xs font-medium">Map / pin location</p>
                {o.deliveryAddress.plusCode ? (
                  <p className="text-foreground mt-0.5 font-mono text-xs">
                    {o.deliveryAddress.plusCode}
                  </p>
                ) : null}
                {o.deliveryAddress.mapFormattedAddress ? (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                    {o.deliveryAddress.mapFormattedAddress}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Special instructions */}
      {o.specialInstructions && (
        <div>
          <p className="mb-1 text-sm font-semibold">Your note</p>
          <p className="text-muted-foreground text-sm">{o.specialInstructions}</p>
        </div>
      )}

      {/* Timeline */}
      {o.statusLogs.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Timeline</p>
          <ol className="border-border/60 space-y-2 border-s-2 ps-4 text-sm">
            {o.statusLogs.map((log, idx) => (
              <li key={`${log.timestamp}-${idx}`} className="relative">
                <span className="bg-background absolute top-1.5 -inset-s-[21px] size-2 rounded-full ring-2 ring-current" />
                <p className="font-medium">{orderStatusLabel(log.status)}</p>
                <p className="text-muted-foreground text-xs">
                  {formatWhen(log.timestamp)}
                  {log.note ? ` · ${log.note}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Rating */}
      <OrderRatingSection
        orderId={o.id}
        vendorId={o.vendorId}
        hasRider={Boolean(o.delivery?.rider)}
        enabled={o.status === 'DELIVERED'}
      />

      {/* Actions */}
      <div className="space-y-2">
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
      </div>

      {/* Reorder dialog */}
      <AlertDialog open={reorderOpen} onOpenChange={setReorderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current cart will be cleared and replaced with the items from this order.
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
              {reorderMut.isPending && <Loader2Icon className="me-2 size-4 animate-spin" />}
              Replace cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone if the shop has not started preparing your food.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Why you're cancelling (optional, min. 3 characters if filled)"
            rows={3}
            maxLength={300}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              disabled={cancelMut.isPending || (cancelReason.trim().length > 0 && cancelReason.trim().length < 3)}
              onClick={(e) => {
                e.preventDefault()
                const trimmed = cancelReason.trim()
                if (trimmed.length > 0 && trimmed.length < 3) {
                  toast.error('Reason must be at least 3 characters')
                  return
                }
                cancelMut.mutate(trimmed.length >= 3 ? trimmed : 'Cancelled by customer')
              }}
            >
              {cancelMut.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
