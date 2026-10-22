import { Link, useNavigate } from 'react-router-dom'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import { useCartStore } from '../../store/cartStore'
import Button from './Button'
import './Header.css'

// Shared Header/navbar shell used by Storefront pages: shows only the
// shop title/logo plus, on the right, either "Đăng nhập"/"Đăng ký"
// buttons for guests, or the Giỏ_Hàng (Cart) indicator and the current
// Tài_Khoản's info (name + logout) once authenticated. The keyword
// SearchBar lives next to the FilterPanel on listing pages instead of
// in the header (Requirement 2.3, 2.6).
//
// The cart indicator links to the Giỏ_Hàng page (task 26.1) and shows
// itemCount from cartStore, which is kept in sync for both guest
// (localStorage) and authenticated (backend API) carts.
// Requirements: 3.1, 6.1, 6.2, 6.5, 11.1, 11.2, 11.3
function Header() {
  const navigate = useNavigate()
  const isAuthenticated = useAccountStore((state) => state.isAuthenticated)
  const account = useAccountStore((state) => state.account)
  const logout = useAccountStore((state) => state.logout)
  const itemCount = useCartStore((state) => state.itemCount)

  function handleLogout() {
    logout()
    notifySuccess('Đã đăng xuất.')
    navigate('/')
  }

  return (
    <header className="app-header">
      <h1 className="app-header-title">
        <Link to="/">LananhSport</Link>
      </h1>

      <div className="app-header-actions">
        <Link to="/cart" className="app-header-cart" aria-label={`Giỏ hàng: ${itemCount} sản phẩm`}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L21 7H6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="20" r="1.3" fill="currentColor" />
            <circle cx="17" cy="20" r="1.3" fill="currentColor" />
          </svg>
          {itemCount > 0 ? <span className="app-header-cart-badge">{itemCount}</span> : null}
        </Link>

        {isAuthenticated ? (
          <div className="app-header-account">
            <Link to="/account/profile" className="app-header-account-name">
              {account?.fullName ?? account?.email ?? 'Tài khoản'}
            </Link>
            <Link to="/account/orders" className="app-header-account-orders">
              Đơn hàng của tôi
            </Link>
            <Button variant="ghost" className="app-header-logout" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        ) : (
          <div className="app-header-auth-actions">
            <Link to="/login">
              <Button variant="ghost" className="app-header-login">
                Đăng nhập
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" className="app-header-register">
                Đăng ký
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header