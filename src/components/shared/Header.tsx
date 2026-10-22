import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import { useCartStore } from '../../store/cartStore'
import Button from './Button'
import { BallLogoIcon } from './icons'
import SearchBar from './SearchBar'
import './Header.css'

// Shared Header/navbar shell used by Storefront pages, laid out Shopee-style:
// logo on the far left, the keyword SearchBar taking up the middle
// (Requirement 2.3), and on the right either "Đăng nhập"/"Đăng ký" buttons
// for guests, or the Giỏ_Hàng (Cart) indicator + current Tài_Khoản's info
// (name + logout) once authenticated. Danh_Mục browsing still happens via
// the homepage's category list/links (Requirement 2.2) — this is only the
// cross-category keyword search (Requirement 2.3).
//
// The cart indicator links to the Giỏ_Hàng page (task 26.1) and shows
// itemCount from cartStore. It is only shown to authenticated accounts:
// guests can still build up a local cart (Requirement 3.6), but the
// indicator itself is reserved for signed-in Khách_Hàng to avoid implying
// a persistent cart before there is an account to attach it to.
// Requirements: 3.1, 6.1, 6.2, 6.5, 11.1, 11.2, 11.3
function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isAuthenticated = useAccountStore((state) => state.isAuthenticated)
  const account = useAccountStore((state) => state.account)
  const logout = useAccountStore((state) => state.logout)
  const itemCount = useCartStore((state) => state.itemCount)

  // Only pre-fill the header search box from the URL on the search page
  // itself; other pages (e.g. a Danh_Mục page with its own "categoryId"
  // param) should not leak unrelated query params into the search box.
  const initialKeyword = useMemo(() => {
    if (location.pathname !== '/search') {
      return ''
    }
    return searchParams.get('keyword') ?? ''
  }, [location.pathname, searchParams])

  function handleLogout() {
    logout()
    notifySuccess('Đã đăng xuất.')
    navigate('/')
  }

  function handleSearch(keyword: string) {
    navigate(keyword ? `/search?keyword=${encodeURIComponent(keyword)}` : '/search')
  }

  return (
    <header className="app-header">
      <div className="app-header-content">
        <h1 className="app-header-title">
          <Link to="/" className="app-header-brand">
            <BallLogoIcon />
            LananhSport
          </Link>
        </h1>

        <SearchBar
          key={initialKeyword}
          initialKeyword={initialKeyword}
          onSearch={handleSearch}
          className="app-header-search"
        />

        <div className="app-header-actions">
          {isAuthenticated ? (
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
          ) : null}

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
      </div>
    </header>
  )
}

export default Header