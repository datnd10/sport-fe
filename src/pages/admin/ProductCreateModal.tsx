import { type FormEvent, useEffect, useState } from 'react'
import { Button, CurrencyInput, Modal } from '../../components/shared'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import adminProductService from '../../services/adminProductService'
import type { CategoryResponse, ProductResponse } from '../../services/productService.types'
import './AdminForms.css'

interface DraftVariant {
  sku: string
  attributes: string
  price: string
  stockQuantity: string
  lowStockThreshold: string
}

function createEmptyVariant(): DraftVariant {
  return { sku: '', attributes: '', price: '', stockQuantity: '', lowStockThreshold: '' }
}

/**
 * Modal tạo mới Sản_Phẩm, mở trực tiếp từ trang danh sách
 * (AdminProductListPage) để tránh phải điều hướng sang trang riêng. Tái
 * dùng đúng hành vi validate/submit "create mode" của
 * AdminProductFormPage (Requirement 1.2, 1.6): tên, Danh_Mục, giá cơ
 * bản, mô tả, và danh sách Biến_Thể_Sản_Phẩm khởi tạo.
 *
 * Ảnh CÓ THỂ chọn ngay trong modal này (input file, preview tên/ảnh
 * tạm qua URL.createObjectURL), nhưng việc upload thật sự lên server
 * chỉ xảy ra SAU KHI tạo Sản_Phẩm thành công (cần productId từ response
 * createProduct) — gọi uploadImages ngay trong handleSubmit. Nếu bước
 * tạo Sản_Phẩm thành công nhưng upload ảnh lỗi, modal KHÔNG rollback
 * Sản_Phẩm đã tạo; thay vào đó hiển thị cảnh báo rõ ràng và chờ Admin tự
 * đóng modal, để họ biết cần vào sửa sản phẩm và tải ảnh lại.
 *
 * Logic core fields/variants này được giữ riêng (duplicate có kiểm
 * soát) khỏi AdminProductFormPage thay vì extract dùng chung, để không
 * tăng rủi ro cho trang edit hiện có — AdminProductFormPage vẫn giữ
 * nguyên hành vi tạo mới khi được truy cập trực tiếp qua route
 * /admin/products/new.
 */
