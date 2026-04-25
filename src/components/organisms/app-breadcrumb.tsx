import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { queryKeys } from "@/constants/query-keys";
import { categoryPath, ROUTES } from "@/constants/routes";
import type { VendorProductDetailDto } from "@/types/catalog";

type Crumb = { label: string; to?: string };

/** Read a vendor name from React-Query cache (populated when VendorPage mounts). */
function useVendorName(id: string) {
  const qc = useQueryClient();
  const cached = qc.getQueryData<{ name?: string }>(queryKeys.vendors.detail(id));
  return cached?.name ?? null;
}

/** Read a product name from cache (populated when ProductPage mounts). */
function useProductName(id: string) {
  const qc = useQueryClient();
  const cached = qc.getQueryData<{ name?: string }>(queryKeys.catalog.product(id));
  return cached?.name ?? null;
}

/** Read a category name from cache (populated when CategoryProductsPage mounts). */
function useCategoryName(id: string) {
  const qc = useQueryClient();
  const cached = qc.getQueryData<{ name?: string }>(queryKeys.catalog.category(id));
  return cached?.name ?? null;
}

/** Read an order's short ID from cache (populated when OrderDetailView mounts). */
function useOrderShortId(id: string) {
  const qc = useQueryClient();
  const cached = qc.getQueryData<{ shortId?: string; id?: string }>(queryKeys.orders.detail(id));
  if (cached?.shortId) return `#${cached.shortId}`;
  if (id.length >= 6) return `#${id.slice(-6).toUpperCase()}`;
  return `#${id.toUpperCase()}`;
}

/** Resolves breadcrumbs for dynamic vendor route. */
function VendorCrumbs({ id }: { id: string }) {
  const name = useVendorName(id);
  const crumbs: Crumb[] = [{ label: name ?? "Shop", to: `/vendors/${id}` }];
  return <CrumbList crumbs={crumbs} />;
}

/** Category + product title from vendor listing detail cache. */
function useVendorProductBreadcrumb(id: string) {
  const qc = useQueryClient();
  const cached = qc.getQueryData<VendorProductDetailDto>(queryKeys.catalog.vendorProduct(id));
  return {
    productName: cached?.product.name ?? null,
    categoryId: cached?.product.category?.id,
    categoryName: cached?.product.category?.name ?? null,
  };
}

function VendorProductCrumbs({ id }: { id: string }) {
  const { productName, categoryId, categoryName } = useVendorProductBreadcrumb(id);
  const crumbs: Crumb[] = [];
  if (categoryId && categoryName) {
    crumbs.push({ label: categoryName, to: categoryPath(categoryId) });
  }
  crumbs.push({ label: productName ?? "Product" });
  return <CrumbList crumbs={crumbs} />;
}

/** Resolves breadcrumbs for dynamic product route. */
function ProductCrumbs({ id }: { id: string }) {
  const name = useProductName(id);
  const crumbs: Crumb[] = [{ label: "Products", to: ROUTES.browse }, { label: name ?? "Product" }];
  return <CrumbList crumbs={crumbs} />;
}

/** Resolves breadcrumbs for dynamic category route. */
function CategoryCrumbs({ id }: { id: string }) {
  const name = useCategoryName(id);
  const crumbs: Crumb[] = [{ label: "Products", to: ROUTES.browse }, { label: name ?? "Category" }];
  return <CrumbList crumbs={crumbs} />;
}

/** Resolves breadcrumbs for order detail route. */
function OrderDetailCrumbs({ id }: { id: string }) {
  const label = useOrderShortId(id);
  const crumbs: Crumb[] = [{ label: "Orders", to: ROUTES.orders }, { label }];
  return <CrumbList crumbs={crumbs} />;
}

/** Resolves breadcrumbs for order tracking route. */
function OrderTrackingCrumbs({ id }: { id: string }) {
  const label = useOrderShortId(id);
  const crumbs: Crumb[] = [
    { label: "Orders", to: ROUTES.orders },
    { label, to: `/orders/${id}` },
    { label: "Tracking" },
  ];
  return <CrumbList crumbs={crumbs} />;
}

/** Renders the middle crumbs (everything after Home, before current page). */
function CrumbList({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      {crumbs.map((c, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRight className="text-muted-foreground/50 size-3.5 shrink-0" aria-hidden />
            {!isLast && c.to ? (
              <Link
                to={c.to}
                className="text-muted-foreground hover:text-foreground max-w-[200px] truncate text-sm transition-colors">
                {c.label}
              </Link>
            ) : (
              <span className="text-foreground max-w-[220px] truncate text-sm font-medium">{c.label}</span>
            )}
          </span>
        );
      })}
    </>
  );
}

/** Static route → breadcrumb label map */
const STATIC_CRUMBS: Record<string, Crumb[]> = {
  [ROUTES.browse]: [{ label: "Products" }],
  [ROUTES.search]: [{ label: "Search" }],
  [ROUTES.stores]: [{ label: "Shops near you" }],
  [ROUTES.cart]: [{ label: "Cart" }],
  [ROUTES.checkout]: [{ label: "Cart", to: ROUTES.cart }, { label: "Checkout" }],
  [ROUTES.orders]: [{ label: "Orders" }],
  [ROUTES.profile]: [{ label: "Account" }],
  [ROUTES.profileAddresses]: [{ label: "Account", to: ROUTES.profile }, { label: "Addresses" }],
  [ROUTES.wallet]: [{ label: "Account", to: ROUTES.profile }, { label: "Wallet" }],
  [ROUTES.favorites]: [{ label: "Saved" }],
  [ROUTES.notifications]: [{ label: "Notifications" }],
  [ROUTES.help]: [{ label: "Help" }],
};

export function AppBreadcrumb() {
  const { pathname } = useLocation();

  // Don't show breadcrumbs on home or root
  if (pathname === ROUTES.home || pathname === "/" || pathname === "/home") return null;

  // ── Dynamic route detection ──
  const vendorMatch = /^\/vendors\/([^/]+)$/.exec(pathname);
  const vendorProductMatch = /^\/vendor-products\/([^/]+)$/.exec(pathname);
  const productMatch = /^\/products\/([^/]+)$/.exec(pathname);
  const categoryMatch = /^\/categories\/([^/]+)$/.exec(pathname);
  const orderMatch = /^\/orders\/([^/]+)$/.exec(pathname);
  const trackingMatch = /^\/orders\/([^/]+)\/tracking$/.exec(pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-sm"
    >
      {/* Home is always first */}
      <Link
        to={ROUTES.home}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors">
        <Home className="size-3.5" aria-hidden />
        <span>Home</span>
      </Link>

      {/* Dynamic routes */}
      {trackingMatch && <OrderTrackingCrumbs id={trackingMatch[1]} />}
      {orderMatch && !trackingMatch && <OrderDetailCrumbs id={orderMatch[1]} />}
      {vendorMatch && <VendorCrumbs id={vendorMatch[1]} />}
      {vendorProductMatch && <VendorProductCrumbs id={vendorProductMatch[1]} />}
      {productMatch && <ProductCrumbs id={productMatch[1]} />}
      {categoryMatch && <CategoryCrumbs id={categoryMatch[1]} />}

      {/* Static routes */}
      {!vendorMatch &&
        !vendorProductMatch &&
        !productMatch &&
        !categoryMatch &&
        !orderMatch &&
        !trackingMatch && (
        <CrumbList crumbs={STATIC_CRUMBS[pathname] ?? [{ label: pathname.replace("/", "") }]} />
      )}
    </nav>
  );
}
