import { useEffect, useState } from 'react'
import { Badge, Modal } from '../../components/shared'
import { resolveUploadUrl } from '../../services/apiClient'
import { getErrorMessage } from '../../services/apiError'
import adminProductService from '../../services/adminProductService'
import type { ProductDetailResponse, ProductResponse } from '../../services/productService.types'
import './AdminForms.css'

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

/**
 * Modal xem nhanh (readonly) thông tin một Sản_Phẩm từ trang danh
 * sách, mở bằng icon "con mắt" trong cột Hành động. `ProductResponse`
 * (dữ liệu đã có sẵn trong danh sách) không chứa Hình_Ảnh_Sản_Phẩm, nên
 * khi modal mở, gọi getProductDetail để lấy đầy đủ thông tin kèm ảnh —
 * giống cách AdminProductFormPage đang làm — rồi hiển thị grid ảnh
 * readonly (không có nút xóa, vì đây là xem, không phải sửa).
 */
function ProductViewModal({
  product,
  categoryName,
  onClose,
}: {
  product: ProductResponse | null
  categoryName: string
  onClose: () => void
}) {
  const [detail, setDetail] = useState<ProductDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!product) {
      setDetail(null)
      setLoadError(null)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setLoadError(null)
    adminProductService
      .getProductDetail(product.id)
      .then((loadedDetail) => {
        if (isMounted) {
          setDetail(loadedDetail)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(getErrorMessage(error, 'Không thể tải hình ảnh sản phẩm. Vui lòng thử lại.'))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [product])

  return (
    <Modal isOpen={product !== null} onClose={onClose} title="Thông tin sản phẩm">
      {product ? (
        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label>Tên sản phẩm</label>
              <span>{product.name}</span>
            </div>
            <div className="admin-form-field">
              <label>Danh mục</label>
              <span>{categoryName}</span>
            </div>
            <div className="admin-form-field">
              <label>Giá cơ bản</label>
              <span>{formatPrice(product.basePrice)}</span>
            </div>
            <div className="admin-form-field">
              <label>Trạng thái</label>
              <Badge variant={product.active ? 'brand' : 'error'}>
                {product.active ? 'Đang hoạt động' : 'Đã ẩn'}
              </Badge>
            </div>
          </div>

          {product.description ? (
            <div className="admin-form-field">
              <label>Mô tả</label>
              <span>{product.description}</span>
            </div>
          ) : null}

          <div>
            <h4>Hình ảnh sản phẩm</h4>
            {isLoading ? <p>Đang tải ảnh...</p> : null}
            {!isLoading && loadError ? <p className="admin-form-error">{loadError}</p> : null}
            {!isLoading && !loadError && detail ? (
              <div className="admin-product-image-grid">
                {detail.images.map((image) => (
                  <div key={image.id} className="admin-product-image-item">
                    <img src={resolveUploadUrl(image.filePath)} alt={product.name} />
                  </div>
                ))}
                {detail.images.length === 0 ? <p>Chưa có hình ảnh nào.</p> : null}
              </div>
            ) : null}
          </div>

          <div>
            <h4>Biến thể sản phẩm</h4>
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
                    <td>{variant.stockQuantity}</td>
                    <td>{variant.lowStockThreshold}</td>
                  </tr>
                ))}
                {product.variants.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Chưa có biến thể nào.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default ProductViewModal
