import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/shared'
import { BallLogoIcon, CheckCircleIcon, EyeIcon, EyeOffIcon } from '../../components/shared/icons'
import { getErrorMessage } from '../../services/apiError'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import './AuthForm.css'

interface LocationState {
  from?: { pathname: string; search?: string; hash?: string }
}

// Đăng nhập (Login) page. On success, stores the session via the account
// store and redirects to the page the user originally intended to visit
// (when redirected here by the route guard in task 24.2), or home.
// On failure, shows one generic message without revealing which field
// (email or password) was wrong (Requirement 6.4).
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAccountStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      const account = await login({ email, password })
      notifySuccess('Đăng nhập thành công.')

      // Quản_Trị_Viên (Admin) luôn vào thẳng trang Dashboard quản trị,
      // bỏ qua redirect "from" location (vì location.state đó thường là
      // một trang storefront mà admin không cần quay lại).
      if (account.role === 'ADMIN') {
        navigate('/admin', { replace: true })
        return
      }

      const state = location.state as LocationState | null
      const from = state?.from
      const redirectTo = from?.pathname?.startsWith('/') && !from.pathname.startsWith('//')
        ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '/'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      // Deliberately generic: do not reveal whether the email or the
      // password was incorrect (Requirement 6.4).
      setFormError(getErrorMessage(error, 'Email hoặc mật khẩu không đúng.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <BallLogoIcon />
          LananhSport
        </div>
        <div className="auth-brand-heading">
          <h2>Chào mừng trở lại!</h2>
          <p>Đăng nhập để tiếp tục mua sắm, theo dõi đơn hàng và nhận các ưu đãi dành riêng cho bạn.</p>
        </div>
        <ul className="auth-brand-highlights">
          <li>
            <CheckCircleIcon />
            Hàng ngàn sản phẩm thể thao chính hãng
          </li>
          <li>
            <CheckCircleIcon />
            Theo dõi đơn hàng và lịch sử mua sắm dễ dàng
          </li>
          <li>
            <CheckCircleIcon />
            Ưu đãi và mã giảm giá dành riêng cho thành viên
          </li>
        </ul>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-card-brand-mobile">
            <BallLogoIcon />
            LananhSport
          </div>
          <h1>Đăng nhập</h1>
          <p className="auth-card-subtitle">Nhập thông tin tài khoản để tiếp tục.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Mật khẩu</label>
              <div className="auth-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {formError ? (
              <p className="auth-form-error" role="alert">
                {formError}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <p className="auth-card-footer">
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
