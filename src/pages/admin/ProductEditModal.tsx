import { type FormEvent, useEffect, useState } from 'react'
import { Badge, Button, CurrencyInput, Modal, TrashIcon } from '../../components/shared'
import { resolveUploadUrl } from '../../services/apiClient'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import adminProductService from '../../services/adminProductService'
import categoryService from '../../services/categoryService'
import type { CategoryResponse, ProductDetailResponse, ProductResponse } from '../../services/productService.types'
import { notifySuccess } from '../../services/toast'
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

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

/**
 * Modal sửa Sản_Phẩm, mở trực tiếp từ trang danh sách
 * (AdminProductListPage) bằng icon bút chì, thay cho việc điều hướng
 * sang trang riêng /admin/products/:id/edit. Gộp lại đúng hành vi "edit
 * mode" của AdminProductFormPage: sửa thông tin cốt lõi (Requirement
 * 1.4), thêm Biến_Thể_Sản_Phẩm mới (Requirement 1.6, 1.7), và quản lý
 * Hình_Ảnh_Sản_Phẩm — xóa ảnh hiện có + tải ảnh mới lên (Requirement
 * 1.8, 1.9, 1.10).
 *
 * `productId` điều khiển việc mở modal: khi chuyển từ null sang có giá
 * trị, modal tải chi tiết Sản_Phẩm (core fields + variants + images).
 */
