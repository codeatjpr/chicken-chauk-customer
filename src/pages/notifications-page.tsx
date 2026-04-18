import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import * as notificationsApi from '@/services/notifications.service'
import { getApiErrorMessage } from '@/utils/api-error'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'unread'

export function NotificationsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')

  const listQuery = useQuery({
    queryKey: queryKeys.notifications.list(1),
    queryFn: () => notificationsApi.fetchNotifications({ page: 1, limit: 50 }),
  })

  const readMut = useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.notifications.list(1) })
      await qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount })
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update notification')),
  })

  const allItems = listQuery.data?.items ?? []
  const unreadItems = allItems.filter((n) => !n.isRead)
  const displayItems = filter === 'unread' ? unreadItems : allItems
  const unreadCount = unreadItems.length

  return (
    <div className="pb-10 lg:pb-12">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Bell className="text-primary size-5 shrink-0 lg:size-6" aria-hidden />
          <div>
            <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">Notifications</h1>
            <p className="text-muted-foreground mt-0.5 text-xs lg:text-sm">
              Updates about your orders and account.
            </p>
          </div>
        </div>

        {/* Mobile: Mark all read button inline with header */}
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1.5 text-xs lg:hidden"
            disabled={readMut.isPending}
            onClick={() => unreadItems.forEach((n) => readMut.mutate(n.id))}
          >
            <CheckCheck className="size-3.5" />
            Mark read
          </Button>
        )}
      </div>

      {/* ── Mobile: Compact filter pills + summary ── */}
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        {([
          { id: 'all' as const, label: 'All', count: allItems.length },
          { id: 'unread' as const, label: 'Unread', count: unreadCount },
        ] as const).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:bg-muted/60',
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span
                className={cn(
                  'flex size-4 items-center justify-center rounded-full text-[10px] font-bold leading-none',
                  filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {f.count > 9 ? '9+' : f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Desktop two-column | Mobile single column */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:items-start">

        {/* ── LEFT: Desktop filter panel (hidden on mobile) ── */}
        <div className="hidden lg:block lg:sticky lg:top-24">
          <div className="border-border/70 bg-card rounded-2xl border overflow-hidden">
            <div className="border-border/50 border-b px-5 py-4">
              <h2 className="font-semibold">Filter</h2>
            </div>
            <div className="p-2 space-y-0.5">
              {([
                { id: 'all' as const, label: 'All notifications', count: allItems.length },
                { id: 'unread' as const, label: 'Unread', count: unreadCount },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    filter === f.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <span>{f.label}</span>
                  {f.count > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        filter === f.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <div className="border-border/50 border-t p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  disabled={readMut.isPending}
                  onClick={() => unreadItems.forEach((n) => readMut.mutate(n.id))}
                >
                  <CheckCheck className="size-3.5" />
                  Mark all as read
                </Button>
              </div>
            )}
          </div>

          {/* Desktop summary stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="border-border/70 bg-card rounded-xl border p-3 text-center">
              <p className="text-2xl font-semibold tabular-nums">{allItems.length}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">Total</p>
            </div>
            <div className="border-border/70 bg-card rounded-xl border p-3 text-center">
              <p className={cn('text-2xl font-semibold tabular-nums', unreadCount > 0 && 'text-primary')}>
                {unreadCount}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">Unread</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT / Mobile: Notifications list ── */}
        <div>
          <div className="mb-3 hidden items-center justify-between lg:flex">
            <h2 className="font-semibold lg:text-lg">
              {filter === 'unread' ? 'Unread' : 'All notifications'}
            </h2>
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : listQuery.isError ? (
            <p className="text-destructive text-sm">Could not load notifications.</p>
          ) : displayItems.length === 0 ? (
            <div className="border-border/60 rounded-2xl border border-dashed px-6 py-14 text-center">
              <Bell className="text-muted-foreground/30 mx-auto mb-3 size-7" />
              <p className="text-muted-foreground text-sm">
                {filter === 'unread' ? "You're all caught up!" : 'No notifications yet.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {displayItems.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    disabled={readMut.isPending}
                    onClick={() => { if (!n.isRead) readMut.mutate(n.id) }}
                    className={cn(
                      'w-full rounded-2xl border p-4 text-start transition-colors',
                      n.isRead
                        ? 'border-border/60 bg-card hover:bg-muted/40'
                        : 'border-primary/25 bg-primary/5 hover:bg-primary/8',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Title — larger, bolded, coloured for unread */}
                      <p
                        className={cn(
                          'text-sm font-bold leading-snug',
                          n.isRead ? 'text-foreground' : 'text-primary',
                        )}
                      >
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="bg-primary mt-1 size-2 shrink-0 rounded-full" />
                      )}
                    </div>

                    {/* Body */}
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {n.body}
                    </p>

                    {/* Footer */}
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-muted-foreground text-[11px]">
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(n.createdAt))}
                      </p>
                      {!n.isRead && (
                        <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none">
                          Unread
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
