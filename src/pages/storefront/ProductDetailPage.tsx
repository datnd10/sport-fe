import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, Footer, Header } from '../../components/shared'
import { resolveUploadUrl } from '../../services/apiClient'
import { getErrorMessage } from '../../services/apiError'
import productService from '../../services/productService'
import type { ProductDetailResponse, ProductVariantResponse } from '../../services/productService.types'
import reviewService from '../../services/reviewService'
import type { ProductReviewListResponse } from '../../services/reviewService.types'
import { notifyError } from '../../services/toast'
import { useCartStore } from '../../store/cartStore'
import './ProductDetailPage.css'

type LoadState = 'loading' | 'success' | 'error' | 'not-found'

type VariantStockStatus = 'out-of-stock' | 'low-stock' | 'in-stock'

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

/** Per-variant Tồn_Kho status (Requirement 2.5, 7.3, 7.4). */
function getVariantStockStatus(variant: ProductVariantResponse): VariantStockStatus {
  if (variant.stockQuantity === 0) {
    return 'out-of-stock'
  }
  if (variant.stockQuantity < variant.lowStockThreshold) {
    return 'low-stock'
  }
  return 'in-stock'
}

function formatAverageRating(averageRating: number): string {
  return averageRating.toFixed(1)
}

function formatReviewDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('vi-VN')
}

