import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Loader2Icon, Package, RotateCcw } from 'lucide-react'
import { EmptyState } from '@/components/molecules/empty-state'
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
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { orderPath, ROUTES, vendorPath } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import { reorderFromOrder } from '@/lib/reorder-from-order'
import * as ordersApi from '@/services/orders.service'
import { formatInr } from '@/utils/format'
import { getApiErrorMessage } from '@/utils/api-error'
import { orderStatusLabel } from '@/utils/order-status'
import {
  canReorderFromListItem,
  canReorderFromOrder,
} from '@/utils/order-reorder'
import { cn } from '@/lib/utils'

export function OrdersPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeOnly, setActiveOnly] = useState(true)
  const [page, setPage] = useState(1)
  const [reorderDialogOrderId, setReorderDialogOrderId] = useState<
    string | null
  >(null)

  const { data: cart } = useCartQuery()

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.list(page, activeOnly),
    queryFn: () =>
      ordersApi.fetchMyOrders({
        page,
        limit: 20,
        activeOnly: activeOnly ? true : undefined,
      }),
  })

  const reorderMut = useMutation({
    mutationFn: async (orderId: string) => {
      const order = await ordersApi.fetchOrderById(orderId)
      if (!canReorderFromOrder(order)) {
        throw new Error('This order cannot be reordered')
      }
      await reorderFromOrder(order, qc)
      return order
    },
    onSuccess: (order) => {
      toast.success('Cart updated — same items as this order')
      setReorderDialogOrderId(null)
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

  const result = ordersQuery.data

  function startReorder(orderId: string) {
    if (cart && cart.totalQuantity > 0) {
      setReorderDialogOrderId(orderId)
    } else {
      reorderMut.mutate(orderId)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Your orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track and manage deliveries.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5">
          <Button
            type="button"
            variant={activeOnly ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 rounded-md px-3 text-xs"
            onClick={() => {
              setActiveOnly(true)
              setPage(1)
            }}
          >
            Active
          </Button>
          <Button
            type="button"
            variant={!activeOnly ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 rounded-md px-3 text-xs"
            onClick={() => {
              setActiveOnly(false)
              setPage(1)
            }}
          >
            All
          </Button>
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : ordersQuery.isError ? (
        <p className="text-destructive text-sm">Could not load orders.</p>
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order, it will show up here. Use Order again on any past order to refill your cart."
        >
          <Link to={ROUTES.home} className={cn(buttonVariants())}>
            Browse vendors
          </Link>
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {result.items.map((o) => (
              <li key={o.id}>
                <div className="border-border/80 bg-card hover:border-primary/30 flex items-stretch gap-0 overflow-hidden rounded-xl border transition-colors">
                  <Link
                    to={orderPath(o.id)}
                    className="hover:bg-muted/40 flex min-w-0 flex-1 items-center gap-3 p-4 transition-colors"
                  >
                    <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                      {o.previewImageUrl || o.vendor.logoUrl ? (
                        <img
                          src={o.previewImageUrl ?? o.vendor.logoUrl ?? undefined}
                          alt=""
                          width={48}
                          height={48}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-lg font-semibold">
                          {o.vendor.name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{o.vendor.name}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {orderStatusLabel(o.status)} · {o._count.items} items
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {formatInr(o.finalAmount)}
                      </p>
                    </div>
                    <ChevronRight
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden
                    />
                  </Link>
                  {canReorderFromListItem(o) && (
                    <div className="border-border/60 flex items-center border-s pe-2 ps-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        disabled={reorderMut.isPending}
                        aria-label="Order again"
                        title="Order again"
                        onClick={(e) => {
                          e.preventDefault()
                          startReorder(o.id)
                        }}
                      >
                        {reorderMut.isPending &&
                        reorderMut.variables === o.id ? (
                          <Loader2Icon
                            className="size-4 animate-spin"
                            aria-hidden
                          />
                        ) : (
                          <RotateCcw className="size-4" aria-hidden />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || !result.hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-xs">
              Page {result.page} of {Math.max(1, result.totalPages)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!result.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <AlertDialog
        open={reorderDialogOrderId !== null}
        onOpenChange={(open) => {
          if (!open) setReorderDialogOrderId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current cart will be cleared and replaced with the items from
              this order. Some items may fail if they are no longer listed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                reorderMut.isPending || reorderDialogOrderId === null
              }
              onClick={(e) => {
                e.preventDefault()
                if (reorderDialogOrderId) {
                  reorderMut.mutate(reorderDialogOrderId)
                }
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
    </div>
  )
}
