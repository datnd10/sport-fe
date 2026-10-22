import './Skeleton.css'

// Shared loading placeholders standing in for the Danh_Mục chip row and
// the Sản_Phẩm grid while their data is loading, so pages (HomePage,
// CategoryProductsPage, ProductSearchPage) keep roughly the same layout
// height before/after loading instead of visibly jumping once the real
// content (or the Footer below it) renders in.
export function CategoryChipsSkeleton() {
  return (
    <div className="skeleton-category-row" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className="skeleton-block skeleton-category-chip" />
      ))}
    </div>
  )
}

type ProductGridSkeletonProps = {
  /** Number of placeholder cards to render. Defaults to 8. */
  count?: number
}

export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div className="skeleton-product-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-product-card">
          <span className="skeleton-block skeleton-product-card-image" />
          <div className="skeleton-product-card-body">
            <span className="skeleton-block skeleton-product-card-line" />
            <span className="skeleton-block skeleton-product-card-line-short" />
          </div>
        </div>
      ))}
    </div>
  )
}