function ProductEditModal({
  productId,
  onClose,
  onUpdated,
}: {
  productId: string | null
  onClose: () => void
  onUpdated: (updated: ProductResponse) => void
}) {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [product, setProduct] = useState<ProductDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Core product fields
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New variant form
  const [newVariant, setNewVariant] = useState<DraftVariant>(createEmptyVariant())
  const [variantError, setVariantError] = useState<string | null>(null)
  const [isAddingVariant, setIsAddingVariant] = useState(false)

  // Soft-delete of an existing variant row. Only one row can be in the
  // "pending confirmation" state at a time; `pendingDeleteVariantId ===
  // null` means no row is awaiting confirmation. Mirrors the 2-step
  // confirm/cancel pattern used for product deletion in
  // AdminProductListPage, instead of a native window.confirm dialog.
  const [pendingDeleteVariantId, setPendingDeleteVariantId] = useState<string | null>(null)
  const [deleteVariantError, setDeleteVariantError] = useState<string | null>(null)

  // Image upload
  const [imageError, setImageError] = useState<string | null>(null)
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  useEffect(() => {
    if (!productId) {
      setProduct(null)
      return
    }

    const currentProductId = productId
    let isMounted = true

    async function loadData() {
      setIsLoading(true)
      setLoadError(null)
      setFormError(null)
      setFieldErrors({})
      setSuccessMessage(null)
      setVariantError(null)
      setImageError(null)
      setNewVariant(createEmptyVariant())
      setPendingDeleteVariantId(null)
      setDeleteVariantError(null)
      try {
        const categoryList = await categoryService.getCategories()
        if (!isMounted) {
          return
        }
        setCategories(categoryList)

        const detail = await adminProductService.getProductDetail(currentProductId)
        if (!isMounted) {
          return
        }
        setProduct(detail)
        setCategoryId(detail.category.id)
        setName(detail.name)
        setDescription(detail.description ?? '')
        setBasePrice(String(detail.basePrice))
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error, 'Không thể tải dữ liệu. Vui lòng thử lại.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [productId])

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

  async function submitCoreFields() {
    setFormError(null)
    setFieldErrors({})
    setSuccessMessage(null)

    if (!productId) {
      return
    }

    const coreErrors = validateCoreFields()
    if (Object.keys(coreErrors).length > 0) {
      setFieldErrors(coreErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await adminProductService.updateProduct(productId, {
        categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        basePrice: Number(basePrice),
      })
      setSuccessMessage('Cập nhật sản phẩm thành công.')
      onUpdated(updated)
    } catch (error) {
      const backendFieldErrors = getFieldErrors(error)
      if (backendFieldErrors.length > 0) {
        setFieldErrors(Object.fromEntries(backendFieldErrors.map((fieldError) => [fieldError.field, fieldError.message])))
      }
      setFormError(getErrorMessage(error, 'Lưu sản phẩm không thành công. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitCoreFields()
  }

  async function reloadProductDetail() {
    if (!productId) {
      return
    }
    const detail = await adminProductService.getProductDetail(productId)
    setProduct(detail)
  }

  async function handleAddVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setVariantError(null)

    if (!productId) {
      return
    }
    if (!newVariant.sku.trim()) {
      setVariantError('Mã SKU không được để trống.')
      return
    }
    const price = Number(newVariant.price)
    if (!newVariant.price || Number.isNaN(price) || price <= 0) {
      setVariantError('Giá Biến_Thể_Sản_Phẩm phải lớn hơn 0.')
      return
    }
    const stock = Number(newVariant.stockQuantity)
    if (newVariant.stockQuantity === '' || Number.isNaN(stock) || stock < 0) {
      setVariantError('Số lượng Tồn_Kho khởi tạo không được âm.')
      return
    }

    setIsAddingVariant(true)
    try {
      await adminProductService.addVariant(productId, {
        sku: newVariant.sku.trim(),
        attributes: newVariant.attributes.trim() || undefined,
        price,
        stockQuantity: stock,
        lowStockThreshold: newVariant.lowStockThreshold ? Number(newVariant.lowStockThreshold) : undefined,
      })
      setNewVariant(createEmptyVariant())
      await reloadProductDetail()
      notifySuccess('Đã thêm biến thể mới.')
    } catch (error) {
      setVariantError(getErrorMessage(error, 'Thêm biến thể không thành công. Vui lòng kiểm tra mã SKU.'))
    } finally {
      setIsAddingVariant(false)
    }
  }

  function handleRequestDeleteVariant(variantId: string) {
    setDeleteVariantError(null)
    setPendingDeleteVariantId(variantId)
  }

  function handleCancelDeleteVariant() {
    setPendingDeleteVariantId(null)
    setDeleteVariantError(null)
  }

  async function handleDeleteVariant(variantId: string) {
    setDeleteVariantError(null)

    if (!productId) {
      return
    }

    try {
      await adminProductService.deleteVariant(productId, variantId)
      await reloadProductDetail()
      setPendingDeleteVariantId(null)
      notifySuccess('Đã xóa biến thể.')
    } catch (error) {
      setDeleteVariantError(getErrorMessage(error, 'Xóa biến thể không thành công. Vui lòng thử lại.'))
    }
  }

  async function handleUploadImages(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const files = input.files ? Array.from(input.files) : []
    if (!productId || files.length === 0) {
      return
    }

    setImageError(null)
    setIsUploadingImages(true)
    try {
      await adminProductService.uploadImages(productId, files)
      await reloadProductDetail()
      notifySuccess('Đã tải lên hình ảnh.')
    } catch (error) {
      setImageError(getErrorMessage(error, 'Tải lên hình ảnh không thành công. Vui lòng kiểm tra định dạng và kích thước.'))
    } finally {
      setIsUploadingImages(false)
      input.value = ''
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!productId) {
      return
    }
    setImageError(null)
    try {
      await adminProductService.deleteImage(productId, imageId)
      await reloadProductDetail()
      notifySuccess('Đã xóa hình ảnh.')
    } catch (error) {
      setImageError(getErrorMessage(error, 'Xóa hình ảnh không thành công. Vui lòng thử lại.'))
    }
  }

  return (
    <Modal isOpen={productId !== null} onClose={onClose} title={product ? `Sửa sản phẩm: ${product.name}` : 'Sửa sản phẩm'}>
      {isLoading ? <p>Đang tải...</p> : null}
      {!isLoading && loadError ? <p className="admin-form-error">{loadError}</p> : null}

      {!isLoading && !loadError && product ? (
        <>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="edit-product-name">Tên sản phẩm</label>
                <input
                  id="edit-product-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                {fieldErrors.name ? <span className="admin-field-error">{fieldErrors.name}</span> : null}
              </div>

              <div className="admin-form-field">
                <label htmlFor="edit-product-category">Danh mục</label>
                <select
                  id="edit-product-category"
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
                <label htmlFor="edit-product-price">Giá cơ bản</label>
                <CurrencyInput id="edit-product-price" min={0} value={basePrice} onChange={setBasePrice} required />
                {fieldErrors.basePrice ? <span className="admin-field-error">{fieldErrors.basePrice}</span> : null}
              </div>
            </div>

            <div className="admin-form-field">
              <label htmlFor="edit-product-description">Mô tả</label>
              <textarea
                id="edit-product-description"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            {formError ? <p className="admin-form-error">{formError}</p> : null}
            {successMessage ? <p className="admin-form-success">{successMessage}</p> : null}
          </form>

          <section className="admin-card">
            <h3>Biến thể sản phẩm</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Thuộc tính</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Ngưỡng sắp hết</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((variant) => {
                  const isPendingDelete = pendingDeleteVariantId === variant.id

                  return (
                    <tr key={variant.id}>
                      <td>{variant.sku}</td>
                      <td>{variant.attributes}</td>
                      <td>{formatPrice(variant.price)}</td>
                      <td>
                        {variant.stockQuantity}
                        {variant.stockQuantity === 0 ? <Badge variant="error">Hết hàng</Badge> : null}
                        {variant.stockQuantity > 0 && variant.stockQuantity < variant.lowStockThreshold ? (
                          <Badge variant="warning">Sắp hết</Badge>
                        ) : null}
                      </td>
                      <td>{variant.lowStockThreshold}</td>
                      <td className="admin-table-actions">
                        {isPendingDelete ? (
                          <>
                            <Button type="button" variant="ghost" onClick={() => handleDeleteVariant(variant.id)}>
                              Xác nhận xóa
                            </Button>
                            <Button type="button" variant="ghost" onClick={handleCancelDeleteVariant}>
                              Hủy
                            </Button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-btn-danger"
                            onClick={() => handleRequestDeleteVariant(variant.id)}
                            aria-label={`Xóa biến thể ${variant.sku}`}
                            title="Xóa"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {pendingDeleteVariantId && deleteVariantError ? (
                  <tr>
                    <td colSpan={6}>
                      <p className="admin-form-error">{deleteVariantError}</p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>

            <h4>Thêm biến thể mới</h4>
            <form className="admin-form-row" onSubmit={handleAddVariant}>
              <div className="admin-form-field">
                <label htmlFor="edit-new-variant-sku">SKU</label>
                <input
                  id="edit-new-variant-sku"
                  type="text"
                  value={newVariant.sku}
                  onChange={(event) => setNewVariant((previous) => ({ ...previous, sku: event.target.value }))}
                  placeholder="VD: AOTHUN-M-XANH"
                  required
                />
                <small className="admin-field-hint">
                  Mã riêng biệt để quản lý từng biến thể, ví dụ: AOTHUN-M-XANH
                </small>
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-new-variant-attributes">Thuộc tính</label>
                <input
                  id="edit-new-variant-attributes"
                  type="text"
                  value={newVariant.attributes}
                  onChange={(event) => setNewVariant((previous) => ({ ...previous, attributes: event.target.value }))}
                  placeholder="VD: Size: M, Màu: Xanh"
                />
                <small className="admin-field-hint">
                  Đặc điểm phân biệt biến thể này, ví dụ: Size: M, Màu: Xanh
                </small>
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-new-variant-price">Giá</label>
                <CurrencyInput
                  id="edit-new-variant-price"
                  min={0}
                  value={newVariant.price}
                  onChange={(rawValue) => setNewVariant((previous) => ({ ...previous, price: rawValue }))}
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-new-variant-stock">Tồn kho khởi tạo</label>
                <input
                  id="edit-new-variant-stock"
                  type="number"
                  min="0"
                  value={newVariant.stockQuantity}
                  onChange={(event) => setNewVariant((previous) => ({ ...previous, stockQuantity: event.target.value }))}
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-new-variant-threshold">Ngưỡng sắp hết hàng</label>
                <input
                  id="edit-new-variant-threshold"
                  type="number"
                  min="0"
                  value={newVariant.lowStockThreshold}
                  onChange={(event) =>
                    setNewVariant((previous) => ({ ...previous, lowStockThreshold: event.target.value }))
                  }
                />
                <small className="admin-field-hint">
                  Khi tồn kho giảm xuống dưới số này, hệ thống sẽ cảnh báo sắp hết hàng
                </small>
              </div>
              <div className="admin-form-field">
                <label>&nbsp;</label>
                <Button type="submit" disabled={isAddingVariant}>
                  {isAddingVariant ? 'Đang thêm...' : 'Thêm biến thể'}
                </Button>
              </div>
            </form>
            {variantError ? <p className="admin-form-error">{variantError}</p> : null}
          </section>

          <section className="admin-card">
            <h3>Hình ảnh sản phẩm</h3>
            <div className="admin-product-image-grid">
              {product.images.map((image) => (
                <div key={image.id} className="admin-product-image-item">
                  <img src={resolveUploadUrl(image.filePath)} alt={product.name} />
                  <Button variant="ghost" onClick={() => handleDeleteImage(image.id)}>
                    Xóa
                  </Button>
                </div>
              ))}
              {product.images.length === 0 ? <p>Chưa có hình ảnh nào.</p> : null}
            </div>

            <div className="admin-form-field">
              <label htmlFor="edit-product-images">Tải lên hình ảnh mới</label>
              <input
                id="edit-product-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadImages}
                disabled={isUploadingImages}
              />
            </div>
            {imageError ? <p className="admin-form-error">{imageError}</p> : null}
          </section>

          <div className="admin-form-actions">
            <Button type="button" disabled={isSubmitting} onClick={submitCoreFields}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  )
}

export default ProductEditModal
