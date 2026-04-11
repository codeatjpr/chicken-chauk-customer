import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES } from '@/constants/routes'
import * as walletApi from '@/services/wallet.service'
import { formatInr } from '@/utils/format'
import { cn } from '@/lib/utils'

const TX_FILTER_OPTS: {
  key: 'CREDIT' | 'DEBIT' | undefined
  label: string
}[] = [
  { key: undefined, label: 'All' },
  { key: 'CREDIT', label: 'Credits' },
  { key: 'DEBIT', label: 'Debits' },
]

export function WalletPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [type, setType] = useState<'CREDIT' | 'DEBIT' | undefined>(undefined)

  const walletQuery = useQuery({
    queryKey: queryKeys.wallet.summary,
    queryFn: () => walletApi.fetchWallet(),
  })

  const txQuery = useQuery({
    queryKey: queryKeys.wallet.transactions(page, type),
    queryFn: () =>
      walletApi.fetchWalletTransactions({ page, limit: 15, type }),
  })

  const w = walletQuery.data
  const paginated = txQuery.data

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
          to={ROUTES.profile}
          className="text-muted-foreground text-sm hover:underline"
        >
          Account
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Balance and transaction history.
        </p>
      </div>

      {walletQuery.isLoading ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : walletQuery.isError || !w ? (
        <p className="text-destructive text-sm">Could not load wallet.</p>
      ) : (
        <section className="border-border/80 bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium">
            Available balance
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatInr(w.balance)}
          </p>
          <div className="text-muted-foreground mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-medium text-foreground/80">Total earned</p>
              <p className="tabular-nums">{formatInr(w.totalEarned)}</p>
            </div>
            <div>
              <p className="font-medium text-foreground/80">Total spent</p>
              <p className="tabular-nums">{formatInr(w.totalSpent)}</p>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Activity</h2>
          <div className="flex flex-wrap gap-1.5">
            {TX_FILTER_OPTS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setType(opt.key)
                  setPage(1)
                }}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  type === opt.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/80 bg-card hover:bg-muted/50',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {txQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        ) : txQuery.isError || !paginated ? (
          <p className="text-destructive text-sm">Could not load activity.</p>
        ) : paginated.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions yet.</p>
        ) : (
          <ul className="space-y-2">
            {paginated.items.map((t) => (
              <li
                key={t.id}
                className="border-border/80 flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium capitalize">
                    {t.reason.replaceAll('_', ' ').toLowerCase()}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(t.createdAt))}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p
                    className={cn(
                      'font-semibold tabular-nums',
                      t.type === 'CREDIT' ? 'text-emerald-600' : 'text-foreground',
                    )}
                  >
                    {t.type === 'CREDIT' ? '+' : '−'}
                    {formatInr(t.amount)}
                  </p>
                  <p className="text-muted-foreground text-[10px] tabular-nums">
                    Bal {formatInr(t.balanceAfter)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {paginated && paginated.totalPages > 1 && (
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
      </section>
    </div>
  )
}
