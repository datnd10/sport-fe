import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Footer, Header } from '../../components/shared'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import '../../components/shared/Skeleton.css'
import './ProfilePage.css'
import ChangePasswordForm from './ChangePasswordForm'

type ProfileFields = { fullName: string; phone: string; address: string }
const emptyFields: ProfileFields = { fullName: '', phone: '', address: '' }
function ProfilePage() {
  const account = useAccountStore((state) => state.account)
  const refreshProfile = useAccountStore((state) => state.refreshProfile)
  const updateProfile = useAccountStore((state) => state.updateProfile)
  const [fields, setFields] = useState<ProfileFields>(emptyFields)
  const [saved, setSaved] = useState<ProfileFields>(emptyFields)
  const [isLoading, setIsLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dirty = fields.fullName !== saved.fullName || fields.phone !== saved.phone || fields.address !== saved.address

  useEffect(() => {
    let active = true
    async function load() {
      setIsLoading(true)
      try {
        const profile = useAccountStore.getState().account ?? await refreshProfile()
        if (active) {
          const values = { fullName: profile.fullName ?? '', phone: profile.phone ?? '', address: profile.address ?? '' }
          setFields(values); setSaved(values); setLoadError(null)
        }
      } catch (error) { if (active) setLoadError(getErrorMessage(error, 'Không thể tải hồ sơ. Vui lòng thử lại.')) }
      finally { if (active) setIsLoading(false) }
    }
    load()
    return () => { active = false }
  }, [refreshProfile, retry])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting || !dirty) return
    if (!fields.fullName.trim()) { setFieldErrors({ fullName: 'Vui lòng nhập họ tên.' }); return }
    setFormError(null); setSuccessMessage(null); setFieldErrors({}); setIsSubmitting(true)
    try {
      const profile = await updateProfile({ fullName: fields.fullName.trim(), phone: fields.phone.trim(), address: fields.address.trim() })
      const values = { fullName: profile.fullName ?? '', phone: profile.phone ?? '', address: profile.address ?? '' }
      setFields(values); setSaved(values)
      setSuccessMessage('Đã lưu thông tin của bạn.')
      notifySuccess('Cập nhật hồ sơ thành công.')
    } catch (error) {
      setFieldErrors(Object.fromEntries(getFieldErrors(error).map((field) => [field.field, field.message])))
      setFormError(getErrorMessage(error, 'Không thể lưu thông tin. Vui lòng thử lại.'))
    } finally { setIsSubmitting(false) }
  }
  function change(field: keyof ProfileFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
    setSuccessMessage(null)
  }

  return <div className="profile-page">
    <Header />
    <main className="profile-content">
      <nav className="profile-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Thông tin cá nhân</span></nav>
      <div className="profile-heading"><span>LANANHSPORT</span><h2>Tài khoản của bạn</h2><p>Quản lý thông tin cá nhân và thông tin liên hệ.</p></div>
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-identity"><div className="profile-avatar" aria-hidden="true">{(account?.fullName?.trim() || account?.email || 'K')[0].toUpperCase()}</div><strong>{account?.fullName || 'Tài khoản'}</strong><span>{account?.email}</span></div>
          <nav aria-label="Quản lý tài khoản"><Link to="/account/profile" aria-current="page">Thông tin cá nhân <span aria-hidden="true">→</span></Link><Link to="/account/orders">Đơn hàng của tôi</Link><Link to="/cart">Giỏ hàng</Link></nav>
        </aside>
        <section className="profile-card" aria-labelledby="profile-form-heading" aria-busy={isLoading}>
          <div className="profile-card-heading"><h3 id="profile-form-heading">Chỉnh sửa thông tin</h3><p>Thông tin liên hệ giúp bạn thuận tiện hơn khi đặt hàng.</p></div>
          {isLoading ? <div className="profile-skeleton"><span role="status" className="profile-loading-label">Đang tải hồ sơ...</span><div aria-hidden="true">{[0, 1, 2, 3].map((index) => <div key={index} className="skeleton-block profile-skeleton-field" />)}</div></div>
            : loadError ? <div className="profile-feedback profile-error" role="alert"><p>{loadError}</p><Button onClick={() => setRetry((value) => value + 1)}>Thử lại</Button></div>
              : <form className="profile-form" onSubmit={handleSubmit}>
                <div className="profile-field"><label htmlFor="profile-email">Email đăng nhập</label><input id="profile-email" type="email" value={account?.email ?? ''} readOnly aria-describedby="profile-email-note" /><small id="profile-email-note">Email được dùng để đăng nhập và không thể thay đổi tại đây.</small></div>
                <fieldset disabled={isSubmitting} className="profile-editable">
                  <legend className="profile-loading-label">Thông tin cá nhân và liên hệ</legend>
                  <div className="profile-field"><label htmlFor="profile-fullName">Họ và tên <span aria-hidden="true">*</span></label><input id="profile-fullName" autoComplete="name" value={fields.fullName} onChange={(event) => change('fullName', event.target.value)} required maxLength={255} aria-invalid={!!fieldErrors.fullName} aria-describedby={fieldErrors.fullName ? 'profile-name-error' : undefined} />{fieldErrors.fullName ? <small id="profile-name-error" className="profile-field-error">{fieldErrors.fullName}</small> : null}</div>
                  <div className="profile-field"><label htmlFor="profile-phone">Số điện thoại</label><input id="profile-phone" type="tel" autoComplete="tel" value={fields.phone} maxLength={30} placeholder="Nhập số điện thoại liên hệ" onChange={(event) => change('phone', event.target.value)} aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? 'profile-phone-error' : undefined} />{fieldErrors.phone ? <small id="profile-phone-error" className="profile-field-error">{fieldErrors.phone}</small> : null}</div>
                  <div className="profile-field profile-address"><label htmlFor="profile-address">Địa chỉ</label><textarea id="profile-address" autoComplete="street-address" value={fields.address} rows={3} maxLength={255} placeholder="Số nhà, tên đường, phường/xã, tỉnh/thành phố" onChange={(event) => change('address', event.target.value)} aria-invalid={!!fieldErrors.address} aria-describedby={fieldErrors.address ? 'profile-address-error' : undefined} />{fieldErrors.address ? <small id="profile-address-error" className="profile-field-error">{fieldErrors.address}</small> : null}</div>
                </fieldset>
                {formError ? <p className="profile-feedback profile-error" role="alert">{formError}</p> : null}
                {successMessage ? <p className="profile-feedback profile-success" role="status">{successMessage}</p> : null}
                <div className="profile-form-actions"><span>{dirty ? 'Bạn có thay đổi chưa lưu.' : 'Thông tin của bạn đã được cập nhật.'}</span><div><Button variant="ghost" disabled={!dirty || isSubmitting} onClick={() => { setFields(saved); setFieldErrors({}); setFormError(null); setSuccessMessage(null) }}>Hủy thay đổi</Button><Button type="submit" disabled={!dirty || isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</Button></div></div>
              </form>}
          {!isLoading && !loadError ? <ChangePasswordForm /> : null}
        </section>
      </div>
    </main>
    <Footer />
  </div>
}
export default ProfilePage
