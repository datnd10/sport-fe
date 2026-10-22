import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button } from '../../components/shared'
import { resolveUploadUrl } from '../../services/apiClient'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import adminProductService from '../../services/adminProductService'
import categoryService from '../../services/categoryService'
import type { CategoryResponse, ProductDetailResponse } from '../../services/productService.types'
import { notifySuccess } from '../../services/toast'
import AdminLayout from './AdminLayout'
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
 * Trang tạo/sửa Sản_Phẩm cho Quản_Trị_Viên. Ở chế độ tạo mới, cho phép
 * nhập một hoặc nhiều Biến_Thể_Sản_Phẩm khởi tạo (Requirement 1.2, 1.6).
 * Ở chế độ sửa, cho phép cập nhật thông tin Sản_Phẩm (Requirement 1.4),
 * thêm Biến_Thể_Sản_Phẩm mới (Requirement 1.6, 1.7) và quản lý
 * Hình_Ảnh_Sản_Phẩm (Requirement 1.8, 1.9, 1.10).
 */
function AdminProductFormPage() {
  const { productId } = useParams<{ productId: string }>()
  const isEditMode = Boolean(productId)
  const navigate = useNavigate()

  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [product, setProduct] = useState<ProductDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Core product fields
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState('')

  // Initial variants, only used in create mode
  const [draftVariants, setDraftVariants] = useState<DraftVariant[]>([createEmptyVariant()])

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New variant form, only used in edit mode
  const [newVariant, setNewVariant] = useState<DraftVariant>(createEmptyVariant())
  const [variantError, setVariantError] = useState<string | null>(null)
  const [isAddingVariant, setIsAddingVariant] = useState(false)

  // Image upload, only used in edit mode
  const [imageError, setImageError] = useState<string | null>(null)
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const categoryList = await categoryService.getCategories()
        if (!isMounted) {
          return
        }
        setCategories(categoryList)

        if (productId) {
          const detail = await adminProductService.getProductDetail(productId)
          if (!isMounted) {
            return
          }
          setProduct(detail)
          setCategoryId(detail.category.id)
          setName(detail.name)
          setDescription(detail.description ?? '')
          setBasePrice(String(detail.basePrice))
        } else if (categoryList.length > 0) {
          setCategoryId(categoryList[0].id)
        }
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

  function updateDraftVariant(index: number, patch: Partial<DraftVariant>) {
    setDraftVariants((previous) => previous.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)))
  }

  function addDraftVariantRow() {
    setDraftVariants((previous) => [...previous, createEmptyVariant()])
  }

  function removeDraftVariantRow(index: number) {
    setDraftVariants((previous) => (previous.length > 1 ? previous.filter((_, i) => i !== index) : previous))
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
    setSuccessMessage(null)

    const coreErrors = validateCoreFields()
    if (Object.keys(coreErrors).length > 0) {
      setFieldErrors(coreErrors)
      return
    }

    if (!isEditMode) {
      const variantValidationError = validateDraftVariants()
      if (variantValidationError) {
        setFormError(variantValidationError)
        return
      }
    }

    setIsSubmitting(true)
    try {
      if (isEditMode && productId) {
        await adminProductService.updateProduct(productId, {
          categoryId,
          name: name.trim(),
          description: description.trim() || undefined,
          basePrice: Number(basePrice),
        })
        setSuccessMessage('Cập nhật sản phẩm thành công.')
        notifySuccess('Cập nhật sản phẩm thành công.')
      } else {
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
        notifySuccess('Đã tạo sản phẩm mới.')
        navigate(`/admin/products/${created.id}/edit`)
        return
      }
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

  if (isLoading) {
    return (
      <AdminLayout title={isEditMode ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}>
        <p>Đang tải...</p>
      </AdminLayout>
    )
  }

  if (loadError) {
    return (
      <AdminLayout title={isEditMode ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}>
        <p className="admin-form-error">{loadError}</p>
        <Link to="/admin/products">Quay lại danh sách sản phẩm</Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={isEditMode ? `Sửa sản phẩm: ${product?.name ?? ''}` : 'Thêm sản phẩm mới'}>
      <section className="admin-card">
        <h3>Thông tin sản phẩm</h3>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="product-name">Tên sản phẩm</label>
              <input id="product-name" type="text" value={name} onChange={(event) => setName(event.target.value)} required />
              {fieldErrors.name ? <span className="admin-field-error">{fieldErrors.name}</span> : null}
            </div>

            <div className="admin-form-field">
              <label htmlFor="product-category">Danh mục</label>
              <select id="product-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
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
              <label htmlFor="product-price">Giá cơ bản</label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="1000"
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
                required
              />
              {fieldErrors.basePrice ? <span className="admin-field-error">{fieldErrors.basePrice}</span> : null}
            </div>
          </div>

          <div className="admin-form-field">
            <label htmlFor="product-description">Mô tả</label>
            <textarea
              id="product-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {!isEditMode ? (
            <div>
              <h4>Biến thể sản phẩm khởi tạo</h4>
              {draftVariants.map((variant, index) => (
                <div className="admin-form-row" key={index} style={{ marginBottom: '0.75rem' }}>
                  <div className="admin-form-field">
                    <label htmlFor={`variant-sku-${index}`}>SKU</label>
                    <input
                      id={`variant-sku-${index}`}
                      type="text"
                      value={variant.sku}
                      onChange={(event) => updateDraftVariant(index, { sku: event.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor={`variant-attributes-${index}`}>Thuộc tính (size/màu...)</label>
                    <input
                      id={`variant-attributes-${index}`}
                      type="text"
                      value={variant.attributes}
                      onChange={(event) => updateDraftVariant(index, { attributes: event.target.value })}
                    />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor={`variant-price-${index}`}>Giá</label>
                    <input
                      id={`variant-price-${index}`}
                      type="number"
                      min="0"
                      step="1000"
                      value={variant.price}
                      onChange={(event) => updateDraftVariant(index, { price: event.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor={`variant-stock-${index}`}>Tồn kho khởi tạo</label>
                    <input
                      id={`variant-stock-${index}`}
                      type="number"
                      min="0"
                      value={variant.stockQuantity}
                      onChange={(event) => updateDraftVariant(index, { stockQuantity: event.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor={`variant-threshold-${index}`}>Ngưỡng sắp hết hàng</label>
                    <input
                      id={`variant-threshold-${index}`}
                      type="number"
                      min="0"
                      value={variant.lowStockThreshold}
                      onChange={(event) => updateDraftVariant(index, { lowStockThreshold: event.target.value })}
                    />
                  </div>
                  <div className="admin-form-field">
                    <label>&nbsp;</label>
                    <Button variant="ghost" onClick={() => removeDraftVariantRow(index)} disabled={draftVariants.length === 1}>
                      Xóa dòng
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="secondary" onClick={addDraftVariantRow}>
                Thêm biến thể
              </Button>
            </div>
          ) : null}

          {formError ? <p className="admin-form-error">{formError}</p> : null}
          {successMessage ? <p className="admin-form-success">{successMessage}</p> : null}

          <div className="admin-form-actions">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </Button>
            <Link to="/admin/products">
              <Button type="button" variant="ghost">
                Quay lại
              </Button>
            </Link>
          </div>
        </form>
      </section>

      {isEditMode && product ? (
        <>
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
                </tr>
              </thead>
              <tbody>
                {product.variants.map((variant) => (
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
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Thêm biến thể mới</h4>
            <form className="admin-form-row" onSubmit={handleAddVariant}>
              <div className="admin-form-field">
                <label htmlFor="new-variant-sku">SKU</label>
                <input
                  id="new-variant-sku"
                  type="text"
                  value={newVariant.sku}
                  onChange={(event) => setNewVariant((previous) => ({ ...previous, sku: event.target.value }))}
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="new-variant-attributes">Thuộc tính</label>
                <input
                  id="new-variant-attributes"
                  type="text"
                  value={newVariant.attributes}
                  onChange={(event) => setNewVariant((previous) => ({ ...previous, attributes: event.target.value }))}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="new-variant-price">Giá</label>
                <input
                  id="new-variant-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={newVariant.price}
                  onChange={(event) => setNewVariant((previous) => ({ ...previous, price: event.target.value }))}
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="new-variant-stock">Tồn kho khởi tạo</label>
                <input
                  id="new-variant-stock"
                  type="number"
                  min="0"
                  value={newVariant.stockQuantity}
                  onChange={(event) => setNewVariant((previous) => ({ ...previous, stockQuantity: event.target.value }))}
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="new-variant-threshold">Ngưỡng sắp hết hàng</label>
                <input
                  id="new-variant-threshold"
                  type="number"
                  min="0"
                  value={newVariant.lowStockThreshold}
                  onChange={(event) =>
                    setNewVariant((previous) => ({ ...previous, lowStockThreshold: event.target.value }))
                  }
                />
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
              <label htmlFor="product-images">Tải lên hình ảnh mới</label>
              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadImages}
                disabled={isUploadingImages}
              />
            </div>
            {imageError ? <p className="admin-form-error">{imageError}</p> : null}
          </section>
        </>
      ) : null}
    </AdminLayout>
  )
}

export default AdminProductFormPage
