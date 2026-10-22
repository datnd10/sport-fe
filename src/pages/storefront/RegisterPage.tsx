import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/shared'
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
      <div className="auth-card">
        <h1>Đăng ký tài khoản</h1>
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
            />
            {fieldErrors.email ? <span className="auth-field-error">{fieldErrors.email}</span> : null}
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Mật khẩu</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
            {fieldErrors.password ? <span className="auth-field-error">{fieldErrors.password}</span> : null}
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirmPassword">Xác nhận mật khẩu</label>
            <input
              id="register-confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
            />
            {fieldErrors.confirmPassword ? (
              <span className="auth-field-error">{fieldErrors.confirmPassword}</span>
            ) : null}
          </div>

          <div className="auth-field">
            <label htmlFor="register-phone">Số điện thoại</label>
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
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
            />
            {fieldErrors.address ? <span className="auth-field-error">{fieldErrors.address}</span> : null}
          </div>

          {formError ? <p className="auth-form-error">{formError}</p> : null}
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
  )
}

export default RegisterPage
