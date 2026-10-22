import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import './AuthForm.css'

interface LocationState {
  from?: { pathname: string }
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
      const redirectTo = state?.from?.pathname ?? '/'
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
      <div className="auth-card">
        <h1>Đăng nhập</h1>
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
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {formError ? <p className="auth-form-error">{formError}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>

        <p className="auth-card-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
