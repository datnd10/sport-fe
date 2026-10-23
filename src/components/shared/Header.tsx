import { useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import Button from './Button'
import { BallLogoIcon } from './icons'
import SearchBar from './SearchBar'
import './Header.css'

function Header({ showSearch = false }: { showSearch?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isAuthenticated = useAccountStore((state) => state.isAuthenticated)
  const account = useAccountStore((state) => state.account)
  const logout = useAccountStore((state) => state.logout)
  const dropdown = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) dropdown.current.open = false
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && dropdown.current?.open) {
        dropdown.current.open = false
        dropdown.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [])
  function closeDropdown() { if (dropdown.current) dropdown.current.open = false }

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
    closeDropdown()
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

        {showSearch ? <SearchBar
          key={initialKeyword}
          initialKeyword={initialKeyword}
          onSearch={handleSearch}
          className="app-header-search"
        /> : null}

        <div className="app-header-actions">
          {isAuthenticated ? (
            <details className="account-dropdown" ref={dropdown}>
              <summary className="account-dropdown-trigger">
                <span className="account-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></span>
                <span className="account-greeting">Xin chào, <strong>{account?.fullName || account?.email || 'bạn'}</strong></span>
                <svg className="account-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </summary>
              <nav className="account-dropdown-panel" aria-label="Tài khoản">
                <Link to="/cart" onClick={closeDropdown}>Giỏ hàng</Link>
                <Link to="/account/orders" onClick={closeDropdown}>Đơn hàng của tôi</Link>
                <Link to="/account/profile" onClick={closeDropdown}>Chỉnh sửa thông tin</Link>
                {account?.role === 'ADMIN' ? <Link to="/admin" onClick={closeDropdown}>Quản trị cửa hàng</Link> : null}
                <button type="button" onClick={handleLogout}>Đăng xuất</button>
              </nav>
            </details>
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
