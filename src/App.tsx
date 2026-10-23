import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { RequireAdmin, RequireAuth } from './components/routing'
import AdminAccountPage from './pages/admin/AdminAccountPage'
import AdminCategoryPage from './pages/admin/AdminCategoryPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminDiscountPage from './pages/admin/AdminDiscountPage'
import AdminInventoryPage from './pages/admin/AdminInventoryPage'
import AdminOrderPage from './pages/admin/AdminOrderPage'
import AdminProductFormPage from './pages/admin/AdminProductFormPage'
import AdminProductListPage from './pages/admin/AdminProductListPage'
import AdminReviewPage from './pages/admin/AdminReviewPage'
import CartPage from './pages/storefront/CartPage'
import CategoryProductsPage from './pages/storefront/CategoryProductsPage'
import CheckoutPage from './pages/storefront/CheckoutPage'
import HomePage from './pages/storefront/HomePage'
import LoginPage from './pages/storefront/LoginPage'
import OrderConfirmationPage from './pages/storefront/OrderConfirmationPage'
import OrderDetailPage from './pages/storefront/OrderDetailPage'
import OrderHistoryPage from './pages/storefront/OrderHistoryPage'
import ProductDetailPage from './pages/storefront/ProductDetailPage'
import ProductSearchPage from './pages/storefront/ProductSearchPage'
import ProfilePage from './pages/storefront/ProfilePage'
import RegisterPage from './pages/storefront/RegisterPage'
import { useAccountStore } from './store/accountStore'
import StorefrontAccess from './components/routing/StorefrontAccess'

// Routing skeleton for task 22, extended with Auth routes in task 24.1
// and route guards + Hồ sơ cá nhân (Profile) in task 24.2, the
// Homepage + Category product listing page in task 25.1, the
// search/filter page in task 25.2, the Product detail page in task
// 25.3, the Giỏ_Hàng (Cart) page in task 26.1, the Checkout + Order
// confirmation pages in task 27.1, and the order history + order detail
// pages for Khách_Hàng in task 27.2, the Admin Danh_Mục/Sản_Phẩm
// management pages in task 28.1, the Admin Tồn_Kho management page in
// task 28.2, the Admin Đơn_Hàng management page in task 28.3, and the
// Admin Mã_Giảm_Giá/Đánh_Giá_Sản_Phẩm management pages in task 28.4.
// Remaining Admin page (Dashboard) is built out fully in the rest of
// task 28.
function App() {
  const restoreSession = useAccountStore((state) => state.restoreSession)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let active = true
    restoreSession().finally(() => { if (active) setSessionReady(true) })
    return () => { active = false }
  }, [restoreSession])

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <StorefrontAccess sessionReady={sessionReady}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories/:categoryId" element={<CategoryProductsPage />} />
        <Route path="/search" element={<ProductSearchPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/confirmation/:orderId" element={<OrderConfirmationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/account/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/account/orders"
          element={
            <RequireAuth>
              <OrderHistoryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <RequireAuth>
              <OrderDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboardPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <RequireAdmin>
              <AdminCategoryPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RequireAdmin>
              <AdminProductListPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <RequireAdmin>
              <AdminProductFormPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/products/:productId/edit"
          element={
            <RequireAdmin>
              <AdminProductFormPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <RequireAdmin>
              <AdminInventoryPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <RequireAdmin>
              <AdminOrderPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/discount-codes"
          element={
            <RequireAdmin>
              <AdminDiscountPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <RequireAdmin>
              <AdminReviewPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/accounts"
          element={
            <RequireAdmin>
              <AdminAccountPage />
            </RequireAdmin>
          }
        />
      </Routes>
      </StorefrontAccess>
    </BrowserRouter>
  )
}

export default App
