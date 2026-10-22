import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/shared'
import { BallLogoIcon, CheckCircleIcon, EyeIcon, EyeOffIcon } from '../../components/shared/icons'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import './AuthForm.css'

// Đăng ký (Registration) page for new Khách_Hàng accounts.
// Requirements: 6.1, 6.2
function RegisterPage() {
  const navigate = useNavigate()
  const register = useAccountStore((state) => state.register)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setFieldErrors({})

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp' })
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        email,
        password,
        fullName,
        phone: phone || undefined,
        address: address || undefined,
      })
      setSuccessMessage('Đăng ký thành công. Đang chuyển đến trang đăng nhập...')
      notifySuccess('Đăng ký thành công. Vui lòng đăng nhập.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (error) {
      const backendFieldErrors = getFieldErrors(error)
      if (backendFieldErrors.length > 0) {
        setFieldErrors(
          Object.fromEntries(backendFieldErrors.map((fieldError) => [fieldError.field, fieldError.message])),
        )
      }
      setFormError(getErrorMessage(error, 'Đăng ký không thành công. Vui lòng thử lại.'))
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
          <h2>Gia nhập cộng đồng LananhSport</h2>
          <p>Tạo tài khoản miễn phí để mua sắm nhanh hơn, lưu địa chỉ giao hàng và theo dõi mọi đơn hàng của bạn.</p>
        </div>
        <ul className="auth-brand-highlights">
          <li>
            <CheckCircleIcon />
            Thanh toán nhanh với thông tin đã lưu sẵn
          </li>
          <li>
            <CheckCircleIcon />
            Nhận thông báo ưu đãi và sản phẩm mới
          </li>
          <li>
            <CheckCircleIcon />
            Quản lý đơn hàng và lịch sử mua sắm tại một nơi
          </li>
        </ul>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-card-brand-mobile">
            <BallLogoIcon />
            LananhSport
          </div>
          <h1>Đăng ký tài khoản</h1>
          <p className="auth-card-subtitle">Điền thông tin bên dưới để bắt đầu mua sắm.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="register-fullName">Họ tên</label>
              <input
                id="register-fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                aria-invalid={Boolean(fieldErrors.fullName)}
              />
              {fieldErrors.fullName ? <span className="auth-field-error">{fieldErrors.fullName}</span> : null}
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? <span className="auth-field-error">{fieldErrors.email}</span> : null}
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Mật khẩu</label>
              <div className="auth-password-wrap">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  aria-invalid={Boolean(fieldErrors.password)}
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
              {fieldErrors.password ? <span className="auth-field-error">{fieldErrors.password}</span> : null}
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirmPassword">Xác nhận mật khẩu</label>
              <div className="auth-password-wrap">
                <input
                  id="register-confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.confirmPassword ? (
                <span className="auth-field-error">{fieldErrors.confirmPassword}</span>
              ) : null}
            </div>

            <div className="auth-form-row">
              <div className="auth-field">
                <label htmlFor="register-phone">Số điện thoại</label>
                <input
                  id="register-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
                {fieldErrors.phone ? <span className="auth-field-error">{fieldErrors.phone}</span> : null}
              </div>

              <div className="auth-field">
                <label htmlFor="register-address">Địa chỉ</label>
                <input
                  id="register-address"
                  type="text"
                  autoComplete="street-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.address)}
                />
                {fieldErrors.address ? <span className="auth-field-error">{fieldErrors.address}</span> : null}
              </div>
            </div>

            {formError ? (
              <p className="auth-form-error" role="alert">
                {formError}
              </p>
            ) : null}
            {successMessage ? <p className="auth-form-success">{successMessage}</p> : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>
          </form>

          <p className="auth-card-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
