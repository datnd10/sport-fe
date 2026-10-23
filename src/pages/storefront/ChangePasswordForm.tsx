import { useState, type FormEvent } from 'react'
import { Button } from '../../components/shared'
import { EyeIcon, EyeOffIcon } from '../../components/shared/icons'
import accountService, { type ChangePasswordRequest } from '../../services/accountService'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'

const empty: ChangePasswordRequest = { currentPassword: '', newPassword: '', confirmPassword: '' }
const inputs = [
  { key: 'currentPassword', label: 'Mật khẩu hiện tại', autocomplete: 'current-password' },
  { key: 'newPassword', label: 'Mật khẩu mới', autocomplete: 'new-password' },
  { key: 'confirmPassword', label: 'Xác nhận mật khẩu mới', autocomplete: 'new-password' },
] as const

export default function ChangePasswordForm() {
  const [values, setValues] = useState(empty)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const hasInput = Object.values(values).some(Boolean)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSuccess(false); setError(null)
    const invalid: Record<string, string> = {}
    if (!values.currentPassword) invalid.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
    if (values.newPassword.length < 6) invalid.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.'
    else if (new TextEncoder().encode(values.newPassword).length > 72) invalid.newPassword = 'Mật khẩu quá dài. Tối đa 72 byte.'
    else if (values.newPassword === values.currentPassword) invalid.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.'
    if (values.newPassword !== values.confirmPassword) invalid.confirmPassword = 'Xác nhận mật khẩu mới không khớp.'
    setErrors(invalid)
    if (Object.keys(invalid).length) return
    setSaving(true)
    try {
      await accountService.changePassword(values)
      setValues(empty); setVisible({}); setSuccess(true)
    } catch (reason) {
      setErrors(Object.fromEntries(getFieldErrors(reason).map((field) => [field.field, field.message])))
      setError(getErrorMessage(reason, 'Không thể đổi mật khẩu. Vui lòng thử lại.'))
    } finally { setSaving(false) }
  }
  return <section className="profile-password-section" aria-labelledby="change-password-heading">
    <div className="profile-card-heading"><h3 id="change-password-heading">Đổi mật khẩu</h3><p>Nhập mật khẩu hiện tại để xác nhận. Mật khẩu mới có ít nhất 6 ký tự và khác mật khẩu cũ.</p></div>
    <form className="profile-form" onSubmit={submit}>
      <fieldset className="profile-password-fields" disabled={saving}>
        <legend className="profile-loading-label">Thông tin đổi mật khẩu</legend>
        {inputs.map(({ key, label, autocomplete }) => <div className="profile-field" key={key}>
          <label htmlFor={`password-${key}`}>{label}</label>
          <div className="profile-password-input"><input id={`password-${key}`} name={key} type={visible[key] ? 'text' : 'password'} autoComplete={autocomplete}
            value={values[key]} required minLength={key === 'currentPassword' ? undefined : 6} maxLength={key === 'currentPassword' ? 256 : 72}
            aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `password-error-${key}` : undefined}
            onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value })); setErrors((current) => ({ ...current, [key]: '' })); setSuccess(false); setError(null) }} />
            <button type="button" aria-label={`${visible[key] ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`} aria-pressed={!!visible[key]} onClick={() => setVisible((current) => ({ ...current, [key]: !current[key] }))}>{visible[key] ? <EyeOffIcon /> : <EyeIcon />}</button>
          </div>
          {errors[key] ? <small id={`password-error-${key}`} className="profile-field-error">{errors[key]}</small> : null}
        </div>)}
      </fieldset>
      {error ? <p role="alert" className="profile-feedback profile-error">{error}</p> : null}
      {success ? <p role="status" className="profile-feedback profile-success">Đổi mật khẩu thành công. Hãy dùng mật khẩu mới cho lần đăng nhập tiếp theo.</p> : null}
      <div className="profile-form-actions"><span>Xác nhận để cập nhật mật khẩu đăng nhập.</span><div>
        <Button variant="ghost" disabled={!hasInput || saving} onClick={() => { setValues(empty); setErrors({}); setError(null); setVisible({}); setSuccess(false) }}>Hủy nhập mật khẩu</Button>
        <Button type="submit" disabled={!hasInput || saving}>{saving ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}</Button>
      </div></div>
    </form>
  </section>
}
