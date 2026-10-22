import { type FormEvent, useEffect, useState } from 'react'
import { Button, Modal } from '../../components/shared'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import adminCategoryService from '../../services/adminCategoryService'
import type { CategoryResponse } from '../../services/productService.types'
import { notifySuccess } from '../../services/toast'
import './AdminForms.css'

/**
 * Modal sửa tên Danh_Mục, mở trực tiếp từ trang danh sách
 * (AdminCategoryPage) bằng icon bút chì. Danh_Mục chỉ có một trường có
 * thể sửa (tên) — không có nút xóa vì Sản_Phẩm có thể tham chiếu đến
 * Danh_Mục. Lỗi trùng tên từ server (ConflictException, fieldErrors)
 * được hiển thị ngay dưới trường tên.
 *
 * `category` điều khiển việc mở modal: khi chuyển từ null sang có giá
 * trị, modal nạp lại tên hiện tại vào form.
 */
function CategoryEditModal({
  category,
  onClose,
  onUpdated,
}: {
  category: CategoryResponse | null
  onClose: () => void
  onUpdated: (updated: CategoryResponse) => void
}) {
  const [name, setName] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setFieldErrors({})
      setFormError(null)
    }
  }, [category])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    if (!category) {
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      setFieldErrors({ name: 'Tên Danh_Mục không được để trống' })
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await adminCategoryService.updateCategory(category.id, { name: trimmedName })
      onUpdated(updated)
      notifySuccess('Đã cập nhật danh mục.')
    } catch (error) {
      const backendFieldErrors = getFieldErrors(error)
      if (backendFieldErrors.length > 0) {
        setFieldErrors(Object.fromEntries(backendFieldErrors.map((fieldError) => [fieldError.field, fieldError.message])))
      }
      setFormError(getErrorMessage(error, 'Sửa danh mục không thành công. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={category !== null} onClose={onClose} title={category ? `Sửa danh mục: ${category.name}` : 'Sửa danh mục'}>
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-field">
          <label htmlFor="edit-category-name">Tên danh mục</label>
          <input
            id="edit-category-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          {fieldErrors.name ? <span className="admin-field-error">{fieldErrors.name}</span> : null}
        </div>

        {formError ? <p className="admin-form-error">{formError}</p> : null}

        <div className="admin-form-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CategoryEditModal
