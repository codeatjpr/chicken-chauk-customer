import { useQuery } from '@tanstack/react-query'
import { Bell, Heart, MapPin, Search, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import logoMark from '@/assets/logo.png'
import nameLogo from '@/assets/name_logo.png'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button, buttonVariants } from '@/components/ui/button'
import { LocationPickerDialog } from '@/components/organisms/location-picker-dialog'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import * as notificationsApi from '@/services/notifications.service'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'
import { useLocationStore } from '@/stores/location-store'
import { cn } from '@/lib/utils'

const desktopNav = [
  { to: ROUTES.home, label: 'Home' },
  { to: ROUTES.browse, label: 'All products' },
  { to: ROUTES.search, label: 'Search' },
] as const

export function AppHeader() {
  const location = useLocation()
  const [locOpen, setLocOpen] = useState(false)
  const authed = useAuthStore(selectIsAuthenticated)
  const { city, displayLabel } = useLocationStore()
  const { data: cart } = useCartQuery()
  const cartCount = cart?.totalQuantity ?? 0
  const locationLabel = displayLabel || city

  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () =>
      notificationsApi.fetchNotifications({
        unreadOnly: true,
        page: 1,
        limit: 1,
      }),
    select: (d) => d.total,
    enabled: authed,
  })
  const unreadTotal = authed ? (unreadQuery.data ?? 0) : 0

  const loginState = {
    from: `${location.pathname}${location.search}${location.hash}`,
  }

  return (
    <header className="border-border/80 bg-background/90 supports-backdrop-filter:bg-background/70 sticky top-0 z-20 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-3 px-3 sm:px-4 lg:h-20 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link to={ROUTES.home} className="inline-flex items-center gap-3">
            <img
              src={logoMark}
              alt="Chicken Chauk"
              className="size-10 rounded-2xl object-contain lg:size-11"
            />
            <img
              src={nameLogo}
              alt="Chicken Chauk"
              className="hidden h-8 w-auto object-contain lg:block"
            />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/12 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {authed ? (
              <NavLink
                to={ROUTES.orders}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/12 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                Orders
              </NavLink>
            ) : null}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => setLocOpen(true)}
          className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 hidden max-w-[180px] items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors lg:inline-flex"
          title="Change delivery area"
        >
          <MapPin className="text-primary size-4 shrink-0" aria-hidden />
          <span className="truncate">{locationLabel}</span>
        </button>

        <LocationPickerDialog open={locOpen} onOpenChange={setLocOpen} />

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Delivery area"
            onClick={() => setLocOpen(true)}
          >
            <MapPin className="size-4" />
          </Button>

          <Link
            to={ROUTES.search}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            aria-label="Search products"
          >
            <Search className="size-4" />
          </Link>

          {authed ? (
            <>
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
                  <span className="bg-primary absolute inset-e-1 top-1 size-2 rounded-full" />
                )}
              </Link>
              <Link
                to={ROUTES.favorites}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'hidden lg:inline-flex',
                )}
                aria-label="Favorites"
              >
                <Heart className="size-4" />
              </Link>
            </>
          ) : null}

          {authed ? (
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
                <span className="bg-primary text-primary-foreground absolute -top-0.5 -inset-e-0.5 flex min-w-5 justify-center rounded-full px-1 text-[10px] font-semibold leading-5">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          ) : (
            <Link
              to={ROUTES.login}
              state={loginState}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
              aria-label="Sign in to use cart"
            >
              <ShoppingCart className="size-4" />
            </Link>
          )}

          <Link
            to={`${ROUTES.home}#app-download`}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'hidden lg:inline-flex',
            )}
          >
            Get the app
          </Link>

          <Link
            to={authed ? ROUTES.profile : ROUTES.login}
            state={authed ? undefined : loginState}
            className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}
          >
            {authed ? 'Account' : 'Sign in'}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
