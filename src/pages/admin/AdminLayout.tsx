import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AccountIcon,
  BallLogoIcon,
  Button,
  CategoryIcon,
  ChevronIcon,
  DashboardIcon,
  DiscountIcon,
  InventoryIcon,
  LogoutIcon,
  MenuIcon,
  NavLink,
  OrderIcon,
  ProductIcon,
  ReviewIcon,
} from '../../components/shared'
import { useAccountStore } from '../../store/accountStore'
import { notifySuccess } from '../../services/toast'
import './AdminLayout.css'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'admin-sidebar-collapsed'

function readStoredCollapsedState(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// Shared shell for every Admin (Quản_Trị_Viên) page: a fixed left
// sidebar with the shop logo/brand and the section nav (Dashboard,
// Danh mục, Sản phẩm, Tồn kho, Đơn hàng, Mã giảm giá, Đánh giá, Tài
// khoản), the logout action anchored to the bottom of the sidebar, plus a slim
// top header above the content area holding the page title and the
// sidebar toggles. Pages rendered inside RequireAdmin (App.tsx) wrap
// their content with this layout for a consistent navigation
// experience. Props are unchanged from the previous top-nav layout so
// no call site needs to change.
// Requirements: 11.1, 11.2, 11.3
function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const logout = useAccountStore((state) => state.logout)

  // Desktop collapse/expand is independent from the mobile show/hide
  // checkbox below: on desktop the sidebar stays visible but shrinks to
  // an icon rail; on mobile it is fully hidden/shown instead. The
  // collapsed preference is remembered across reloads via localStorage.
  const [isCollapsed, setIsCollapsed] = useState(readStoredCollapsedState)

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, isCollapsed ? '1' : '0')
    } catch {
      // localStorage may be unavailable (e.g. private mode) — collapse
      // state simply won't persist across reloads in that case.
    }
  }, [isCollapsed])

  function handleLogout() {
    logout()
    notifySuccess('Đã đăng xuất.')
    navigate('/login')
  }

  function toggleCollapsed() {
    setIsCollapsed((previous) => !previous)
  }

  return (
    <div className={`admin-layout${isCollapsed ? ' admin-layout-collapsed' : ''}`}>
      <input type="checkbox" id="admin-sidebar-toggle" className="admin-sidebar-toggle-input" />

      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-brand">
            <BallLogoIcon className="admin-sidebar-brand-icon" />
            <span className="admin-sidebar-brand-text">LananhSport</span>
          </div>
          <button
            type="button"
            className="admin-sidebar-collapse-toggle"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            <ChevronIcon className={isCollapsed ? 'admin-sidebar-collapse-icon-flipped' : ''} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <NavLink to="/admin" end title="Dashboard">
            <DashboardIcon className="admin-sidebar-nav-icon" />
            <span className="admin-sidebar-nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/admin/categories" title="Danh mục">
            <CategoryIcon className="admin-sidebar-nav-icon" />
            <span className="admin-sidebar-nav-label">Danh mục</span>
          </NavLink>
          <NavLink to="/admin/products" title="Sản phẩm">
            <ProductIcon className="admin-sidebar-nav-icon" />
            <span className="admin-sidebar-nav-label">Sản phẩm</span>
          </NavLink>
          <NavLink to="/admin/inventory" title="Tồn kho">
            <InventoryIcon className="admin-sidebar-nav-icon" />
            <span className="admin-sidebar-nav-label">Tồn kho</span>
          </NavLink>
          <NavLink to="/admin/orders" title="Đơn hàng">
            <OrderIcon className="admin-sidebar-nav-icon" />
            <span className="admin-sidebar-nav-label">Đơn hàng</span>
          </NavLink>
          <NavLink to="/admin/discount-codes" title="Mã giảm giá">
            <DiscountIcon className="admin-sidebar-nav-icon" />
            <span className="admin-sidebar-nav-label">Mã giảm giá</span>
          </NavLink>
          <NavLink to="/admin/reviews" title="Đánh giá">
            <ReviewIcon className="admin-sidebar-nav-icon" />
            <span className="admin-sidebar-nav-label">Đánh giá</span>
          </NavLink>
          <NavLink to="/admin/accounts" title="Tài khoản">
            <AccountIcon className="admin-sidebar-nav-icon" />
            <span className="admin-sidebar-nav-label">Tài khoản</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-account">
          <Button
            variant="ghost"
            className="admin-sidebar-logout"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <LogoutIcon className="admin-sidebar-logout-icon" />
            <span className="admin-sidebar-logout-label">Đăng xuất</span>
          </Button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <label htmlFor="admin-sidebar-toggle" className="admin-sidebar-toggle-label" aria-label="Mở menu">
            <MenuIcon />
          </label>
          <h2 className="admin-header-title">{title}</h2>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
