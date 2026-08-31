import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout'
import Home from '@/pages/Home'
import Listing from '@/pages/Listing'
import ProductDetail from '@/pages/ProductDetail'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import OrderSuccess from '@/pages/OrderSuccess'
import TrackOrder from '@/pages/TrackOrder'
import Auth from '@/pages/Auth'
import Account from '@/pages/Account'
import Wishlist from '@/pages/Wishlist'
import Search from '@/pages/Search'
import Contact from '@/pages/Contact'
import About from '@/pages/static/About'
import PrivacyPolicy from '@/pages/static/PrivacyPolicy'
import Terms from '@/pages/static/Terms'
import ShippingPolicy from '@/pages/static/ShippingPolicy'
import RefundPolicy from '@/pages/static/RefundPolicy'
import NotFound from '@/pages/NotFound'

const AdminRoutes = lazy(() => import('@/pages/admin/AdminRoutes'))

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-bg-main text-text-secondary">Loading admin panel...</div>}>
            <AdminRoutes />
          </Suspense>
        }
      />

      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/listing" element={<Listing />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/account" element={<Account />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/search" element={<Search />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
