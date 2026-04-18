import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  ChevronRight,
  Heart,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoginFlow } from '@/components/molecules/login-flow'
import { CartPanel } from '@/components/organisms/cart-panel'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { queryKeys } from '@/constants/query-keys'
import { orderPath, ROUTES } from '@/constants/routes'
import { useCartQuery } from '@/hooks/use-cart'
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth-store'
import { useUiStore, type PanelTab } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import * as ordersApi from '@/services/orders.service'
import * as notificationsApi from '@/services/notifications.service'
import type { OrderListItemDto } from '@/types/order'
import { formatInr } from '@/utils/format'

const TABS = [
  { id: 'cart' as PanelTab, label: 'Cart', icon: ShoppingCart, authRequired: false },
  { id: 'orders' as PanelTab, label: 'Orders', icon: Package, authRequired: true },
  { id: 'notifications' as PanelTab, label: 'Alerts', icon: Bell, authRequired: true },
  { id: 'favorites' as PanelTab, label: 'Saved', icon: Heart, authRequired: true },
  { id: 'account' as PanelTab, label: 'Account', icon: User, authRequired: true },
]

export function DesktopRightPanel() {
  const { panelOpen, panelTab, openPanel, closePanel } = useUiStore()
  const authed = useAuthStore(selectIsAuthenticated)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  const { data: cart, isLoading: cartLoading } = useCartQuery()

  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationsApi.fetchNotifications({ unreadOnly: true, page: 1, limit: 1 }),
    select: (d) => d.total,
    enabled: authed && panelOpen,
  })
  const unreadCount = authed ? (unreadQuery.data ?? 0) : 0

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.list(1, false),
    queryFn: () => ordersApi.fetchMyOrders({ page: 1, limit: 5 }),
    enabled: authed && panelOpen && panelTab === 'orders',
  })

  const handleSignOut = async () => {
    await signOut()
    closePanel()
    toast.success('Signed out')
  }

  const goTo = (path: string) => {
    closePanel()
    navigate(path)
  }

  const needsLogin = TABS.find((t) => t.id === panelTab)?.authRequired && !authed

  if (!panelOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] hidden lg:block"
        onClick={closePanel}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 z-50 hidden h-full w-[400px] flex-col bg-background shadow-2xl ring-1 ring-border/20 lg:flex"
        aria-label="Side panel"
      >
        {/* Tab bar */}
        <div className="flex h-14 shrink-0 items-center border-b px-2 gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => openPanel(tab.id)}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors',
                panelTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className="bg-primary absolute right-2 top-1.5 size-1.5 rounded-full" />
              )}
              {tab.id === 'cart' && (cart?.totalQuantity ?? 0) > 0 && (
                <span className="bg-primary text-primary-foreground absolute -right-0.5 top-0.5 min-w-4 rounded-full px-1 text-[9px] leading-4">
                  {(cart?.totalQuantity ?? 0) > 99 ? '99+' : cart?.totalQuantity}
                </span>
              )}
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={closePanel}
            className="size-8 shrink-0 rounded-full ml-1"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {needsLogin ? (
            <div className="space-y-6 p-6">
              <div>
                <h2 className="font-heading text-lg font-semibold">Sign in to continue</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {panelTab === 'cart'
                    ? 'Sign in to view your cart and checkout.'
                    : `Sign in to access your ${panelTab}.`}
                </p>
              </div>
              <LoginFlow onSuccess={() => openPanel(panelTab)} />
            </div>
          ) : panelTab === 'cart' ? (
            <CartTabContent cart={cart} cartLoading={cartLoading} authed={authed} />
          ) : panelTab === 'orders' ? (
            <OrdersTabContent orders={ordersQuery.data?.items} isLoading={ordersQuery.isLoading} onGoTo={goTo} />
          ) : panelTab === 'notifications' ? (
            <NotificationsTabContent unreadCount={unreadCount} onGoTo={goTo} />
          ) : panelTab === 'favorites' ? (
            <FavoritesTabContent onGoTo={goTo} />
          ) : panelTab === 'account' ? (
            <AccountTabContent user={user} onGoTo={goTo} onSignOut={handleSignOut} />
          ) : null}
        </div>
      </aside>
    </>
  )
}

