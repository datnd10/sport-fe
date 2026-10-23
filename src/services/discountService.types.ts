// Request/response shapes mirroring the backend Discount DTOs
// (com.example.sport_be.dto.discount.*). Requirements: 4.6, 4.7, 8.1, 8.2, 8.3, 8.4

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export interface AvailableDiscountResponse {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  validTo: string
}

/**
 * Returned by GET /api/discount-codes/validate when a Mã_Giảm_Giá is
 * currently eligible to be applied to an order. Ineligible codes result
 * in an error response instead (see apiError.ts), not a `valid: false`
 * body.
 */
export interface DiscountValidationResponse {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  valid: boolean
}

/**
 * A single Mã_Giảm_Giá, as returned by GET /api/admin/discount-codes,
 * POST /api/admin/discount-codes and PUT
 * /api/admin/discount-codes/{id}/deactivate (Requirement 8.1, 8.3).
 */
export interface DiscountCodeResponse {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  validFrom: string
  validTo: string
  maxUsage: number
  usageCount: number
  active: boolean
}

/**
 * Request payload for POST /api/admin/discount-codes: creates a new
 * Mã_Giảm_Giá (Requirement 8.1, 8.2). `validFrom`/`validTo` are ISO-8601
 * instant strings.
 */
export interface DiscountCodeCreateRequest {
  code: string
  discountType: DiscountType
  discountValue: number
  validFrom: string
  validTo: string
  maxUsage: number
}

/**
 * Query parameters accepted by GET /api/admin/discount-codes. `page` is
 * 0-based; all fields are optional on the caller side since the backend
 * applies its own defaults (page=0, size=20, sort=validFrom desc).
 */
export interface AdminDiscountListParams {
  page?: number
  size?: number
  keyword?: string
}
