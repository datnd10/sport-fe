import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '../../components/shared'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import './AuthForm.css'

// Trang Hồ sơ cá nhân (Profile page): view/update fullName, phone, address
// for the currently authenticated account via GET/PUT /api/account/me.
// Protected by the RequireAuth route guard (task 24.2).
// Requirements: 6.6
function ProfilePage() {
  const account = useAccountStore((state) => state.account)
  const refreshProfile = useAccountStore((state) => state.refreshProfile)
  const updateProfile = useAccountStore((state) => state.updateProfile)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const profile = account ?? (await refreshProfile())
        if (!isMounted) {
          return
        }
        setFullName(profile.fullName ?? '')
        setPhone(profile.phone ?? '')
        setAddress(profile.address ?? '')
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error, 'Không thể tải thông tin hồ sơ. Vui lòng thử lại.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
    // Only reload from the server once on mount; account is kept in sync
    // afterwards via the store once the update below succeeds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await updateProfile({
        fullName,
        phone: phone || undefined,
        address: address || undefined,
      })
      setSuccessMessage('Cập nhật hồ sơ thành công.')
      notifySuccess('Cập nhật hồ sơ thành công.')
    } catch (error) {
      const backendFieldErrors = getFieldErrors(error)
      if (backendFieldErrors.length > 0) {
        setFieldErrors(
          Object.fromEntries(backendFieldErrors.map((fieldError) => [fieldError.field, fieldError.message])),
        )
      }
      setFormError(getErrorMessage(error, 'Cập nhật hồ sơ không thành công. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Đang tải hồ sơ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Hồ sơ cá nhân</h1>

        {loadError ? <p className="auth-form-error">{loadError}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" value={account?.email ?? ''} disabled readOnly />
          </div>

          <div className="auth-field">
            <label htmlFor="profile-fullName">Họ tên</label>
            <input
              id="profile-fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
            {fieldErrors.fullName ? <span className="auth-field-error">{fieldErrors.fullName}</span> : null}
          </div>

          <div className="auth-field">
            <label htmlFor="profile-phone">Số điện thoại</label>
            <input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            {fieldErrors.phone ? <span className="auth-field-error">{fieldErrors.phone}</span> : null}
          </div>

          <div className="auth-field">
            <label htmlFor="profile-address">Địa chỉ</label>
            <input
              id="profile-address"
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
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage
