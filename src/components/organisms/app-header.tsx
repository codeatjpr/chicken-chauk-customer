import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  ChevronDown,
  Heart,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingCart,
  User,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import logoMark from '@/assets/logo.png'
import nameLogo from '@/assets/name_logo.png'
import { LocationPickerDialog } from '@/components/organisms/location-picker-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import * as notificationsApi from '@/services/notifications.service'
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth-store'
import { useLocationStore } from '@/stores/location-store'
import { splitLocationDisplay } from '@/lib/location-label'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const navigate = useNavigate()
  const [locOpen, setLocOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const authed = useAuthStore(selectIsAuthenticated)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const { displayLabel, city } = useLocationStore()
  const { data: cart } = useCartQuery()
  const cartCount = cart?.totalQuantity ?? 0
  const rawLocation = displayLabel || city || 'Select area'
  const { primary: locPrimary, secondary: locSecondary } = splitLocationDisplay(rawLocation)

  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationsApi.fetchNotifications({ unreadOnly: true, page: 1, limit: 1 }),
    select: (d) => d.total,
    enabled: authed,
  })
  const unreadTotal = authed ? (unreadQuery.data ?? 0) : 0

  const runSearch = () => {
    const q = searchValue.trim()
    navigate(q ? `${ROUTES.search}?q=${encodeURIComponent(q)}` : ROUTES.search)
    setSearchValue('')
    searchRef.current?.blur()
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate(ROUTES.home)
  }

  return (
    <header className="border-border/60 bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 lg:h-[68px] lg:gap-4 lg:px-6">

        {/* ── Logo ── */}
        <Link to={ROUTES.home} className="flex shrink-0 items-center gap-2.5">
          <img
            src={logoMark}
            alt="Chicken Chauk"
            className="size-9 rounded-xl object-contain lg:size-10"
          />
          <img
            src={nameLogo}
            alt="Chicken Chauk"
            className="hidden h-7 w-auto object-contain lg:block"
          />
        </Link>

        {/* ── Mobile: Location pill (takes remaining center space) ── */}
        <button
          type="button"
          onClick={() => setLocOpen(true)}
          className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-muted lg:hidden"
          aria-label="Change delivery area"
        >
          <span className="flex min-w-0 flex-col text-left leading-tight">
            <span className="truncate font-semibold">{locPrimary}</span>
            {locSecondary ? (
              <span className="text-muted-foreground truncate text-[11px]">{locSecondary}</span>
            ) : null}
          </span>
          <ChevronDown className="text-muted-foreground size-3 shrink-0" />
        </button>

        {/* ── Desktop: Location + Search (center) ── */}
        <div className="hidden flex-1 items-center gap-2 lg:flex">
          {/* Location pill — shows full address */}
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className="group border-border/60 hover:border-primary/40 hover:bg-primary/5 flex shrink-0 items-center gap-1.5 rounded-xl border bg-transparent px-3 py-2 text-sm transition-colors"
            title="Change delivery area"
          >
            <span className="flex max-w-[min(280px,36vw)] min-w-0 flex-col text-left leading-tight">
              <span className="truncate font-semibold">{locPrimary}</span>
              {locSecondary ? (
                <span className="text-muted-foreground truncate text-xs">{locSecondary}</span>
              ) : null}
            </span>
            <ChevronDown className="text-muted-foreground size-3.5 shrink-0 transition-transform group-hover:translate-y-px" />
          </button>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2 pointer-events-none"
              aria-hidden
            />
            <input
              ref={searchRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch() }}
              onFocus={() => { if (!searchValue) navigate(ROUTES.search) }}
              placeholder="Search for chicken, mutton, seafood, eggs…"
              className="border-border/60 bg-muted/50 placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background h-10 w-full rounded-xl border pl-10 pr-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* ── Desktop: Right actions ── */}
        <div className="hidden items-center gap-1 lg:flex">
          {/* Nav links */}
          <NavLink
            to={ROUTES.home}
            className={({ isActive }) =>
              cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            Home
          </NavLink>
          <NavLink
            to={ROUTES.browse}
            className={({ isActive }) =>
              cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            Products
          </NavLink>

          <div className="bg-border/60 mx-1 h-5 w-px" />

          {/* Notifications */}
          <Link
            to={ROUTES.notifications}
            className="relative flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
            aria-label={`Notifications${unreadTotal ? `, ${unreadTotal} unread` : ''}`}
          >
            <Bell className="size-[18px]" />
            {unreadTotal > 0 && (
              <span className="bg-primary absolute right-1.5 top-1.5 size-2 rounded-full" />
            )}
          </Link>

          {/* Favorites */}
          <Link
            to={ROUTES.favorites}
            className="flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
            aria-label="Favorites"
          >
            <Heart className="size-[18px]" />
          </Link>

          {/* Cart */}
          <Link
            to={ROUTES.cart}
            className="relative flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
            aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}
          >
            <ShoppingCart className="size-[18px]" />
            {cartCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-[18px]">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Account dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                type="button"
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  authed
                    ? 'bg-primary/8 text-primary hover:bg-primary/15'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
              >
                <User className="size-4" />
                {authed ? (user?.name ?? 'Account') : 'Sign in'}
                <ChevronDown className="size-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {authed ? (
                <>
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="font-semibold text-foreground text-sm">
                      {user?.name ?? 'My Account'}
                    </p>
                    {user?.phone && (
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">+91 {user.phone}</p>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.profile)}>
                      <User className="size-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.orders)}>
                      <Package className="size-4" />
                      Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.cart)}>
                      <ShoppingCart className="size-4" />
                      Cart
                      {cartCount > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                          {cartCount}
                        </span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.notifications)}>
                      <Bell className="size-4" />
                      Alerts
                      {unreadTotal > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                          {unreadTotal}
                        </span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.favorites)}>
                      <Heart className="size-4" />
                      Saved
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.wallet)}>
                      <Settings className="size-4" />
                      Wallet
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate(ROUTES.login)}>
                    <User className="size-4" />
                    Sign in
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Mobile: Right actions (cart + profile live in bottom dock) ── */}
        <div className="flex items-center gap-0.5 lg:hidden">
          <Link
            to={ROUTES.notifications}
            className="relative flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
            aria-label={`Notifications${unreadTotal ? `, ${unreadTotal} unread` : ''}`}
          >
            <Bell className="size-[18px]" />
            {unreadTotal > 0 && (
              <span className="bg-primary absolute right-1.5 top-1.5 size-2 rounded-full" />
            )}
          </Link>

          <Link
            to={ROUTES.favorites}
            className="flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
            aria-label="Favorites"
          >
            <Heart className="size-[18px]" />
          </Link>
        </div>
      </div>

      <LocationPickerDialog open={locOpen} onOpenChange={setLocOpen} />
    </header>
  )
}
