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
import { OrderDetailView } from '@/components/organisms/order-detail-view'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { orderPath, ROUTES, vendorPath } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import { reorderFromOrder } from '@/lib/reorder-from-order'
import * as ordersApi from '@/services/orders.service'
import { formatInr } from '@/utils/format'
import { getApiErrorMessage } from '@/utils/api-error'
import { orderStatusBadgeClass, orderStatusLabel } from '@/utils/order-status'
import { canReorderFromListItem } from '@/utils/order-reorder'
import { cn } from '@/lib/utils'

export function OrdersPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeOnly, setActiveOnly] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [reorderDialogOrderId, setReorderDialogOrderId] = useState<string | null>(null)

  const { data: cart } = useCartQuery()

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.list(page, activeOnly),
    queryFn: () =>
      ordersApi.fetchMyOrders({ page, limit: 20, activeOnly: activeOnly ? true : undefined }),
  })

  const reorderMut = useMutation({
    mutationFn: async (orderId: string) => {
      const order = await ordersApi.fetchOrderById(orderId)
      await reorderFromOrder(order, qc)
      return order
    },
    onSuccess: (order) => {
      toast.success('Cart updated — same items as this order')
      setReorderDialogOrderId(null)
      navigate(vendorPath(order.vendorId))
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not add items — they may be unavailable now')),
  })

  const result = ordersQuery.data

  function startReorder(orderId: string) {
    if (cart && cart.totalQuantity > 0) {
      setReorderDialogOrderId(orderId)
    } else {
      reorderMut.mutate(orderId)
    }
  }

  const handleOrderClick = (orderId: string) => {
    // On desktop: select inline. On mobile: navigate.
    if (window.innerWidth >= 1024) {
      setSelectedOrderId(orderId)
    } else {
      navigate(orderPath(orderId))
    }
  }

  return (
    <div className="pb-8 lg:pb-12">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track and manage your deliveries.</p>
        </div>
        <div className="flex gap-1 rounded-xl border p-0.5">
          <Button
            type="button"
            variant={activeOnly ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 rounded-lg px-3 text-xs"
            onClick={() => { setActiveOnly(true); setPage(1); setSelectedOrderId(null) }}
          >
            Active
          </Button>
          <Button
            type="button"
            variant={!activeOnly ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 rounded-lg px-3 text-xs"
            onClick={() => { setActiveOnly(false); setPage(1); setSelectedOrderId(null) }}
          >
            All
          </Button>
        </div>
      </div>

      {/* Desktop: master-detail grid | Mobile: list only */}
      <div className="lg:grid lg:grid-cols-[380px_1fr] lg:gap-6 lg:items-start">

        {/* ── LEFT: Orders list ── */}
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-border/70 lg:bg-card">
          {ordersQuery.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : ordersQuery.isError ? (
            <p className="text-destructive p-4 text-sm">Could not load orders.</p>
          ) : !result || result.items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Package}
                title="No orders yet"
                description="When you place an order, it will show up here."
              >
                <Link to={ROUTES.home} className={cn(buttonVariants())}>
                  Browse vendors
                </Link>
              </EmptyState>
            </div>
          ) : (
            <>
              <ul className="divide-border/50 divide-y p-1">
                {result.items.map((o) => (
                  <li key={o.id}>
                    <div
                      className={cn(
                        'flex items-stretch gap-0 overflow-hidden rounded-xl transition-colors',
                        selectedOrderId === o.id
                          ? 'bg-primary/8'
                          : 'hover:bg-muted/50',
                      )}
                    >
                      {/* Main row — navigates on mobile, selects on desktop */}
                      <button
                        type="button"
                        onClick={() => handleOrderClick(o.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left"
                      >
                        <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                          {o.previewImageUrl || o.vendor.logoUrl ? (
                            <img
                              src={o.previewImageUrl ?? o.vendor.logoUrl ?? undefined}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-muted-foreground text-lg font-semibold">
                              {o.vendor.name.slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{o.vendor.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none',
                                orderStatusBadgeClass(o.status),
                              )}
                            >
                              {orderStatusLabel(o.status)}
                            </span>
                            <span className="text-muted-foreground text-xs">{o._count.items} item{o._count.items !== 1 ? 's' : ''}</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {formatInr(o.finalAmount)}
                          </p>
                        </div>
                        <ChevronRight className="text-muted-foreground size-4 shrink-0 lg:hidden" aria-hidden />
                      </button>

                      {/* Reorder quick action */}
                      {canReorderFromListItem(o) && (
                        <div className="border-border/40 flex items-center border-s px-1">
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
                            {reorderMut.isPending && reorderMut.variables === o.id ? (
                              <Loader2Icon className="size-4 animate-spin" aria-hidden />
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

              {/* Pagination */}
              <div className="flex items-center justify-between gap-2 border-t p-3">
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
        </div>

        {/* ── RIGHT: Order detail (desktop only) ── */}
        <div className="hidden lg:block">
          {selectedOrderId ? (
            <div className="rounded-2xl border border-border/70 bg-card p-6">
              <OrderDetailView
                orderId={selectedOrderId}
                onReorderSuccess={(vendorId) => navigate(vendorPath(vendorId))}
                onCancelSuccess={() => {
                  void ordersQuery.refetch()
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-24 text-center">
              <Package className="text-muted-foreground/40 size-10" />
              <p className="text-muted-foreground text-sm">
                Select an order on the left to view its details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reorder dialog */}
      <AlertDialog
        open={reorderDialogOrderId !== null}
        onOpenChange={(open) => { if (!open) setReorderDialogOrderId(null) }}
      >
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
              disabled={reorderMut.isPending || reorderDialogOrderId === null}
              onClick={(e) => {
                e.preventDefault()
                if (reorderDialogOrderId) reorderMut.mutate(reorderDialogOrderId)
              }}
            >
              {reorderMut.isPending && <Loader2Icon className="me-2 size-4 animate-spin" />}
              Replace cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
