import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { Badge, Button, Footer, Header } from '../../components/shared'
import { resolveUploadUrl } from '../../services/apiClient'
import { getErrorMessage } from '../../services/apiError'
import productService from '../../services/productService'
import type { ProductDetailResponse, ProductVariantResponse } from '../../services/productService.types'
import reviewService from '../../services/reviewService'
import type { ProductReviewListResponse } from '../../services/reviewService.types'
import { useCartStore } from '../../store/cartStore'
import { useAccountStore } from '../../store/accountStore'
import './ProductDetailPage.css'
import ProductDetailSkeleton from './ProductDetailSkeleton'
import ReviewImages from '../../components/reviews/ReviewImages'
import ReviewComposer from '../../components/reviews/ReviewComposer'

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

function variantLabel(variant: ProductVariantResponse): string {
  return variant.attributes.split(/[;,]/).map((part) => {
    const [key, ...values] = part.trim().split('=')
    if (values.length === 0) return part.trim()
    const label = key.toLowerCase() === 'size' ? 'Size' : key.toLowerCase() === 'color' ? 'Màu' : key
    return `${label}: ${values.join('=')}`
  }).join(' · ') || variant.sku
}

function ProductDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const requestedOrderItemId = new URLSearchParams(location.search).get('orderItemId') ?? undefined
  const { productId } = useParams<{ productId: string }>()

  const [product, setProduct] = useState<ProductDetailResponse | null>(null)
  const [reviewData, setReviewData] = useState<ProductReviewListResponse | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [cartError, setCartError] = useState(false)
  const [ratingFilter, setRatingFilter] = useState(0)
  const [failedImages, setFailedImages] = useState<string[]>([])
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
        setSelectedVariantId(productResult.variants.find((variant) => variant.stockQuantity > 0)?.id ?? productResult.variants[0]?.id ?? null)
        setQuantity(1)
        setRatingFilter(0)
        setFailedImages([])
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

  useEffect(() => {
    if (loadState === 'success' && location.hash === '#reviews-heading') {
      document.getElementById('reviews-heading')?.scrollIntoView?.({ block: 'start' })
    }
  }, [loadState, location.hash, requestedOrderItemId])

  const selectedVariant = useMemo(
    () => product?.variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [product, selectedVariantId],
  )

  const reviews = reviewData?.reviews ?? []
  const visibleReviews = reviews
    .filter((review) => ratingFilter === 0 || review.rating === ratingFilter)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const canBuy = !!selectedVariant && selectedVariant.stockQuantity > 0

  async function handleAddToCart() {
    if (!useAccountStore.getState().isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (!selectedVariant || !product || !canBuy || isAdding) return
    setIsAdding(true)
    setAddToCartMessage(null)
    setCartError(false)
    try {
      await addItemToCart({
        variantId: selectedVariant.id, productName: product.name, sku: selectedVariant.sku,
        attributes: selectedVariant.attributes, unitPrice: selectedVariant.price,
        stockQuantity: selectedVariant.stockQuantity, quantity,
      })
      const message = useCartStore.getState().message
      setCartError(!!message)
      setAddToCartMessage(message ?? `Đã thêm sản phẩm vào giỏ hàng.`)
    } catch (error) {
      setCartError(true)
      setAddToCartMessage(getErrorMessage(error, 'Không thể thêm sản phẩm. Vui lòng thử lại.'))
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="product-detail-page">
      <Header showSearch={false} />

      <main className="product-detail-content" aria-busy={loadState === 'loading'}>
        {loadState === 'loading' ? <ProductDetailSkeleton /> : null}

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
            <nav className="product-detail-breadcrumb" aria-label="Đường dẫn">
              <Link to="/">Trang chủ</Link><span aria-hidden="true">/</span>
              <Link to={`/?categoryId=${product.category.id}`}>{product.category.name}</Link>
              <span aria-hidden="true">/</span><span aria-current="page">{product.name}</span>
            </nav>
            <section className="product-detail-main" aria-labelledby="product-name">
              <div className="product-detail-gallery">
                <div className="product-detail-image-stage">
                  {product.images[selectedImageIndex] && !failedImages.includes(product.images[selectedImageIndex].id) ? (
                    <img className="product-detail-gallery-main"
                      src={resolveUploadUrl(product.images[selectedImageIndex].filePath)} alt={product.name}
                      onError={() => setFailedImages((current) => [...current, product.images[selectedImageIndex].id])} />
                  ) : <div className="product-detail-gallery-placeholder"><span aria-hidden="true">◇</span>Chưa có hình ảnh</div>}
                  {product.images.length > 1 ? <>
                    <button type="button" className="product-detail-image-arrow product-detail-image-arrow-prev" aria-label="Ảnh trước"
                      onClick={() => setSelectedImageIndex((index) => (index - 1 + product.images.length) % product.images.length)}>
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button type="button" className="product-detail-image-arrow product-detail-image-arrow-next" aria-label="Ảnh tiếp theo"
                      onClick={() => setSelectedImageIndex((index) => (index + 1) % product.images.length)}>
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <span className="product-detail-image-count" aria-live="polite">{selectedImageIndex + 1} / {product.images.length}</span>
                  </> : null}
                </div>
                {product.images.length > 1 ? (
                  <div className="product-detail-gallery-thumbnails" aria-label="Hình ảnh sản phẩm">
                    {product.images.map((image, index) => (
                      <button key={image.id} type="button" aria-label={`Xem hình ảnh ${index + 1}`} aria-pressed={index === selectedImageIndex}
                        className={`product-detail-gallery-thumbnail${index === selectedImageIndex ? ' product-detail-gallery-thumbnail-active' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}>
                        {failedImages.includes(image.id) ? <span>Ảnh {index + 1}</span> : <img src={resolveUploadUrl(image.filePath)} alt="" loading="lazy" onError={() => setFailedImages((current) => [...current, image.id])} />}
                      </button>
                    ))}
                  </div>
                ) : null}
                <p className="product-detail-gallery-caption">{product.images.length > 1 ? 'Chọn ảnh thu nhỏ để xem chi tiết sản phẩm.' : 'Hình ảnh sản phẩm'}</p>
              </div>
              <div className="product-detail-info">
                <Link to={`/?categoryId=${product.category.id}`} className="product-detail-category">{product.category.name}</Link>
                <h2 id="product-name" className="product-detail-name">{product.name}</h2>
                <a href="#reviews-heading" className="product-detail-rating-summary">
                  <span className="detail-stars" aria-hidden="true">★</span>
                  {reviewData && reviewData.totalCount > 0 ? <><strong>{formatAverageRating(reviewData.averageRating)}</strong><span>({reviewData.totalCount} đánh giá)</span></> : <span>Chưa có đánh giá</span>}
                </a>
                <div className="product-detail-price-panel">
                  <span className="product-detail-small-label">Giá bán</span>
                  <p className="product-detail-price">{formatPrice(selectedVariant ? selectedVariant.price : product.basePrice)}</p>
                  <span className="product-detail-price-note">{selectedVariant ? 'Theo lựa chọn hiện tại' : 'Giá sản phẩm'}</span>
                </div>
                {product.variants.length > 0 ? (
                  <div className="product-detail-variants">
                    <h3 className="product-detail-variants-label">Lựa chọn sản phẩm</h3>
                    <div className="product-detail-variant-options" role="group" aria-label="Chọn biến thể">
                      {product.variants.map((variant) => (
                        <button key={variant.id} type="button" disabled={variant.stockQuantity === 0 || isAdding}
                          aria-pressed={variant.id === selectedVariantId}
                          className={`product-detail-variant-option${variant.id === selectedVariantId ? ' product-detail-variant-option-selected' : ''}`}
                          onClick={() => { setSelectedVariantId(variant.id); setQuantity(1); setAddToCartMessage(null) }}>
                          {variantLabel(variant)}{variant.stockQuantity === 0 ? <small>Hết hàng</small> : null}
                        </button>
                      ))}
                    </div>
                    {selectedVariant ? <div className="product-detail-variant-stock">
                      <span className="product-detail-variant-sku">SKU: {selectedVariant.sku}</span>
                      {getVariantStockStatus(selectedVariant) === 'out-of-stock' ? <Badge variant="error">Hết hàng</Badge>
                        : getVariantStockStatus(selectedVariant) === 'low-stock' ? <Badge variant="warning">Chỉ còn {selectedVariant.stockQuantity} sản phẩm</Badge>
                          : <Badge variant="brand">Còn {selectedVariant.stockQuantity} sản phẩm</Badge>}
                    </div> : null}
                  </div>
                ) : <p className="product-detail-no-variants">Sản phẩm hiện chưa có biến thể nào khả dụng.</p>}
                <div className="product-detail-purchase">
                  <label htmlFor="product-quantity" className="product-detail-small-label">Số lượng</label>
                  <div className="product-detail-purchase-actions">
                    <div className="product-detail-quantity">
                      <button type="button" aria-label="Giảm số lượng" disabled={!canBuy || isAdding || quantity <= 1} onClick={() => setQuantity((value) => value - 1)}>−</button>
                      <input id="product-quantity" type="number" min="1" max={selectedVariant?.stockQuantity || 1} step="1" value={quantity} disabled={!canBuy || isAdding}
                        onChange={(event) => setQuantity(Math.min(selectedVariant?.stockQuantity || 1, Math.max(1, Math.floor(Number(event.target.value)) || 1)))} />
                      <button type="button" aria-label="Tăng số lượng" disabled={!canBuy || isAdding || quantity >= (selectedVariant?.stockQuantity ?? 0)} onClick={() => setQuantity((value) => value + 1)}>+</button>
                    </div>
                    <Button className="product-detail-add-button" variant="primary" onClick={handleAddToCart} disabled={!canBuy || isAdding}>
                      {isAdding ? 'Đang thêm...' : canBuy ? 'Thêm vào giỏ hàng' : 'Hiện đã hết hàng'}
                    </Button>
                  </div>
                  <Link to="/cart" className="product-detail-cart-link">Xem giỏ hàng <span aria-hidden="true">→</span></Link>
                </div>
                {addToCartMessage ? <p role={cartError ? 'alert' : 'status'} className={`product-detail-add-to-cart-message${cartError ? ' product-detail-cart-error' : ''}`}>{addToCartMessage}</p> : null}
                <div className="product-detail-payment-note"><span aria-hidden="true">▣</span><div><strong>Phương thức thanh toán</strong><p>Thanh toán khi nhận hàng (COD) hoặc chuyển khoản ngân hàng.</p></div></div>
              </div>
            </section>
            <section className="product-detail-description-section" aria-labelledby="description-heading">
              <span className="product-detail-section-eyebrow">THÔNG TIN SẢN PHẨM</span>
              <h3 id="description-heading">Mô tả chi tiết</h3>
              <p className="product-detail-description">{product.description?.trim() || 'Shop đang cập nhật mô tả cho sản phẩm này.'}</p>
            </section>
            <section className="product-detail-reviews" aria-labelledby="reviews-heading">
              <div><span className="product-detail-section-eyebrow">TRẢI NGHIỆM KHÁCH HÀNG</span><h3 id="reviews-heading">Đánh giá sản phẩm</h3></div>
              <ReviewComposer key={`${product.id}:${requestedOrderItemId ?? ''}`} productId={product.id} requestedOrderItemId={requestedOrderItemId} onSubmitted={(review) => {
                setReviewData((current) => {
                  const updated = [review, ...(current?.reviews ?? [])]
                  return { reviews: updated, totalCount: updated.length, averageRating: updated.reduce((sum, item) => sum + item.rating, 0) / updated.length }
                })
                setRatingFilter(0)
              }} />
              <div className="product-detail-review-overview">
                <div className="product-detail-review-score">
                  <strong>{reviewData && reviewData.totalCount > 0 ? formatAverageRating(reviewData.averageRating) : '—'}<small>/ 5</small></strong>
                  <span className="detail-stars" aria-hidden="true">{reviewData && reviewData.totalCount > 0 ? '★'.repeat(Math.round(reviewData.averageRating)) + '☆'.repeat(5 - Math.round(reviewData.averageRating)) : '☆☆☆☆☆'}</span>
                  <span>{reviewData?.totalCount ?? 0} đánh giá</span>
                </div>
                <div className="product-detail-rating-bars" aria-label="Phân bố đánh giá">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter((review) => review.rating === rating).length
                    return <div key={rating} className="product-detail-rating-row"><span>{rating} <span className="detail-stars" aria-hidden="true">★</span></span><meter min="0" max={reviews.length || 1} value={count} aria-label={`${rating} sao: ${count} đánh giá`} /><span>{count}</span></div>
                  })}
                </div>
              </div>
              <div className="product-detail-review-filters" role="group" aria-label="Lọc đánh giá">
                {[0, 5, 4, 3, 2, 1].map((rating) => <button key={rating} type="button" aria-pressed={rating === ratingFilter} onClick={() => setRatingFilter(rating)}>
                  {rating === 0 ? 'Tất cả' : `${rating} sao`} ({rating === 0 ? reviews.length : reviews.filter((review) => review.rating === rating).length})
                </button>)}
              </div>
              {visibleReviews.length > 0 ? <ul className="product-detail-review-list">
                {visibleReviews.map((review) => <li key={review.id} className="product-detail-review-item">
                  <span className="product-detail-review-avatar" aria-hidden="true">{(review.reviewerName?.trim() || 'K')[0].toUpperCase()}</span>
                  <div className="product-detail-review-body">
                    <div className="product-detail-review-header"><span className="product-detail-review-author">{review.reviewerName || 'Khách hàng'}</span><time className="product-detail-review-date" dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time></div>
                    <span className="detail-stars" aria-label={`${review.rating} trên 5 sao`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    {review.comment ? <p className="product-detail-review-comment">{review.comment}</p> : null}
                    <ReviewImages images={review.images} />
                  </div>
                </li>)}
              </ul> : <p className="product-detail-no-reviews">{reviews.length === 0 ? 'Chưa có đánh giá. Nhận xét của khách hàng sẽ xuất hiện tại đây.' : 'Chưa có đánh giá ở mức sao này.'}</p>}
            </section>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}

export default ProductDetailPage