// ---------- Tab Content Components ----------

function CartTabContent({
  cart,
  cartLoading,
  authed,
}: {
  cart: ReturnType<typeof useCartQuery>['data']
  cartLoading: boolean
  authed: boolean
}) {
  if (!authed) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h2 className="font-heading text-lg font-semibold">Your cart</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in to add items and checkout.
          </p>
        </div>
        <LoginFlow onSuccess={() => {}} />
      </div>
    )
  }

  return (
    <div className="p-4">
      <CartPanel cart={cart} isLoading={cartLoading} />
    </div>
  )
}

function OrdersTabContent({
  orders,
  isLoading,
  onGoTo,
}: {
  orders?: OrderListItemDto[]
  isLoading: boolean
  onGoTo: (path: string) => void
}) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Recent orders</h2>
        <button
          type="button"
          onClick={() => onGoTo(ROUTES.orders)}
          className="text-primary text-sm font-medium"
        >
          View all
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-16 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !orders?.length ? (
        <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-10 text-center text-sm">
          No orders yet. Start shopping to see your orders here.
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => onGoTo(orderPath(order.id))}
                className="hover:bg-muted/60 flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{order.vendor.name}</p>
                  <p className="text-muted-foreground text-xs capitalize">{order.status.toLowerCase().replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatInr(order.finalAmount)}
                  </span>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" className="w-full" onClick={() => onGoTo(ROUTES.orders)}>
        All orders
      </Button>
    </div>
  )
}

function NotificationsTabContent({
  unreadCount,
  onGoTo,
}: {
  unreadCount: number
  onGoTo: (path: string) => void
}) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Notifications</h2>
        {unreadCount > 0 && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
            {unreadCount} unread
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-sm">
        Order updates, deals, and account alerts appear here.
      </p>
      <Button variant="outline" className="w-full" onClick={() => onGoTo(ROUTES.notifications)}>
        View all notifications
      </Button>
    </div>
  )
}

function FavoritesTabContent({ onGoTo }: { onGoTo: (path: string) => void }) {
  return (
    <div className="space-y-4 p-4">
      <h2 className="font-semibold">Saved</h2>
      <p className="text-muted-foreground text-sm">
        Products and vendors you've saved appear here for quick access.
      </p>
      <Button variant="outline" className="w-full" onClick={() => onGoTo(ROUTES.favorites)}>
        View favorites
      </Button>
    </div>
  )
}

function AccountTabContent({
  user,
  onGoTo,
  onSignOut,
}: {
  user: { name?: string | null; phone?: string | null; displayName?: string | null } | null
  onGoTo: (path: string) => void
  onSignOut: () => void
}) {
  const displayName = user?.displayName ?? user?.name ?? 'My Account'
  const phone = user?.phone

  return (
    <div className="space-y-4 p-4">
      {/* Profile summary */}
      <div className="bg-muted/50 flex items-center gap-3 rounded-2xl p-4">
        <div className="bg-primary/15 flex size-12 shrink-0 items-center justify-center rounded-full">
          <User className="text-primary size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{displayName}</p>
          {phone && <p className="text-muted-foreground truncate text-sm">+91 {phone}</p>}
        </div>
      </div>

      <Separator />

      {/* Quick links */}
      <nav className="space-y-1">
        {[
          { label: 'My Profile', icon: User, path: ROUTES.profile },
          { label: 'My Orders', icon: Package, path: ROUTES.orders },
          { label: 'Saved addresses', icon: Settings, path: ROUTES.profileAddresses },
          { label: 'Wallet', icon: Settings, path: ROUTES.wallet },
        ].map((link) => (
          <button
            key={link.path}
            type="button"
            onClick={() => onGoTo(link.path)}
            className="hover:bg-muted/60 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors"
          >
            <link.icon className="text-muted-foreground size-4 shrink-0" />
            {link.label}
            <ChevronRight className="text-muted-foreground ml-auto size-4 shrink-0" />
          </button>
        ))}
      </nav>

      <Separator />

      <Button
        type="button"
        variant="ghost"
        onClick={onSignOut}
        className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full justify-start gap-3"
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  )
}
