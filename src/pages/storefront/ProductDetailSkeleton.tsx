import '../../components/shared/Skeleton.css'

export default function ProductDetailSkeleton() {
  return <>
    <p className="product-detail-loading-label" role="status">Đang tải sản phẩm...</p>
    <div className="product-detail-loading-layout" aria-hidden="true">
      <div className="skeleton-block detail-skeleton-breadcrumb" />
      <div className="product-detail-main">
        <div className="product-detail-gallery">
          <div className="skeleton-block detail-skeleton-image" />
          <div className="product-detail-gallery-thumbnails">
            {[0, 1, 2].map((index) => <span key={index} className="skeleton-block detail-skeleton-thumbnail" />)}
          </div>
          <div className="skeleton-block detail-skeleton-line" />
        </div>
        <div className="product-detail-info detail-skeleton-info">
          <div className="skeleton-block detail-skeleton-category" />
          <div className="skeleton-block detail-skeleton-title" />
          <div className="skeleton-block detail-skeleton-line" />
          <div className="skeleton-block detail-skeleton-price" />
          <div className="skeleton-block detail-skeleton-line" />
          <div className="product-detail-variant-options">
            {[0, 1, 2, 3, 4, 5].map((index) => <span key={index} className="skeleton-block detail-skeleton-variant" />)}
          </div>
          <div className="skeleton-block detail-skeleton-line" />
          <div className="skeleton-block detail-skeleton-buy" />
          <div className="skeleton-block detail-skeleton-line" />
        </div>
      </div>
      <div className="product-detail-description-section detail-skeleton-section">
        <div className="skeleton-block detail-skeleton-title" />
        {[0, 1, 2, 3].map((index) => <div key={index} className="skeleton-block detail-skeleton-paragraph" />)}
      </div>
      <div className="product-detail-reviews detail-skeleton-section">
        <div className="skeleton-block detail-skeleton-title" />
        <div className="skeleton-block detail-skeleton-reviews" />
      </div>
    </div>
  </>
}
