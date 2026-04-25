import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronDown,
  Heart,
  Home,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { brandLogo } from "@/constants/brand-assets";
import { LocationPickerDialog } from "@/components/organisms/location-picker-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryKeys } from "@/constants/query-keys";
import { ROUTES } from "@/constants/routes";
import { useCartQuery } from "@/hooks/use-cart";
import * as notificationsApi from "@/services/notifications.service";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth-store";
import { useLocationStore } from "@/stores/location-store";
import { sanitizeLocationDisplayText } from "@/lib/location-label";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatIndianMobileDisplay } from "@/utils/phone";

function AccountMenu() {
  const navigate = useNavigate();
  const authed = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: cart } = useCartQuery();
  const cartCount = cart?.totalQuantity ?? 0;

  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationsApi.fetchNotifications({ unreadOnly: true, page: 1, limit: 1 }),
    select: (d) => d.total,
    enabled: authed,
  });
  const unreadTotal = authed ? (unreadQuery.data ?? 0) : 0;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate(ROUTES.home);
  };

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full transition-colors",
            "border-border/80 bg-white text-foreground hover:bg-zinc-50 border px-3 py-1.5 shadow-sm min-h-10",
            "-m-1 size-10 shrink-0 justify-center border-0 bg-transparent p-0 shadow-none hover:bg-transparent lg:m-0 lg:size-auto lg:min-h-10 lg:justify-start lg:border lg:bg-white lg:px-3 lg:py-1.5 lg:shadow-sm",
          )}>
          <User className="text-primary size-[22px] shrink-0 stroke-[1.75] lg:size-4 lg:text-muted-foreground lg:stroke-2" aria-hidden />
          <span className="hidden min-w-0 flex-col items-start text-left leading-tight lg:flex">
            <span className="text-xs font-semibold">
              {authed ? (firstName || user?.name || "Account") : "Account"}
            </span>
            {authed ? (
              <span className="text-muted-foreground text-[10px] font-normal">My Account</span>
            ) : (
              <span className="text-muted-foreground text-[10px] font-normal">Sign in</span>
            )}
          </span>
          <ChevronDown className="text-muted-foreground hidden size-3.5 shrink-0 opacity-70 lg:block" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {authed ? (
          <>
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-foreground text-sm font-semibold">{user?.name ?? "My Account"}</p>
              {user?.phone && (
                <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                  {formatIndianMobileDisplay(user.phone)}
                </p>
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
                  <span className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                    {cartCount}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(ROUTES.notifications)}>
                <Bell className="size-4" />
                Alerts
                {unreadTotal > 0 && (
                  <span className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
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
              className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
  );
}

function SearchField({
  searchValue,
  setSearchValue,
  searchRef,
  goToSearchPage,
  runSearch,
  className,
  placeholder = "Search shops and products by name…",
}: {
  searchValue: string;
  setSearchValue: (v: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  goToSearchPage: () => void;
  runSearch: () => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/60 flex h-10 w-full max-w-full items-stretch overflow-hidden rounded-full border bg-orange-50/70 pl-2 shadow-sm sm:h-11",
        className,
      )}>
      <button
        type="button"
        onClick={goToSearchPage}
        className="text-muted-foreground hover:text-foreground flex shrink-0 items-center justify-center pl-1 pr-0.5"
        aria-label="Open search page">
        <Search className="size-4" aria-hidden />
      </button>
      <input
        ref={searchRef}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") runSearch();
        }}
        placeholder={placeholder}
        className="text-foreground placeholder:text-muted-foreground/80 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm shadow-none ring-0 outline-none focus-visible:ring-0"
        aria-label="Search catalog"
      />
      <button
        type="button"
        onClick={runSearch}
        className="bg-primary text-primary-foreground hover:bg-primary/90 my-0.5 mr-0.5 flex w-9 shrink-0 items-center justify-center rounded-full border-0 shadow-none sm:w-10"
        aria-label="Search">
        <Search className="size-4" />
      </button>
    </div>
  );
}

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [locOpen, setLocOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchRefMobile = useRef<HTMLInputElement>(null);
  const authed = useAuthStore(selectIsAuthenticated);

  const unreadBellQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationsApi.fetchNotifications({ unreadOnly: true, page: 1, limit: 1 }),
    select: (d) => d.total,
    enabled: authed,
  });
  const unreadBellTotal = authed ? (unreadBellQuery.data ?? 0) : 0;

  const { displayLabel, city } = useLocationStore();
  const { data: cart } = useCartQuery();
  const cartCount = cart?.totalQuantity ?? 0;
  const rawLocation = displayLabel || city || "Select area";
  const addressLine = sanitizeLocationDisplayText(rawLocation);

  const onCart = location.pathname === ROUTES.cart;
  const qParam = searchParams.get("q")?.trim() ?? "";
  useEffect(() => {
    if (location.pathname === ROUTES.search && qParam) {
      setSearchValue(qParam);
    }
  }, [location.pathname, qParam]);

  const goToSearchPage = () => {
    navigate(ROUTES.search);
    searchRef.current?.blur();
    searchRefMobile.current?.blur();
  };

  const runSearch = () => {
    const q = searchValue.trim();
    navigate(q ? `${ROUTES.search}?q=${encodeURIComponent(q)}` : ROUTES.search);
    searchRef.current?.blur();
    searchRefMobile.current?.blur();
  };

  const locationBlock = (compact?: boolean) => (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2", compact && "w-full")}>
      <button
        type="button"
        onClick={() => setLocOpen(true)}
        className="border-border/70 bg-muted/40 text-foreground hover:bg-muted/55 flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors sm:size-8 sm:rounded-lg"
        aria-label="Open location picker">
        <MapPin className="text-primary size-3.5 shrink-0 sm:size-4" aria-hidden />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setLocOpen(true)}
          className="text-foreground hover:bg-muted/45 min-w-0 flex-1 truncate rounded-md py-0 text-left text-[11px] leading-tight transition-colors sm:text-xs lg:text-sm lg:leading-snug"
          aria-label="Change delivery area">
          <span className="text-muted-foreground font-normal">Deliver to: </span>
          <span className="font-medium">{addressLine}</span>
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLocOpen(true)}
          className="text-primary border-primary/40 hover:bg-primary/5 h-6 shrink-0 rounded-full px-2 text-[10px] font-semibold shadow-none sm:h-7 sm:px-2.5 sm:text-[11px] lg:text-xs">
          Change
        </Button>
      </div>
      <button
        type="button"
        onClick={() => setLocOpen(true)}
        className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-0.5 transition-colors"
        aria-label="Open location options">
        <ChevronDown className="size-3.5 opacity-70 sm:size-4" aria-hidden />
      </button>
    </div>
  );

  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors lg:gap-1.5 lg:px-2.5 lg:py-1",
      isActive ? "bg-orange-50 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
    );

  const isHome = location.pathname === ROUTES.home;
  const isSearch = location.pathname === ROUTES.search;

  return (
    <header
      className={cn(
        "z-30 border-b border-zinc-200/90 bg-white shadow-[0_4px_24px_-12px_rgba(0,0,0,0.12)]",
        "rounded-b-2xl lg:rounded-b-none",
        "fixed inset-x-0 top-0 pt-[env(safe-area-inset-top,0px)] lg:sticky lg:inset-x-auto lg:top-0 lg:pt-0",
      )}>
      <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6">
        {/* Row 1: logo · search (desktop) · cart + account */}
        <div className="flex items-center gap-2 py-2 sm:gap-4 sm:py-2.5 lg:py-3">
          <Link
            to={ROUTES.home}
            className="flex shrink-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
            <img
              src={brandLogo}
              alt="ChickenChauk"
              className="h-10 w-auto max-h-11 object-contain object-left sm:h-11 sm:max-h-12 lg:h-12 lg:max-h-12"
            />
          </Link>

          <div className="hidden min-w-0 flex-1 justify-center px-2 lg:flex">
            <div className="w-full max-w-md xl:max-w-lg">
              <SearchField
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                searchRef={searchRef}
                goToSearchPage={goToSearchPage}
                runSearch={runSearch}
              />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {authed ? (
              <Link
                to={ROUTES.notifications}
                className="text-primary relative -m-1 inline-flex size-10 shrink-0 items-center justify-center transition-opacity hover:opacity-80 lg:hidden"
                aria-label={
                  unreadBellTotal ? `Notifications, ${unreadBellTotal} unread` : "Notifications"
                }>
                <Bell className="size-[22px] stroke-[1.75]" aria-hidden />
                {unreadBellTotal > 0 ? (
                  <span className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none">
                    {unreadBellTotal > 9 ? "9+" : unreadBellTotal}
                  </span>
                ) : null}
              </Link>
            ) : (
              <Link
                to={ROUTES.login}
                state={{ from: `${location.pathname}${location.search}` }}
                className="text-primary -m-1 inline-flex size-10 shrink-0 items-center justify-center transition-opacity hover:opacity-80 lg:hidden"
                aria-label="Sign in to view notifications">
                <Bell className="size-[22px] stroke-[1.75]" aria-hidden />
              </Link>
            )}
            <Link
              to={ROUTES.cart}
              className={cn(
                "border-border/80 bg-white text-foreground hover:bg-zinc-50 hidden items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition-colors lg:inline-flex",
                onCart && "ring-primary/25 ring-2",
              )}
              aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}>
              <span className="relative inline-flex">
                <ShoppingCart className="size-4 shrink-0" aria-hidden />
              </span>
              <span className="text-sm font-semibold">Cart</span>
              {cartCount > 0 ? (
                <span className="bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
            <AccountMenu />
          </div>
        </div>

        {/* Row 2: location + sub nav (desktop) */}
        <div className="border-border/60 hidden min-h-0 items-center justify-between gap-2 border-t py-1 lg:flex lg:gap-3">
          {locationBlock()}
          <nav className="flex shrink-0 items-center gap-0.5 lg:gap-1">
            <NavLink to={ROUTES.home} end className={subNavLinkClass}>
              <Home className="size-3.5 lg:size-4" aria-hidden />
              Home
            </NavLink>
            <NavLink to={ROUTES.browse} className={subNavLinkClass}>
              <LayoutGrid className="size-3.5 lg:size-4" aria-hidden />
              Products
            </NavLink>
            <NavLink to={ROUTES.stores} className={subNavLinkClass}>
              <Store className="size-3.5 lg:size-4" aria-hidden />
              Stores
            </NavLink>
          </nav>
        </div>

        {/* Mobile / tablet: location (home only) or search field (search page only) */}
        {isHome ? (
          <div className="border-border/60 border-t pb-1.5 pt-1 lg:hidden">{locationBlock(true)}</div>
        ) : isSearch ? (
          <div className="border-border/60 border-t pb-1.5 pt-1 lg:hidden">
            <div className="mx-auto w-full max-w-lg">
              <SearchField
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                searchRef={searchRefMobile}
                goToSearchPage={goToSearchPage}
                runSearch={runSearch}
                placeholder="Search shops and products by name…"
              />
            </div>
          </div>
        ) : null}
      </div>

      <LocationPickerDialog open={locOpen} onOpenChange={setLocOpen} />
    </header>
  );
}
