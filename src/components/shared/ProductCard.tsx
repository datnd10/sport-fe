import { Link } from 'react-router-dom'
import { resolveUploadUrl } from '../../services/apiClient'
import type { ProductResponse } from '../../services/productService.types'
import Badge from './Badge'
import './ProductCard.css'

// Shared Sản_Phẩm summary card used by the homepage's featured products
// section and the Category product listing page. Shows name, price and
// an out-of-stock/low-stock Badge derived from the product's variants.
// Requirements: 2.1, 2.2
type ProductCardProps = {
  product: ProductResponse
}

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

/**
 * Derives a simple stock status for the card from the product's
 * variants: out of stock only when every variant has zero Tồn_Kho, low
 * stock when at least one available variant is under its threshold.
 */
function getStockStatus(product: ProductResponse): 'out-of-stock' | 'low-stock' | 'in-stock' {
  if (product.variants.length === 0) {
    return 'in-stock'
  }
  const allOutOfStock = product.variants.every((variant) => variant.stockQuantity === 0)
  if (allOutOfStock) {
    return 'out-of-stock'
  }
  const anyLowStock = product.variants.some(
    (variant) => variant.stockQuantity > 0 && variant.stockQuantity < variant.lowStockThreshold,
  )
  return anyLowStock ? 'low-stock' : 'in-stock'
}

/** Fallback placeholder icon shown when the product has no image, or
 * while/if the first image fails to load (e.g. deleted file on disk). */
function ProductImagePlaceholder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0v20M2 12h20M4.5 5.5c2 2.2 4.6 3.5 7.5 3.5s5.5-1.3 7.5-3.5M4.5 18.5c2-2.2 4.6-3.5 7.5-3.5s5.5 1.3 7.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ProductCard({ product }: ProductCardProps) {
  const stockStatus = getStockStatus(product)
  // Images are already ordered by displayOrder ascending by the backend
  // (ProductImageRepository.findByProduct_IdOrderByDisplayOrderAsc), so
  // the first one is the thumbnail to show on the card.
  const thumbnail = product.images[0]

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card-image" aria-hidden="true">
        {thumbnail ? (
          <img
            src={resolveUploadUrl(thumbnail.filePath)}
            alt=""
            loading="lazy"
            onError={(event) => {
              // Hide the broken <img> and reveal the sibling placeholder
              // SVG instead of leaving a broken-image icon on the card.
              const img = event.currentTarget
              img.style.display = 'none'
              img.nextElementSibling?.classList.remove('product-card-image-fallback-hidden')
            }}
          />
        ) : null}
        <span className={thumbnail ? 'product-card-image-fallback product-card-image-fallback-hidden' : 'product-card-image-fallback'}>
          <ProductImagePlaceholder />
          <span className="product-card-placeholder-brand">LananhSport</span>
        </span>
      </div>
      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-price">{formatPrice(product.basePrice)}</p>
        <p className="product-card-rating">
          {(product.reviewCount ?? 0) > 0
            ? <><span className="product-card-star" aria-hidden="true">★</span><span className="product-card-score">{product.averageRating?.toFixed(1)}</span><span>({product.reviewCount} đánh giá)</span></>
            : 'Chưa có đánh giá'}
        </p>
        <div className="product-card-badges">
          {stockStatus === 'out-of-stock' ? <Badge variant="error">Hết hàng</Badge> : null}
          {stockStatus === 'low-stock' ? <Badge variant="warning">Sắp hết hàng</Badge> : null}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard