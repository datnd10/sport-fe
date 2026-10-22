import { apiClient } from './apiClient'
import type { PageResponse } from './common.types'
import type { AdminReviewListParams, ProductReviewListResponse, ReviewResponse } from './reviewService.types'

// API client for the Product_Review module (design.md — "Module Product
// Review"). Talks to the public GET /api/products/{id}/reviews endpoint,
// which returns only non-hidden Đánh_Giá_Sản_Phẩm together with their
// average rating, for display on the Sản_Phẩm detail page
// (Requirement 9.3), plus the Admin review management endpoints (list,
// hide).
const PRODUCT_BASE = '/products'
const ADMIN_REVIEW_BASE = '/admin/reviews'

/**
 * Fetches the non-hidden Đánh_Giá_Sản_Phẩm and average rating for a
 * Sản_Phẩm (Requirement 9.3). Public: no authentication required.
 */
async function getReviewsByProduct(productId: string): Promise<ProductReviewListResponse> {
  const response = await apiClient.get<ProductReviewListResponse>(`${PRODUCT_BASE}/${productId}/reviews`)
  return response.data
}

/**
 * Fetches a paginated, optionally keyword-filtered page of
 * Đánh_Giá_Sản_Phẩm (including already-hidden ones) for the Admin
 * review management page, newest first (Requirement 9.4). `keyword`
 * matches either the related Sản_Phẩm's name or the comment text.
 * `page` is 0-based, mirroring the backend. Requires an authenticated
 * ROLE_ADMIN caller.
 */
async function getAllReviews(params: AdminReviewListParams = {}): Promise<PageResponse<ReviewResponse>> {
  const response = await apiClient.get<PageResponse<ReviewResponse>>(ADMIN_REVIEW_BASE, {
    params: {
      page: params.page,
      size: params.size,
      keyword: params.keyword || undefined,
    },
  })
  return response.data
}

/**
 * Hides a Đánh_Giá_Sản_Phẩm that violates content rules, removing it
 * from the Sản_Phẩm detail page and its average rating (Requirement
 * 9.4).
 */
async function hideReview(reviewId: string): Promise<ReviewResponse> {
  const response = await apiClient.delete<ReviewResponse>(`${ADMIN_REVIEW_BASE}/${reviewId}`)
  return response.data
}

export const reviewService = {
  getReviewsByProduct,
  getAllReviews,
  hideReview,
}

export default reviewService
