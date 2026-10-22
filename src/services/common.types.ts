// Shared response shapes mirroring backend DTOs used across multiple
// service modules (com.example.sport_be.dto.common.*). Kept separate
// from any single feature's *.types.ts so pages beyond Admin Sản_Phẩm
// (e.g. future paginated Admin Đơn_Hàng/Đánh_Giá_Sản_Phẩm lists) can
// reuse the same envelope.

/**
 * Generic pagination envelope returned by paginated Admin list
 * endpoints (e.g. GET /api/admin/products), mirroring
 * com.example.sport_be.dto.common.PageResponse.
 */
export interface PageResponse<T> {
  content: T[]
  /** Current 0-based page index. */
  page: number
  /** Requested page size. */
  size: number
  /** Total number of items across every page. */
  totalElements: number
  /** Total number of pages. */
  totalPages: number
}
