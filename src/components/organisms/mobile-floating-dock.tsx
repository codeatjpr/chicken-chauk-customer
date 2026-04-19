import { ChevronRight, Home, Package, Search, ShoppingCart, User } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useCartQuery } from "@/hooks/use-cart";
import { useAuthStore, selectIsAuthenticated } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const tabs = [
  { to: ROUTES.home, label: "Home", icon: Home, guestOk: true },
  { to: ROUTES.search, label: "Search", icon: Search, guestOk: true },
  { to: ROUTES.orders, label: "Orders", icon: Package, guestOk: false },
  { to: ROUTES.profile, label: "Profile", icon: User, guestOk: false },
] as const;

function FloatingCartPill() {
  const { data: cart } = useCartQuery();
  if (!cart?.items.length) return null;

  const totalQty = cart.totalQuantity ?? cart.items.reduce((s, i) => s + i.quantity, 0);
  const preview = cart.items[cart.items.length - 1];
  const itemLabel = totalQty === 1 ? "1 item" : `${totalQty} items`;

  return (
    <Link
      to={ROUTES.cart}
      className={cn(
        "from-card to-muted/25 text-card-foreground border-border/70 bg-linear-to-b shadow-md",
        "flex max-w-[min(22rem,calc(100vw-2rem))] items-center gap-3 rounded-full border px-3 py-2 pr-2",
        "ring-black/5 ring-1 transition hover:border-primary/25 hover:shadow-lg active:scale-[0.99]",
      )}>
      <div className="border-border/60 bg-muted/50 size-11 shrink-0 overflow-hidden rounded-xl border">
        {preview.imageUrl ? (
          <img src={preview.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <Package className="size-5 opacity-80" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[15px] font-semibold tracking-tight">View cart</p>
        <p className="text-muted-foreground text-xs font-normal">{itemLabel}</p>
      </div>
      <span
        className={cn(
          "bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-full",
          "ring-primary/15 hover:bg-primary/18 transition",
        )}
        aria-hidden>
        <ChevronRight className="size-5" strokeWidth={2.5} />
      </span>
    </Link>
  );
}

function FloatingCartFab() {
  const location = useLocation();
  const { data: cart } = useCartQuery();
  const authed = useAuthStore(selectIsAuthenticated);
  const count = cart?.totalQuantity ?? 0;
  const to = authed ? ROUTES.cart : ROUTES.login;
  const loginState = {
    from: `${location.pathname}${location.search}${location.hash}`,
  };

  return (
    <Link
      to={to}
      {...(!authed ? { state: loginState } : {})}
      className={cn(
        "border-background from-card to-muted/40 text-primary ring-background/80",
        "relative flex size-14 shrink-0 items-center justify-center rounded-full border-4 bg-linear-to-b shadow-lg",
        "transition hover:shadow-xl hover:brightness-[1.02] active:scale-95",
      )}
      aria-label={authed ? `Open cart${count ? `, ${count} items` : ""}` : "Sign in to view cart"}>
      <span className="pointer-events-none absolute inset-2" aria-hidden />
      <ShoppingCart
        className="relative z-10 size-7 stroke-[2.1] text-primary"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {authed && count > 0 && (
        <span className="bg-primary text-primary-foreground absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full border-2 border-background p-.5 px-1 text-[10px] font-bold leading-none shadow-sm">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function MobileFloatingDock() {
  const location = useLocation();
  const authed = useAuthStore(selectIsAuthenticated);
  const loginState = {
    from: `${location.pathname}${location.search}${location.hash}`,
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex w-full max-w-lg flex-col items-center gap-2.5 px-4",
          "pb-[calc(0.65rem+env(safe-area-inset-bottom,0px))] pt-1",
        )}>
        <FloatingCartPill />

        <div className="flex w-full items-end justify-center gap-2.5">
          <nav
            className={cn(
              "bg-card text-card-foreground flex min-h-14 flex-1 items-stretch justify-around rounded-full",
              "border-border/60 border px-1 py-1.5 shadow-xl ring-1 ring-black/5",
            )}
            aria-label="Main">
            {tabs.map(({ to, label, icon: Icon, guestOk }) => {
              if (!authed && !guestOk) {
                return (
                  <Link
                    key={to}
                    to={ROUTES.login}
                    state={loginState}
                    className="text-muted-foreground flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-0.5 text-[11px] font-medium transition-colors hover:text-foreground">
                    <Icon className="size-[22px] shrink-0 opacity-80" aria-hidden />
                    {label}
                  </Link>
                );
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === ROUTES.home}
                  className={({ isActive }) =>
                    cn(
                      "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-0.5 text-[11px] font-medium transition-colors",
                      isActive
                        ? "text-amber-500 font-semibold [&_svg]:opacity-100"
                        : "text-muted-foreground hover:text-foreground [&_svg]:opacity-70",
                    )
                  }>
                  <Icon className="size-[22px] shrink-0" aria-hidden />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          <FloatingCartFab />
        </div>
      </div>
    </div>
  );
}
