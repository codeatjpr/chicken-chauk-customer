import { Home, LayoutGrid, Package, Search, ShoppingCart } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useCartQuery } from "@/hooks/use-cart";
import { useAuthStore, selectIsAuthenticated } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const tabs = [
  { to: ROUTES.home, label: "Home", icon: Home, guestOk: true, end: true },
  { to: ROUTES.browse, label: "Products", icon: LayoutGrid, guestOk: true, end: false },
  { to: ROUTES.search, label: "Search", icon: Search, guestOk: true, end: false },
  { to: ROUTES.orders, label: "Orders", icon: Package, guestOk: false, end: false },
  { to: ROUTES.cart, label: "Cart", icon: ShoppingCart, guestOk: true, end: false },
] as const;

export function MobileFloatingDock() {
  const location = useLocation();
  const authed = useAuthStore(selectIsAuthenticated);
  const { data: cart } = useCartQuery();
  const cartCount = cart?.totalQuantity ?? 0;
  const loginState = {
    from: `${location.pathname}${location.search}${location.hash}`,
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors sm:text-[11px]",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden">
      <nav
        className={cn(
          "pointer-events-auto flex w-full items-stretch justify-around",
          "rounded-t-2xl border-t border-zinc-200/90 bg-white",
          "shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)]",
          "pb-[env(safe-area-inset-bottom,0px)]",
        )}
        aria-label="Main">
        {tabs.map(({ to, label, icon: Icon, guestOk, end }) => {
          if (!authed && !guestOk) {
            return (
              <Link
                key={to}
                to={ROUTES.login}
                state={loginState}
                className="text-muted-foreground hover:text-foreground flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium sm:text-[11px]">
                <Icon className="size-[22px] shrink-0 opacity-80" aria-hidden />
                {label}
              </Link>
            );
          }

          if (to === ROUTES.cart) {
            return (
              <NavLink key={to} to={to} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className="relative inline-flex">
                      <Icon className="size-[22px] shrink-0" aria-hidden />
                      {cartCount > 0 ? (
                        <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      ) : null}
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="size-[22px] shrink-0" aria-hidden />
              {label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
