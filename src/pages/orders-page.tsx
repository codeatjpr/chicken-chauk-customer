import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Package } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { orderPath, ROUTES } from '@/constants/routes'
import * as ordersApi from '@/services/orders.service'
import { formatInr } from '@/utils/format'
import { orderStatusLabel } from '@/utils/order-status'
import { cn } from '@/lib/utils'

export function OrdersPage() {
  const [activeOnly, setActiveOnly] = useState(true)
  const [page, setPage] = useState(1)

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.list(page, activeOnly),
    queryFn: () =>
      ordersApi.fetchMyOrders({
        page,
        limit: 20,
        activeOnly: activeOnly ? true : undefined,
      }),
  })

  const result = ordersQuery.data

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
        <div className="border-border/60 flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
          <Package className="text-muted-foreground mb-3 size-10" />
          <p className="text-muted-foreground text-sm">No orders yet.</p>
          <Link
            to={ROUTES.home}
            className={cn(buttonVariants(), 'mt-4 inline-flex')}
          >
            Browse vendors
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {result.items.map((o) => (
              <li key={o.id}>
                <Link
                  to={orderPath(o.id)}
                  className="border-border/80 bg-card hover:border-primary/30 flex items-center gap-3 rounded-xl border p-4 transition-colors"
                >
                  <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    {o.vendor.logoUrl ? (
                      <img
                        src={o.vendor.logoUrl}
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
                    <p className="font-medium">{o.vendor.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {orderStatusLabel(o.status)} · {o._count.items} items
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {formatInr(o.finalAmount)}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
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
    </div>
  )
}
