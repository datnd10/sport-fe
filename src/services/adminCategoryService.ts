import { apiClient } from './apiClient'
import type { PageResponse } from './common.types'
import type { CategoryResponse } from './productService.types'
import type { AdminCategoryListParams, CreateCategoryRequest, UpdateCategoryRequest } from './adminProductService.types'

// API client for the Admin Danh_Mục (Category) management page
// (design.md — "Module Category & Product"). Talks to the
// /api/admin/categories endpoints, which require ROLE_ADMIN per
// SecurityConfig.
// Requirements: 1.1
const ADMIN_CATEGORY_BASE = '/admin/categories'

/**
 * Creates a new Danh_Mục (Requirement 1.1). Rejects (via a thrown
 * AxiosError carrying fieldErrors) when the name is missing/blank or
 * already in use.
 */
async function createCategory(payload: CreateCategoryRequest): Promise<CategoryResponse> {
  const response = await apiClient.post<CategoryResponse>(ADMIN_CATEGORY_BASE, payload)
  return response.data
}

/**
 * Fetches a paginated, optionally keyword-filtered page of Danh_Mục
 * (sorted by name ascending) for the Admin category management list.
 * `page` is 0-based, mirroring the backend.
 */
async function listAllCategories(params: AdminCategoryListParams = {}): Promise<PageResponse<CategoryResponse>> {
  const response = await apiClient.get<PageResponse<CategoryResponse>>(ADMIN_CATEGORY_BASE, {
    params: {
      page: params.page,
      size: params.size,
      keyword: params.keyword || undefined,
    },
  })
  return response.data
}

/**
 * Updates an existing Danh_Mục's name. Danh_Mục has no delete endpoint —
 * Sản_Phẩm may reference it, so renaming is the only supported edit.
 * Rejects (via a thrown AxiosError carrying fieldErrors) when the name
 * is missing/blank or already in use by another Danh_Mục.
 */
async function updateCategory(categoryId: string, payload: UpdateCategoryRequest): Promise<CategoryResponse> {
  const response = await apiClient.put<CategoryResponse>(`${ADMIN_CATEGORY_BASE}/${categoryId}`, payload)
  return response.data
}

export const adminCategoryService = {
  createCategory,
  listAllCategories,
  updateCategory,
}

export default adminCategoryService
