import { type FormEvent, useEffect, useState } from 'react'
import { Button, Modal } from '../../components/shared'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import discountService from '../../services/discountService'
import type { DiscountCodeResponse, DiscountType } from '../../services/discountService.types'
import './AdminForms.css'

const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Theo phần trăm (%)',
  FIXED_AMOUNT: 'Số tiền cố định (VNĐ)',
}

// Converts a <input type="datetime-local"> value (local time, no
// timezone) into an ISO-8601 instant string the backend's
// DiscountCodeCreateRequest (validFrom/validTo: Instant) can parse.
function toInstantString(datetimeLocalValue: string): string {
  return new Date(datetimeLocalValue).toISOString()
}

/**
 * Modal tạo mới Mã_Giảm_Giá, mở trực tiếp từ trang danh sách
 * (AdminDiscountPage) để tránh phải cuộn qua một form inline cố định
 * phía trên bảng. Giữ nguyên toàn bộ hành vi validate/submit trước đây
 * của AdminDiscountPage: mã, loại/giá trị giảm, thời hạn hiệu lực và số
 * lần sử dụng tối đa (Requirement 8.1), từ chối mã đã tồn tại thông qua
 * lỗi trả về từ backend (Requirement 8.2).
 */
function DiscountCreateModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onCreated: (created: DiscountCodeResponse) => void
}) {
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [maxUsage, setMaxUsage] = useState('1')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset the form each time the modal is (re)opened so a previous
  // create doesn't leave stale values behind.
  useEffect(() => {
    if (isOpen) {
      setCode('')
      setDiscountType('PERCENTAGE')
      setDiscountValue('')
      setValidFrom('')
      setValidTo('')
      setMaxUsage('1')
      setFieldErrors({})
      setFormError(null)
    }
  }, [isOpen])

  function validateForm(): Record<string, string> {
    const errors: Record<string, string> = {}

    if (!code.trim()) {
      errors.code = 'Mã_Giảm_Giá không được để trống'
    }
    if (!discountValue || Number(discountValue) <= 0) {
      errors.discountValue = 'Giá trị giảm giá phải lớn hơn 0'
    }
    if (!validFrom) {
      errors.validFrom = 'Thời điểm bắt đầu hiệu lực không được để trống'
    }
    if (!validTo) {
      errors.validTo = 'Thời điểm hết hiệu lực không được để trống'
    }
    if (validFrom && validTo && new Date(validFrom).getTime() >= new Date(validTo).getTime()) {
      errors.validTo = 'Thời điểm hết hiệu lực phải sau thời điểm bắt đầu'
    }
    if (!maxUsage || Number(maxUsage) < 1) {
      errors.maxUsage = 'Số lần sử dụng tối đa phải lớn hơn hoặc bằng 1'
    }

    return errors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const errors = validateForm()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const created = await discountService.createDiscountCode({
        code: code.trim(),
        discountType,
        discountValue: Number(discountValue),
        validFrom: toInstantString(validFrom),
        validTo: toInstantString(validTo),
        maxUsage: Number(maxUsage),
      })
      onCreated(created)
    } catch (error) {
      const backendFieldErrors = getFieldErrors(error)
      if (backendFieldErrors.length > 0) {
        setFieldErrors(Object.fromEntries(backendFieldErrors.map((fieldError) => [fieldError.field, fieldError.message])))
      }
      setFormError(getErrorMessage(error, 'Tạo Mã_Giảm_Giá không thành công. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Mã_Giảm_Giá mới">
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <div className="admin-form-field">
            <label htmlFor="discount-code">Mã giảm giá</label>
            <input
              id="discount-code"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
            {fieldErrors.code ? <span className="admin-field-error">{fieldErrors.code}</span> : null}
          </div>

          <div className="admin-form-field">
            <label htmlFor="discount-type">Loại giảm giá</label>
            <select
              id="discount-type"
              value={discountType}
              onChange={(event) => setDiscountType(event.target.value as DiscountType)}
            >
              <option value="PERCENTAGE">{DISCOUNT_TYPE_LABELS.PERCENTAGE}</option>
              <option value="FIXED_AMOUNT">{DISCOUNT_TYPE_LABELS.FIXED_AMOUNT}</option>
            </select>
          </div>

          <div className="admin-form-field">
            <label htmlFor="discount-value">Giá trị giảm giá</label>
            <input
              id="discount-value"
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
              required
            />
            {fieldErrors.discountValue ? (
              <span className="admin-field-error">{fieldErrors.discountValue}</span>
            ) : null}
          </div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-field">
            <label htmlFor="discount-valid-from">Hiệu lực từ</label>
            <input
              id="discount-valid-from"
              type="datetime-local"
              value={validFrom}
              onChange={(event) => setValidFrom(event.target.value)}
              required
            />
            {fieldErrors.validFrom ? <span className="admin-field-error">{fieldErrors.validFrom}</span> : null}
          </div>

          <div className="admin-form-field">
            <label htmlFor="discount-valid-to">Hiệu lực đến</label>
            <input
              id="discount-valid-to"
              type="datetime-local"
              value={validTo}
              onChange={(event) => setValidTo(event.target.value)}
              required
            />
            {fieldErrors.validTo ? <span className="admin-field-error">{fieldErrors.validTo}</span> : null}
          </div>

          <div className="admin-form-field">
            <label htmlFor="discount-max-usage">Số lần sử dụng tối đa</label>
            <input
              id="discount-max-usage"
              type="number"
              min="1"
              step="1"
              value={maxUsage}
              onChange={(event) => setMaxUsage(event.target.value)}
              required
            />
            {fieldErrors.maxUsage ? <span className="admin-field-error">{fieldErrors.maxUsage}</span> : null}
          </div>
        </div>

        {formError ? <p className="admin-form-error">{formError}</p> : null}

        <div className="admin-form-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Tạo Mã_Giảm_Giá'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default DiscountCreateModal
