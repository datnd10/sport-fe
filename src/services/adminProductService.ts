import { apiClient } from './apiClient'
import type { PageResponse } from './common.types'
import type { ProductDetailResponse, ProductResponse } from './productService.types'
import type {
  AddProductVariantRequest,
  AdminProductListParams,
  ProductCreateRequest,
  ProductUpdateRequest,
  UpdateProductVariantRequest,
} from './adminProductService.types'

// API client for the Admin Sản_Phẩm (Product) management pages
// (design.md — "Module Category & Product"). Every endpoint here lives
// under /api/admin/** and requires ROLE_ADMIN per SecurityConfig.
// Requirements: 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10
const ADMIN_PRODUCT_BASE = '/admin/products'

/**
 * Fetches a paginated, optionally filtered page of Sản_Phẩm regardless
 * of active/soft-deleted status, for the Admin product management list
 * (Requirement 1.4, 1.5). `page` is 0-based, mirroring the backend.
 */
async function listAllProducts(params: AdminProductListParams = {}): Promise<PageResponse<ProductResponse>> {
  const response = await apiClient.get<PageResponse<ProductResponse>>(ADMIN_PRODUCT_BASE, {
    params: {
      page: params.page,
      size: params.size,
      keyword: params.keyword || undefined,
      categoryId: params.categoryId || undefined,
      sortBy: params.sortBy || undefined,
      sortDir: params.sortDir || undefined,
    },
  })
  return response.data
}

/**
 * Fetches the full detail (including images and variants) of a single
 * Sản_Phẩm for the edit form. Reuses the public detail endpoint, which
 * returns the product regardless of its active flag.
 */
async function getProductDetail(productId: string): Promise<ProductDetailResponse> {
  const response = await apiClient.get<ProductDetailResponse>(`/products/${productId}`)
  return response.data
}

/**
 * Creates a new Sản_Phẩm together with its initial Biến_Thể_Sản_Phẩm
 * list (Requirement 1.2, 1.6). Rejects (via a thrown AxiosError) when
 * name/price are missing (Requirement 1.3) or a requested SKU is already
 * in use (Requirement 1.7).
 */
async function createProduct(payload: ProductCreateRequest): Promise<ProductResponse> {
  const response = await apiClient.post<ProductResponse>(ADMIN_PRODUCT_BASE, payload)
  return response.data
}

/**
 * Updates an existing Sản_Phẩm's own fields (Requirement 1.4). Rejects
 * (via a thrown AxiosError) when name/price are missing (Requirement 1.3).
 */
async function updateProduct(productId: string, payload: ProductUpdateRequest): Promise<ProductResponse> {
  const response = await apiClient.put<ProductResponse>(`${ADMIN_PRODUCT_BASE}/${productId}`, payload)
  return response.data
}

/**
 * Soft-deletes a Sản_Phẩm, hiding it from the public listing while
 * keeping it (and its historical OrderItem snapshots) intact
 * (Requirement 1.5).
 */
async function deleteProduct(productId: string): Promise<void> {
  await apiClient.delete<void>(`${ADMIN_PRODUCT_BASE}/${productId}`)
}

/**
 * Adds a new Biến_Thể_Sản_Phẩm to an existing Sản_Phẩm (Requirement 1.6).
 * Rejects (via a thrown AxiosError) when the SKU is already in use
 * (Requirement 1.7, errorCode DUPLICATE_SKU).
 */
async function addVariant(productId: string, payload: AddProductVariantRequest): Promise<ProductResponse> {
  const response = await apiClient.post<ProductResponse>(`${ADMIN_PRODUCT_BASE}/${productId}/variants`, payload)
  return response.data
}

/**
 * Updates an existing Biến_Thể_Sản_Phẩm's own fields (SKU, attributes,
 * price, low-stock threshold). Deliberately does not touch stockQuantity
 * — stock changes must go through InventoryService instead. Rejects
 * (via a thrown AxiosError) when the new SKU is already in use by
 * another variant (errorCode DUPLICATE_SKU / ConflictException).
 */
async function updateVariant(
  productId: string,
  variantId: string,
  payload: UpdateProductVariantRequest,
): Promise<ProductResponse> {
  const response = await apiClient.put<ProductResponse>(
    `${ADMIN_PRODUCT_BASE}/${productId}/variants/${variantId}`,
    payload,
  )
  return response.data
}

/**
 * Soft-deletes a Biến_Thể_Sản_Phẩm (sets active=false) instead of
 * editing it in place. The backend filters inactive variants out of
 * the returned ProductResponse, so the UI simplifies to view + delete
 * + add-new instead of full inline editing.
 */
async function deleteVariant(productId: string, variantId: string): Promise<ProductResponse> {
  const response = await apiClient.delete<ProductResponse>(`${ADMIN_PRODUCT_BASE}/${productId}/variants/${variantId}`)
  return response.data
}

/**
 * Uploads one or more Hình_Ảnh_Sản_Phẩm for a Sản_Phẩm (Requirement 1.8,
 * 1.10). Rejects (via a thrown AxiosError) when a file has an
 * unsupported format or exceeds the maximum allowed size.
 */
async function uploadImages(productId: string, files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await apiClient.post(`${ADMIN_PRODUCT_BASE}/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/** Deletes a Hình_Ảnh_Sản_Phẩm from a Sản_Phẩm (Requirement 1.9). */
async function deleteImage(productId: string, imageId: string): Promise<void> {
  await apiClient.delete<void>(`${ADMIN_PRODUCT_BASE}/${productId}/images/${imageId}`)
}

export const adminProductService = {
  listAllProducts,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
  uploadImages,
  deleteImage,
}

export default adminProductService
