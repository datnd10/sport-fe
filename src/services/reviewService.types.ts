// Request/response shapes mirroring the backend Review DTOs
// (com.example.sport_be.dto.review.*). Requirements: 9.1, 9.3, 9.4

/**
 * A single Đánh_Giá_Sản_Phẩm, as returned for a Sản_Phẩm's review list
 * and the Admin review management list. `productName` and `hidden` are
 * only meaningful for the Admin list (GET /api/products/{id}/reviews only
 * ever returns non-hidden reviews, so `hidden` is always `false` there).
 */
export interface ReviewImageResponse {
  id: string
  filePath: string
  displayOrder: number
}

export interface ReviewEligibility {
  orderItemId: string
  orderCode: string
  attributes: string
}

export interface ReviewResponse {
  images?: ReviewImageResponse[]
  id: string
  productId: string
  productName: string
  accountId: string
  reviewerName: string | null
  rating: number
  comment: string | null
  hidden: boolean
  createdAt: string
}

/**
 * Result of GET /api/products/{id}/reviews: the non-hidden reviews for a
 * product together with their average rating and total count
 * (Requirement 9.3). Reviews hidden by an admin are excluded server-side.
 */
export interface ProductReviewListResponse {
  reviews: ReviewResponse[]
  averageRating: number
  totalCount: number
}

/**
 * Query parameters accepted by GET /api/admin/reviews. `page` is
 * 0-based; all fields are optional on the caller side since the backend
 * applies its own defaults (page=0, size=20, sort=createdAt desc).
 * `keyword` matches against the related Sản_Phẩm's name OR the review's
 * own comment text.
 */
export interface AdminReviewListParams {
  page?: number
  size?: number
  keyword?: string
}
