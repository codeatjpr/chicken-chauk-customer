import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MarketingGate } from "@/components/routing/marketing-gate";
import { GuestLayout } from "@/components/routing/guest-layout";
import { RequireAuth } from "@/components/routing/require-auth";
import { SessionGate } from "@/components/session/session-gate";
import { PageSuspenseFallback } from "@/components/system/page-suspense-fallback";
import { MainLayout } from "@/components/templates/main-layout";
import { ROUTES } from "@/constants/routes";

const HomePage = lazy(() => import("@/pages/home-page").then((m) => ({ default: m.HomePage })));
const ProductBrowsePage = lazy(() =>
  import("@/pages/product-browse-page").then((m) => ({
    default: m.ProductBrowsePage,
  })),
);
const SearchPage = lazy(() => import("@/pages/search-page").then((m) => ({ default: m.SearchPage })));
const CategoryProductsPage = lazy(() =>
  import("@/pages/category-products-page").then((m) => ({
    default: m.CategoryProductsPage,
  })),
);
const VendorPage = lazy(() => import("@/pages/vendor-page").then((m) => ({ default: m.VendorPage })));
const ProductPage = lazy(() => import("@/pages/product-page").then((m) => ({ default: m.ProductPage })));
const VendorProductPage = lazy(() => import("@/pages/vendor-product-page").then((m) => ({ default: m.VendorProductPage })));
const HelpPage = lazy(() => import("@/pages/help-page").then((m) => ({ default: m.HelpPage })));
const LoginPage = lazy(() => import("@/pages/login-page").then((m) => ({ default: m.LoginPage })));

const OnboardingPage = lazy(() =>
  import("@/pages/onboarding-page").then((m) => ({
    default: m.OnboardingPage,
  })),
);
const CartPage = lazy(() => import("@/pages/cart-page").then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("@/pages/checkout-page").then((m) => ({ default: m.CheckoutPage })));
const OrdersPage = lazy(() => import("@/pages/orders-page").then((m) => ({ default: m.OrdersPage })));
const OrderTrackingPage = lazy(() =>
  import("@/pages/order-tracking-page").then((m) => ({
    default: m.OrderTrackingPage,
  })),
);
const OrderDetailPage = lazy(() =>
  import("@/pages/order-detail-page").then((m) => ({
    default: m.OrderDetailPage,
  })),
);
const ProfilePage = lazy(() => import("@/pages/profile-page").then((m) => ({ default: m.ProfilePage })));
const AddressesPage = lazy(() =>
  import("@/pages/addresses-page").then((m) => ({
    default: m.AddressesPage,
  })),
);
const WalletPage = lazy(() => import("@/pages/wallet-page").then((m) => ({ default: m.WalletPage })));
const FavoritesPage = lazy(() =>
  import("@/pages/favorites-page").then((m) => ({
    default: m.FavoritesPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/pages/notifications-page").then((m) => ({
    default: m.NotificationsPage,
  })),
);

function SuspensePage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSuspenseFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SessionGate />}>
        <Route index element={<MarketingGate />} />

        <Route path="login" element={<GuestLayout />}>
          <Route
            index
            element={
              <SuspensePage>
                <LoginPage />
              </SuspensePage>
            }
          />
        </Route>

        <Route element={<MainLayout />}>
          <Route
            path="home"
            element={
              <SuspensePage>
                <HomePage />
              </SuspensePage>
            }
          />
          <Route
            path="browse"
            element={
              <SuspensePage>
                <ProductBrowsePage />
              </SuspensePage>
            }
          />
          <Route
            path="search"
            element={
              <SuspensePage>
                <SearchPage />
              </SuspensePage>
            }
          />
          <Route
            path="categories/:categoryId"
            element={
              <SuspensePage>
                <CategoryProductsPage />
              </SuspensePage>
            }
          />
          <Route
            path="vendors/:id"
            element={
              <SuspensePage>
                <VendorPage />
              </SuspensePage>
            }
          />
          <Route
            path="products/:id"
            element={
              <SuspensePage>
                <ProductPage />
              </SuspensePage>
            }
          />
          <Route
            path="vendor-products/:id"
            element={
              <SuspensePage>
                <VendorProductPage />
              </SuspensePage>
            }
          />
          <Route
            path="help"
            element={
              <SuspensePage>
                <HelpPage />
              </SuspensePage>
            }
          />

          <Route element={<RequireAuth />}>
            <Route
              path="onboarding"
              element={
                <SuspensePage>
                  <OnboardingPage />
                </SuspensePage>
              }
            />
            <Route
              path="cart"
              element={
                <SuspensePage>
                  <CartPage />
                </SuspensePage>
              }
            />
            <Route
              path="checkout"
              element={
                <SuspensePage>
                  <CheckoutPage />
                </SuspensePage>
              }
            />
            <Route
              path="orders"
              element={
                <SuspensePage>
                  <OrdersPage />
                </SuspensePage>
              }
            />
            <Route
              path="orders/:id/tracking"
              element={
                <SuspensePage>
                  <OrderTrackingPage />
                </SuspensePage>
              }
            />
            <Route
              path="orders/:id"
              element={
                <SuspensePage>
                  <OrderDetailPage />
                </SuspensePage>
              }
            />
            <Route
              path="profile"
              element={
                <SuspensePage>
                  <ProfilePage />
                </SuspensePage>
              }
            />
            <Route
              path="profile/addresses"
              element={
                <SuspensePage>
                  <AddressesPage />
                </SuspensePage>
              }
            />
            <Route
              path="wallet"
              element={
                <SuspensePage>
                  <WalletPage />
                </SuspensePage>
              }
            />
            <Route
              path="favorites"
              element={
                <SuspensePage>
                  <FavoritesPage />
                </SuspensePage>
              }
            />
            <Route
              path="notifications"
              element={
                <SuspensePage>
                  <NotificationsPage />
                </SuspensePage>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Route>
    </Routes>
  );
}
