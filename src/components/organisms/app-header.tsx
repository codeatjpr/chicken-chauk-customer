import { useQuery } from '@tanstack/react-query'
import { Bell, MapPin, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button, buttonVariants } from '@/components/ui/button'
import { LocationPickerDialog } from '@/components/organisms/location-picker-dialog'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import * as notificationsApi from '@/services/notifications.service'
import { useLocationStore } from '@/stores/location-store'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const [locOpen, setLocOpen] = useState(false)
  const { city } = useLocationStore()
  const { data: cart } = useCartQuery()
  const cartCount = cart?.totalQuantity ?? 0

  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () =>
      notificationsApi.fetchNotifications({
        unreadOnly: true,
        page: 1,
        limit: 1,
      }),
    select: (d) => d.total,
  })
  const unreadTotal = unreadQuery.data ?? 0

  return (
    <header className="border-border/80 bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b px-3 backdrop-blur-md sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to={ROUTES.home}
          className="font-heading text-foreground shrink-0 text-lg font-semibold tracking-tight"
        >
          Chicken Chauk
        </Link>
        <button
          type="button"
          onClick={() => setLocOpen(true)}
          className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 ms-1 hidden max-w-[140px] items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors sm:inline-flex"
          title="Change delivery area"
        >
          <MapPin className="text-primary size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{city}</span>
        </button>
      </div>

      <LocationPickerDialog open={locOpen} onOpenChange={setLocOpen} />

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Delivery area"
          onClick={() => setLocOpen(true)}
        >
          <MapPin className="size-4" />
        </Button>
        <Link
          to={ROUTES.notifications}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'relative',
          )}
          aria-label={`Notifications${unreadTotal ? `, ${unreadTotal} unread` : ''}`}
        >
          <Bell className="size-4" />
          {unreadTotal > 0 && (
            <span className="bg-primary absolute top-1 end-1 size-2 rounded-full" />
          )}
        </Link>
        <Link
          to={ROUTES.cart}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'relative',
          )}
          aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}
        >
          <ShoppingCart className="size-4" />
          {cartCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-0.5 -end-0.5 flex min-w-5 justify-center rounded-full px-1 text-[10px] font-semibold leading-5">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