// Trang chi tiết Sản_Phẩm (Product detail page): shows price, description,
// an image gallery, the list of available Biến_Thể_Sản_Phẩm with their
// Tồn_Kho status (Requirement 2.5), and the product's average rating plus
// its list of Đánh_Giá_Sản_Phẩm (Requirement 9.3; hidden reviews are
// already excluded server-side by ReviewService.getByProduct). The
// keyword search bar lives on the listing pages only, not here
// (Requirement 2.3, 2.6).
function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()

  const [product, setProduct] = useState<ProductDetailResponse | null>(null)
  const [reviewData, setReviewData] = useState<ProductReviewListResponse | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null)
  const addItemToCart = useCartStore((state) => state.addItem)

  useEffect(() => {
    if (!productId) {
      return
    }

    const currentProductId = productId
    let isMounted = true

    async function loadProductDetail() {
      setLoadState('loading')
      setAddToCartMessage(null)
      try {
        const [productResult, reviewResult] = await Promise.all([
          productService.getProductDetail(currentProductId),
          reviewService.getReviewsByProduct(currentProductId),
        ])
        if (!isMounted) {
          return
        }
        setProduct(productResult)
        setReviewData(reviewResult)
        setSelectedVariantId(productResult.variants[0]?.id ?? null)
        setSelectedImageIndex(0)
        setLoadState('success')
      } catch (error) {
        if (!isMounted) {
          return
        }
        const status = (error as { response?: { status?: number } }).response?.status
        if (status === 404) {
          setLoadState('not-found')
        } else {
          setErrorMessage(getErrorMessage(error, 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.'))
          setLoadState('error')
        }
      }
    }

    loadProductDetail()

    return () => {
      isMounted = false
    }
  }, [productId])

  const selectedVariant = useMemo(
    () => product?.variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [product, selectedVariantId],
  )

  // Adds the selected Biến_Thể_Sản_Phẩm to the Giỏ_Hàng via the unified
  // cart store (task 26.1): the store itself decides whether to persist
  // to localStorage (guest) or call the backend Cart API (authenticated),
  // so this handler doesn't need to branch on auth state (Requirement
  // 3.1, 3.2).
  async function handleAddToCart() {
    if (!selectedVariant || !product) {
      return
    }
    if (selectedVariant.stockQuantity === 0) {
      setAddToCartMessage('Biến thể này đã hết hàng.')
      notifyError('Biến thể này đã hết hàng.')
      return
    }

    await addItemToCart({
      variantId: selectedVariant.id,
      productName: product.name,
      sku: selectedVariant.sku,
      attributes: selectedVariant.attributes,
      unitPrice: selectedVariant.price,
      stockQuantity: selectedVariant.stockQuantity,
      quantity: 1,
    })
    setAddToCartMessage(`Đã thêm "${product.name}" (${selectedVariant.attributes}) vào giỏ hàng.`)
  }

  return (
    <div className="product-detail-page">
      <Header />

      <main className="product-detail-content">
        {loadState === 'loading' ? <p className="product-detail-status">Đang tải...</p> : null}

        {loadState === 'error' ? (
          <p className="product-detail-status product-detail-status-error">{errorMessage}</p>
        ) : null}

        {loadState === 'not-found' ? (
          <div className="product-detail-not-found">
            <p>Không tìm thấy sản phẩm này. Sản phẩm có thể đã bị gỡ hoặc không tồn tại.</p>
            <Link to="/">Quay về trang chủ</Link>
          </div>
        ) : null}

        {loadState === 'success' && product ? (
          <>
            <section className="product-detail-main">
              <div className="product-detail-gallery">
                {product.images.length > 0 ? (
                  <>
                    <img
                      className="product-detail-gallery-main"
                      src={resolveUploadUrl(product.images[selectedImageIndex].filePath)}
                      alt={product.name}
                    />
                    {product.images.length > 1 ? (
                      <div className="product-detail-gallery-thumbnails">
                        {product.images.map((image, index) => (
                          <button
                            key={image.id}
                            type="button"
                            className={
                              'product-detail-gallery-thumbnail' +
                              (index === selectedImageIndex ? ' product-detail-gallery-thumbnail-active' : '')
                            }
                            onClick={() => setSelectedImageIndex(index)}
                            aria-label={`Xem hình ảnh ${index + 1}`}
                          >
                            <img src={resolveUploadUrl(image.filePath)} alt={`${product.name} - ${index + 1}`} />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="product-detail-gallery-placeholder">Chưa có hình ảnh</div>
                )}
              </div>

              <div className="product-detail-info">
                <p className="product-detail-category">{product.category.name}</p>
                <h2 className="product-detail-name">{product.name}</h2>
                <p className="product-detail-price">
                  {formatPrice(selectedVariant ? selectedVariant.price : product.basePrice)}
                </p>

                {reviewData ? (
                  <p className="product-detail-rating-summary">
                    ⭐ {formatAverageRating(reviewData.averageRating)} ({reviewData.totalCount} đánh giá)
                  </p>
                ) : null}

                <p className="product-detail-description">{product.description ?? 'Chưa có mô tả.'}</p>

                {product.variants.length > 0 ? (
                  <div className="product-detail-variants">
                    <p className="product-detail-variants-label">Biến thể:</p>
                    <div className="product-detail-variant-options">
                      {product.variants.map((variant) => {
                        const status = getVariantStockStatus(variant)
                        const isSelected = variant.id === selectedVariantId
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={status === 'out-of-stock'}
                            className={
                              'product-detail-variant-option' +
                              (isSelected ? ' product-detail-variant-option-selected' : '')
                            }
                            onClick={() => setSelectedVariantId(variant.id)}
                          >
                            {variant.attributes}
                          </button>
                        )
                      })}
                    </div>

                    {selectedVariant ? (
                      <div className="product-detail-variant-stock">
                        <span className="product-detail-variant-sku">SKU: {selectedVariant.sku}</span>
                        {getVariantStockStatus(selectedVariant) === 'out-of-stock' ? (
                          <Badge variant="error">Hết hàng</Badge>
                        ) : null}
                        {getVariantStockStatus(selectedVariant) === 'low-stock' ? (
                          <Badge variant="warning">Sắp hết hàng</Badge>
                        ) : null}
                        {getVariantStockStatus(selectedVariant) === 'in-stock' ? (
                          <Badge variant="brand">Còn hàng ({selectedVariant.stockQuantity})</Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="product-detail-no-variants">Sản phẩm hiện chưa có biến thể nào khả dụng.</p>
                )}

                <Button
                  variant="primary"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
                >
                  Thêm vào giỏ hàng
                </Button>

                {addToCartMessage ? <p className="product-detail-add-to-cart-message">{addToCartMessage}</p> : null}
              </div>
            </section>

            <section className="product-detail-reviews" aria-labelledby="reviews-heading">
              <h3 id="reviews-heading">Đánh giá sản phẩm</h3>

              {reviewData && reviewData.reviews.length > 0 ? (
                <ul className="product-detail-review-list">
                  {reviewData.reviews.map((review) => (
                    <li key={review.id} className="product-detail-review-item">
                      <div className="product-detail-review-header">
                        <span className="product-detail-review-author">
                          {review.reviewerName ?? 'Khách hàng'}
                        </span>
                        <span className="product-detail-review-rating">{'⭐'.repeat(review.rating)}</span>
                        <span className="product-detail-review-date">{formatReviewDate(review.createdAt)}</span>
                      </div>
                      {review.comment ? <p className="product-detail-review-comment">{review.comment}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="product-detail-no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>
              )}
            </section>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}

export default ProductDetailPage