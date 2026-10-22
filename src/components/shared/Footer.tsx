import { Link } from 'react-router-dom'
import { BallLogoIcon } from './icons'
import './Footer.css'

// Shared Footer shown at the bottom of every Storefront page: shop
// blurb, quick links back into the Danh_Mục/trang chủ, and placeholder
// contact info. Purely presentational — no data fetching.
// Requirements: 11.1, 11.2, 11.3
function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <div className="app-footer-section app-footer-brand">
          <Link to="/" className="app-footer-brand-link">
            <BallLogoIcon />
            <span className="app-footer-title">LananhSport</span>
          </Link>
          <p className="app-footer-text">
            Chuyên cung cấp dụng cụ và trang phục thể thao chất lượng: bóng, giày, vợt, quần áo tập luyện cho mọi
            môn thể thao.
          </p>
        </div>

        <div className="app-footer-section">
          <p className="app-footer-heading">Liên kết nhanh</p>
          <nav className="app-footer-links">
            <Link to="/">Trang chủ</Link>
            <Link to="/search">Tất cả sản phẩm</Link>
            <Link to="/login">Đăng nhập</Link>
            <Link to="/register">Đăng ký</Link>
          </nav>
        </div>

        <div className="app-footer-section">
          <p className="app-footer-heading">Liên hệ</p>
          <ul className="app-footer-contact">
            <li>Địa chỉ: 123 Đường Thể Thao, Quận 1, TP.HCM</li>
            <li>Hotline: 1900 1234</li>
            <li>Email: lananhsport.hotro@gmail.com</li>
          </ul>
        </div>
      </div>

      <div className="app-footer-bottom">
        <p>&copy; {currentYear} LananhSport. Đã đăng ký bản quyền.</p>
      </div>
    </footer>
  )
}

export default Footer