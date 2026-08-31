import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import { AdminLayout } from '@/components/admin/AdminLayout'
import AdminLogin from './Login'
import Dashboard from './Dashboard'
import AllOrders from './orders/AllOrders'
import EmailOrders from './orders/EmailOrders'
import CourierOrders from './orders/CourierOrders'
import PendingOrders from './orders/PendingOrders'
import CancelledOrders from './orders/CancelledOrders'
import OrderDetail from './orders/OrderDetail'
import AllKeys from './license-keys/AllKeys'
import AddKeys from './license-keys/AddKeys'
import LowStock from './license-keys/LowStock'
import AllProducts from './products/AllProducts'
import ProductAddEdit from './products/AddEdit'
import AdminCategories from './products/Categories'
import AllCustomers from './customers/AllCustomers'
import BlockedCustomers from './customers/BlockedCustomers'
import AllPayments from './payments/AllPayments'
import PendingPayments from './payments/PendingPayments'
import Refunds from './payments/Refunds'
import CodOrders from './payments/CodOrders'
import CourierList from './shipping/CourierList'
import TrackingAdd from './shipping/TrackingAdd'
import AllCoupons from './coupons/AllCoupons'
import PendingReviews from './reviews/PendingReviews'
import ApprovedReviews from './reviews/ApprovedReviews'
import Enquiries from './enquiries/Enquiries'
import SalesReport from './reports/SalesReport'
import RevenueReport from './reports/RevenueReport'
import ProductReport from './reports/ProductReport'
import AllBlogs from './blogs/AllBlogs'
import AddEditBlog from './blogs/AddEditBlog'
import StoreSettings from './settings/StoreSettings'
import PaymentSettings from './settings/PaymentSettings'
import EmailSettings from './settings/EmailSettings'
import ShippingSettings from './settings/ShippingSettings'
import AdminUsers from './settings/AdminUsers'

function AdminGuard() {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-bg-main text-text-secondary">Loading...</div>
  }
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />

  return <AdminLayout />
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<AdminGuard />}>
        <Route index element={<Dashboard />} />

        <Route path="orders" element={<AllOrders />} />
        <Route path="orders/email" element={<EmailOrders />} />
        <Route path="orders/courier" element={<CourierOrders />} />
        <Route path="orders/pending" element={<PendingOrders />} />
        <Route path="orders/cancelled" element={<CancelledOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />

        <Route path="license-keys" element={<AllKeys />} />
        <Route path="license-keys/add" element={<AddKeys />} />
        <Route path="license-keys/low-stock" element={<LowStock />} />

        <Route path="products" element={<AllProducts />} />
        <Route path="products/categories" element={<AdminCategories />} />
        <Route path="products/new" element={<ProductAddEdit />} />
        <Route path="products/:id" element={<ProductAddEdit />} />

        <Route path="customers" element={<AllCustomers />} />
        <Route path="customers/blocked" element={<BlockedCustomers />} />

        <Route path="payments" element={<AllPayments />} />
        <Route path="payments/pending" element={<PendingPayments />} />
        <Route path="payments/refunds" element={<Refunds />} />
        <Route path="payments/cod" element={<CodOrders />} />

        <Route path="shipping" element={<CourierList />} />
        <Route path="shipping/tracking-add" element={<TrackingAdd />} />

        <Route path="coupons" element={<AllCoupons />} />

        <Route path="reviews" element={<PendingReviews />} />
        <Route path="reviews/approved" element={<ApprovedReviews />} />

        <Route path="enquiries" element={<Enquiries />} />

        <Route path="reports/sales" element={<SalesReport />} />
        <Route path="reports/revenue" element={<RevenueReport />} />
        <Route path="reports/products" element={<ProductReport />} />

        <Route path="blogs" element={<AllBlogs />} />
        <Route path="blogs/new" element={<AddEditBlog />} />
        <Route path="blogs/:id" element={<AddEditBlog />} />

        <Route path="settings" element={<StoreSettings />} />
        <Route path="settings/payment" element={<PaymentSettings />} />
        <Route path="settings/email" element={<EmailSettings />} />
        <Route path="settings/shipping" element={<ShippingSettings />} />
        <Route path="settings/users" element={<AdminUsers />} />
      </Route>
    </Routes>
  )
}
