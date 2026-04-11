import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Bell } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES } from '@/constants/routes'
import * as notificationsApi from '@/services/notifications.service'
import { getApiErrorMessage } from '@/utils/api-error'
import { cn } from '@/lib/utils'

export function NotificationsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const listQuery = useQuery({
    queryKey: queryKeys.notifications.list(1),
    queryFn: () => notificationsApi.fetchNotifications({ page: 1, limit: 50 }),
  })

  const readMut = useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: queryKeys.notifications.list(1),
      })
      await qc.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      })
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not update notification')),
  })

  const items = listQuery.data?.items ?? []

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
          to={ROUTES.home}
          className="text-muted-foreground text-sm hover:underline"
        >
          Home
        </Link>
      </div>

      <div className="flex items-start gap-3">
        <Bell className="text-primary mt-0.5 size-7 shrink-0" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Updates about your orders and account.
          </p>
        </div>
      </div>

      {listQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : listQuery.isError ? (
        <p className="text-destructive text-sm">Could not load notifications.</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">You are all caught up.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                disabled={readMut.isPending}
                onClick={() => {
                  if (!n.isRead) readMut.mutate(n.id)
                }}
                className={cn(
                  'border-border/80 w-full rounded-xl border p-4 text-start text-sm transition-colors',
                  n.isRead ? 'bg-card' : 'bg-primary/5 border-primary/20',
                )}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {n.body}
                </p>
                <p className="text-muted-foreground mt-2 text-[10px]">
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(n.createdAt))}
                  {!n.isRead && (
                    <span className="text-primary ms-2 font-medium">
                      · Unread
                    </span>
                  )}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
