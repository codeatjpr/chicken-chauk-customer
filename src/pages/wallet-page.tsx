import { useQuery } from '@tanstack/react-query'
import { Loader2Icon, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import * as walletApi from '@/services/wallet.service'
import { formatInr } from '@/utils/format'
import { cn } from '@/lib/utils'

const TX_FILTER_OPTS: { key: 'CREDIT' | 'DEBIT' | undefined; label: string }[] = [
  { key: undefined, label: 'All' },
  { key: 'CREDIT', label: 'Credits' },
  { key: 'DEBIT', label: 'Debits' },
]

export function WalletPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState<'CREDIT' | 'DEBIT' | undefined>(undefined)

  const walletQuery = useQuery({
    queryKey: queryKeys.wallet.summary,
    queryFn: () => walletApi.fetchWallet(),
  })

  const txQuery = useQuery({
    queryKey: queryKeys.wallet.transactions(page, type),
    queryFn: () => walletApi.fetchWalletTransactions({ page, limit: 20, type }),
  })

  const w = walletQuery.data
  const paginated = txQuery.data

  return (
    <div className="pb-10 lg:pb-12">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <Wallet className="text-primary size-6 shrink-0" aria-hidden />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Balance and transaction history.</p>
        </div>
      </div>

      {/* Desktop two-column | Mobile single column */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">

        {/* ── LEFT: Balance summary ── */}
        <div className="lg:sticky lg:top-24 space-y-4">
          {walletQuery.isLoading ? (
            <Skeleton className="h-44 rounded-2xl" />
          ) : walletQuery.isError || !w ? (
            <p className="text-destructive text-sm">Could not load wallet.</p>
          ) : (
            <>
              {/* Main balance card */}
              <div className="border-border/70 bg-card rounded-2xl border p-6 space-y-4">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Available balance
                  </p>
                  <p className="mt-2 text-4xl font-semibold tabular-nums">
                    {formatInr(w.balance)}
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="text-emerald-500 size-4" />
                      <p className="text-muted-foreground text-xs font-medium">Total earned</p>
                    </div>
                    <p className="text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatInr(w.totalEarned)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground text-xs font-medium">Total spent</p>
                    </div>
                    <p className="text-base font-semibold tabular-nums">
                      {formatInr(w.totalSpent)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="border-border/70 bg-card rounded-2xl border p-4 space-y-3">
                <p className="text-sm font-semibold">Filter transactions</p>
                <div className="flex gap-2">
                  {TX_FILTER_OPTS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => { setType(opt.key); setPage(1) }}
                      className={cn(
                        'flex-1 rounded-xl border py-2 text-sm font-medium transition-colors',
                        type === opt.key
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 bg-transparent hover:bg-muted/50',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  {paginated
                    ? `${paginated.total} transaction${paginated.total !== 1 ? 's' : ''}`
                    : '—'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Activity / transactions ── */}
        <div className="mt-6 lg:mt-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold lg:text-lg">Activity</h2>
            {type && (
              <button
                type="button"
                onClick={() => { setType(undefined); setPage(1) }}
                className="text-primary text-sm font-medium"
              >
                Clear filter
              </button>
            )}
          </div>

          {txQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : txQuery.isError || !paginated ? (
            <p className="text-destructive text-sm">Could not load activity.</p>
          ) : paginated.items.length === 0 ? (
            <div className="border-border/60 rounded-2xl border border-dashed px-6 py-16 text-center">
              <Wallet className="text-muted-foreground/30 mx-auto mb-3 size-8" />
              <p className="text-muted-foreground text-sm">No transactions yet.</p>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {paginated.items.map((t) => (
                  <li
                    key={t.id}
                    className="border-border/70 bg-card flex items-center gap-4 rounded-2xl border p-4"
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        t.type === 'CREDIT'
                          ? 'bg-emerald-500/10'
                          : 'bg-muted',
                      )}
                    >
                      {t.type === 'CREDIT' ? (
                        <TrendingUp className="text-emerald-600 size-5" />
                      ) : (
                        <TrendingDown className="text-muted-foreground size-5" />
                      )}
                    </div>

                    {/* Description */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium capitalize">
                        {t.reason.replaceAll('_', ' ').toLowerCase()}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(t.createdAt))}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          'text-base font-semibold tabular-nums',
                          t.type === 'CREDIT'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-foreground',
                        )}
                      >
                        {t.type === 'CREDIT' ? '+' : '−'}
                        {formatInr(t.amount)}
                      </p>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        Bal {formatInr(t.balanceAfter)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {paginated.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || txQuery.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground text-xs">
                    Page {page} of {paginated.totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!paginated.hasNext || txQuery.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {txQuery.isFetching ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      'Next'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