function ProductCreateModal({
  isOpen,
  categories,
  onClose,
  onCreated,
}: {
  isOpen: boolean
  categories: CategoryResponse[]
  onClose: () => void
  onCreated: (created: ProductResponse) => void
}) {
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [draftVariants, setDraftVariants] = useState<DraftVariant[]>([createEmptyVariant()])
  // Ảnh được chọn trước khi Sản_Phẩm tồn tại. Chỉ lưu trong state dạng
  // File[] để preview tên/ảnh tạm (URL.createObjectURL) — việc upload
  // thật sự lên server chỉ xảy ra sau khi createProduct trả về productId.
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([])

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [imageUploadWarning, setImageUploadWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Khi khác null, Sản_Phẩm đã được tạo thành công nhưng upload ảnh bị
  // lỗi — modal chuyển sang chỉ hiển thị cảnh báo + nút đóng, để Admin
  // có thời gian đọc trước khi danh sách được refresh.
  const [createdProduct, setCreatedProduct] = useState<ProductResponse | null>(null)
  // Temporary preview URLs for selectedImageFiles, created with
  // URL.createObjectURL so the Admin can see a thumbnail before the
  // product (and thus the real upload) exists. Must be revoked whenever
  // the underlying file list changes or the component unmounts, to
  // avoid leaking blob URLs.
  const [selectedImagePreviewUrls, setSelectedImagePreviewUrls] = useState<string[]>([])

  // Reset the form each time the modal is (re)opened so a previous
  // create doesn't leave stale values behind.
  useEffect(() => {
    if (isOpen) {
      setCategoryId(categories[0]?.id ?? '')
      setName('')
      setDescription('')
      setBasePrice('')
      setDraftVariants([createEmptyVariant()])
      setSelectedImageFiles([])
      setFieldErrors({})
      setFormError(null)
      setImageUploadWarning(null)
      setCreatedProduct(null)
    }
  }, [isOpen, categories])

  // Create/revoke object URLs whenever the selected file list changes,
  // so each thumbnail preview stays in sync and no blob URL leaks.
  useEffect(() => {
    const urls = selectedImageFiles.map((file) => URL.createObjectURL(file))
    setSelectedImagePreviewUrls(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [selectedImageFiles])

  function updateDraftVariant(index: number, patch: Partial<DraftVariant>) {
    setDraftVariants((previous) => previous.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)))
  }

  function addDraftVariantRow() {
    setDraftVariants((previous) => [...previous, createEmptyVariant()])
  }

  function removeDraftVariantRow(index: number) {
    setDraftVariants((previous) => (previous.length > 1 ? previous.filter((_, i) => i !== index) : previous))
  }

  function handleSelectImageFiles(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const files = input.files ? Array.from(input.files) : []
    if (files.length > 0) {
      setSelectedImageFiles((previous) => [...previous, ...files])
    }
    input.value = ''
  }

  function removeSelectedImageFile(index: number) {
    setSelectedImageFiles((previous) => previous.filter((_, i) => i !== index))
  }

  function validateCoreFields(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!name.trim()) {
      errors.name = 'Tên Sản_Phẩm không được để trống'
    }
    const priceValue = Number(basePrice)
    if (!basePrice || Number.isNaN(priceValue) || priceValue <= 0) {
      errors.basePrice = 'Giá Sản_Phẩm phải lớn hơn 0'
    }
    if (!categoryId) {
      errors.categoryId = 'Danh_Mục không được để trống'
    }
    return errors
  }

  function validateDraftVariants(): string | null {
    for (const variant of draftVariants) {
      if (!variant.sku.trim()) {
        return 'Mỗi Biến_Thể_Sản_Phẩm cần có mã SKU.'
      }
      const price = Number(variant.price)
      if (!variant.price || Number.isNaN(price) || price <= 0) {
        return `Giá của Biến_Thể_Sản_Phẩm "${variant.sku}" phải lớn hơn 0.`
      }
      const stock = Number(variant.stockQuantity)
      if (variant.stockQuantity === '' || Number.isNaN(stock) || stock < 0) {
        return `Số lượng Tồn_Kho của Biến_Thể_Sản_Phẩm "${variant.sku}" không hợp lệ.`
      }
    }
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setImageUploadWarning(null)

    const coreErrors = validateCoreFields()
    if (Object.keys(coreErrors).length > 0) {
      setFieldErrors(coreErrors)
      return
    }

    const variantValidationError = validateDraftVariants()
    if (variantValidationError) {
      setFormError(variantValidationError)
      return
    }

    setIsSubmitting(true)
    try {
      const created = await adminProductService.createProduct({
        categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        basePrice: Number(basePrice),
        variants: draftVariants.map((variant) => ({
          sku: variant.sku.trim(),
          attributes: variant.attributes.trim() || undefined,
          price: Number(variant.price),
          stockQuantity: Number(variant.stockQuantity),
          lowStockThreshold: variant.lowStockThreshold ? Number(variant.lowStockThreshold) : undefined,
        })),
      })

      // Sản_Phẩm đã tạo thành công tại đây. Ảnh (nếu có chọn) chỉ có thể
      // upload sau khi có productId — nếu upload lỗi, KHÔNG rollback
      // Sản_Phẩm đã tạo, chỉ báo lỗi để Admin biết vào sửa lại ảnh sau,
      // và KHÔNG tự đóng modal để Admin có thời gian đọc cảnh báo.
      if (selectedImageFiles.length > 0) {
        try {
          await adminProductService.uploadImages(created.id, selectedImageFiles)
        } catch (imageError) {
          setImageUploadWarning(
            `Sản phẩm "${created.name}" đã được tạo thành công, nhưng tải ảnh lên không thành công: ` +
              getErrorMessage(imageError, 'Vui lòng kiểm tra định dạng/kích thước ảnh.') +
              ' Bạn có thể vào sửa sản phẩm để tải ảnh lại sau.',
          )
          setCreatedProduct(created)
          return
        }
      }

      onCreated(created)
    } catch (error) {
      const backendFieldErrors = getFieldErrors(error)
      if (backendFieldErrors.length > 0) {
        setFieldErrors(Object.fromEntries(backendFieldErrors.map((fieldError) => [fieldError.field, fieldError.message])))
      }
      setFormError(getErrorMessage(error, 'Tạo sản phẩm không thành công. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleAcknowledgeImageWarning() {
    if (createdProduct) {
      onCreated(createdProduct)
    }
  }

  // Sản_Phẩm đã tạo thành công nhưng upload ảnh lỗi: chỉ hiển thị cảnh
  // báo + nút đóng, không còn hiển thị lại form tạo (đã tạo xong rồi).
  if (createdProduct) {
    return (
      <Modal isOpen={isOpen} onClose={handleAcknowledgeImageWarning} title="Thêm sản phẩm mới">
        <div className="admin-form">
          <p className="admin-form-error">{imageUploadWarning}</p>
          <div className="admin-form-actions">
            <Button type="button" onClick={handleAcknowledgeImageWarning}>
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm sản phẩm mới">
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <div className="admin-form-field">
            <label htmlFor="create-product-name">Tên sản phẩm</label>
            <input
              id="create-product-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            {fieldErrors.name ? <span className="admin-field-error">{fieldErrors.name}</span> : null}
          </div>

          <div className="admin-form-field">
            <label htmlFor="create-product-category">Danh mục</label>
            <select
              id="create-product-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
            >
              <option value="" disabled>
                -- Chọn danh mục --
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId ? <span className="admin-field-error">{fieldErrors.categoryId}</span> : null}
          </div>

          <div className="admin-form-field">
            <label htmlFor="create-product-price">Giá cơ bản</label>
            <CurrencyInput id="create-product-price" min={0} value={basePrice} onChange={setBasePrice} required />
            {fieldErrors.basePrice ? <span className="admin-field-error">{fieldErrors.basePrice}</span> : null}
          </div>
        </div>

        <div className="admin-form-field">
          <label htmlFor="create-product-description">Mô tả</label>
          <textarea
            id="create-product-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div>
          <h4>Biến thể sản phẩm khởi tạo</h4>
          {draftVariants.map((variant, index) => (
            <div className="admin-form-row" key={index} style={{ marginBottom: '0.75rem' }}>
              <div className="admin-form-field">
                <label htmlFor={`create-variant-sku-${index}`}>SKU</label>
                <input
                  id={`create-variant-sku-${index}`}
                  type="text"
                  value={variant.sku}
                  onChange={(event) => updateDraftVariant(index, { sku: event.target.value })}
                  placeholder="VD: AOTHUN-M-XANH"
                  required
                />
                <small className="admin-field-hint">
                  Mã riêng biệt để quản lý từng biến thể, ví dụ: AOTHUN-M-XANH
                </small>
              </div>
              <div className="admin-form-field">
                <label htmlFor={`create-variant-attributes-${index}`}>Thuộc tính (size/màu...)</label>
                <input
                  id={`create-variant-attributes-${index}`}
                  type="text"
                  value={variant.attributes}
                  onChange={(event) => updateDraftVariant(index, { attributes: event.target.value })}
                  placeholder="VD: Size: M, Màu: Xanh"
                />
                <small className="admin-field-hint">
                  Đặc điểm phân biệt biến thể này, ví dụ: Size: M, Màu: Xanh
                </small>
              </div>
              <div className="admin-form-field">
                <label htmlFor={`create-variant-price-${index}`}>Giá</label>
                <CurrencyInput
                  id={`create-variant-price-${index}`}
                  min={0}
                  value={variant.price}
                  onChange={(rawValue) => updateDraftVariant(index, { price: rawValue })}
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor={`create-variant-stock-${index}`}>Tồn kho khởi tạo</label>
                <input
                  id={`create-variant-stock-${index}`}
                  type="number"
                  min="0"
                  value={variant.stockQuantity}
                  onChange={(event) => updateDraftVariant(index, { stockQuantity: event.target.value })}
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor={`create-variant-threshold-${index}`}>Ngưỡng sắp hết hàng</label>
                <input
                  id={`create-variant-threshold-${index}`}
                  type="number"
                  min="0"
                  value={variant.lowStockThreshold}
                  onChange={(event) => updateDraftVariant(index, { lowStockThreshold: event.target.value })}
                />
                <small className="admin-field-hint">
                  Khi tồn kho giảm xuống dưới số này, hệ thống sẽ cảnh báo sắp hết hàng
                </small>
              </div>
              <div className="admin-form-field">
                <label>&nbsp;</label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeDraftVariantRow(index)}
                  disabled={draftVariants.length === 1}
                >
                  Xóa dòng
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addDraftVariantRow}>
            Thêm biến thể
          </Button>
        </div>

        <div className="admin-form-field">
          <label htmlFor="create-product-images">Hình ảnh sản phẩm</label>
          <input
            id="create-product-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleSelectImageFiles}
          />
          <small className="admin-field-hint">
            Ảnh được chọn ở đây sẽ chỉ tải lên sau khi sản phẩm được tạo thành công.
          </small>
          {selectedImageFiles.length > 0 ? (
            <ul className="admin-selected-files">
              {selectedImageFiles.map((file, index) => (
                <li className="admin-selected-file-item" key={`${file.name}-${index}`}>
                  {selectedImagePreviewUrls[index] ? (
                    <img className="admin-selected-file-thumb" src={selectedImagePreviewUrls[index]} alt={file.name} />
                  ) : null}
                  <span className="admin-selected-file-name">{file.name}</span>
                  <Button type="button" variant="ghost" onClick={() => removeSelectedImageFile(index)}>
                    Bỏ chọn
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {formError ? <p className="admin-form-error">{formError}</p> : null}

        <div className="admin-form-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Tạo sản phẩm'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ProductCreateModal
