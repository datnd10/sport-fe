import { apiClient } from './apiClient'
import type { PageResponse } from './common.types'
import type {
  AdminDiscountListParams,
  AvailableDiscountResponse,
  DiscountCodeCreateRequest,
  DiscountCodeResponse,
  DiscountValidationResponse,
} from './discountService.types'

// API client for the Discount_Code module (design.md — "Module Discount
// Code"): the public validation endpoint used during Checkout, plus the
// Admin management endpoints (list, create, deactivate).
// Requirements: 4.6, 4.7, 8.1, 8.2, 8.3, 8.4
const DISCOUNT_VALIDATE_BASE = '/discount-codes/validate'
const ADMIN_DISCOUNT_BASE = '/admin/discount-codes'

/**
 * Checks whether a Mã_Giảm_Giá is currently eligible to be applied to an
 * order: active, within its validity window, and under its usage limit
 * (Requirement 4.6, 8.3, 8.4). Rejects (via a thrown AxiosError) when the
 * code is invalid/expired/not found (Requirement 4.7).
 */
async function validateCode(code: string): Promise<DiscountValidationResponse> {
  const response = await apiClient.get<DiscountValidationResponse>(DISCOUNT_VALIDATE_BASE, {
    params: { code },
  })
  return response.data
}

/**
 * Fetches a paginated, optionally keyword-filtered page of Mã_Giảm_Giá
 * for the Admin management page (Requirement 8.1, 8.3), sorted by
 * validFrom descending. `page` is 0-based, mirroring the backend.
 * Requires an authenticated ROLE_ADMIN caller.
 */
async function getAllDiscountCodes(params: AdminDiscountListParams = {}): Promise<PageResponse<DiscountCodeResponse>> {
  const response = await apiClient.get<PageResponse<DiscountCodeResponse>>(ADMIN_DISCOUNT_BASE, {
    params: {
      page: params.page,
      size: params.size,
      keyword: params.keyword || undefined,
    },
  })
  return response.data
}

/**
 * Creates a new Mã_Giảm_Giá (Requirement 8.1). Rejects (via a thrown
 * AxiosError) when the code already exists (Requirement 8.2).
 */
async function createDiscountCode(payload: DiscountCodeCreateRequest): Promise<DiscountCodeResponse> {
  const response = await apiClient.post<DiscountCodeResponse>(ADMIN_DISCOUNT_BASE, payload)
  return response.data
}

/**
 * Deactivates a Mã_Giảm_Giá so it can no longer be applied to new
 * Đơn_Hàng (Requirement 8.3).
 */
async function deactivateDiscountCode(id: string): Promise<DiscountCodeResponse> {
  const response = await apiClient.put<DiscountCodeResponse>(`${ADMIN_DISCOUNT_BASE}/${id}/deactivate`)
  return response.data
}

export const discountService = {
  async getAvailableCodes(): Promise<AvailableDiscountResponse[]> {
    const response = await apiClient.get<AvailableDiscountResponse[]>('/discount-codes/available')
    return response.data
  },
  validateCode,
  getAllDiscountCodes,
  createDiscountCode,
  deactivateDiscountCode,
}

export default discountService
