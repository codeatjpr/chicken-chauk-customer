import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestLayout } from '@/components/routing/guest-layout'
import { ProtectedLayout } from '@/components/routing/protected-layout'
import { SessionGate } from '@/components/session/session-gate'
import { MainLayout } from '@/components/templates/main-layout'
import { ROUTES } from '@/constants/routes'
import { HomePage } from '@/pages/home-page'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage } from '@/pages/login-page'
import { CartPage } from '@/pages/cart-page'
import { CheckoutPage } from '@/pages/checkout-page'
import { AddressesPage } from '@/pages/addresses-page'
import { FavoritesPage } from '@/pages/favorites-page'
import { HelpPage } from '@/pages/help-page'
import { NotificationsPage } from '@/pages/notifications-page'
import { OrderDetailPage } from '@/pages/order-detail-page'
import { OrderTrackingPage } from '@/pages/order-tracking-page'
import { OrdersPage } from '@/pages/orders-page'
import { ProductPage } from '@/pages/product-page'
import { ProfilePage } from '@/pages/profile-page'
import { SearchPage } from '@/pages/search-page'
import { VendorPage } from '@/pages/vendor-page'
import { WalletPage } from '@/pages/wallet-page'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SessionGate />}>
        <Route element={<GuestLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route element={<MainLayout />}>
            <Route path="home" element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="vendors/:id" element={<VendorPage />} />
            <Route path="products/:id" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id/tracking" element={<OrderTrackingPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/addresses" element={<AddressesPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.root} replace />} />
      </Route>
    </Routes>
  )
}
