// Request/response shapes mirroring the backend Admin Category/Product
// DTOs (com.example.sport_be.dto.category.*, com.example.sport_be.dto.product.*)
// used by the Admin Danh_Mục/Sản_Phẩm management pages.
// Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10

/** Payload for POST /api/admin/categories (Requirement 1.1). */
export interface CreateCategoryRequest {
  name: string
}

/** Payload for PUT /api/admin/categories/{id}. */
export interface UpdateCategoryRequest {
  name: string
}

/**
 * Query parameters accepted by GET /api/admin/categories. `page` is
 * 0-based; all fields are optional on the caller side since the backend
 * applies its own defaults (page=0, size=20, sort=name asc).
 */
export interface AdminCategoryListParams {
  page?: number
  size?: number
  keyword?: string
}

/** A single Biến_Thể_Sản_Phẩm to create alongside a new Sản_Phẩm. */
export interface ProductVariantRequest {
  sku: string
  attributes?: string
  price: number
  stockQuantity: number
  lowStockThreshold?: number
}

/** Payload for POST /api/admin/products (Requirement 1.2, 1.6). */
export interface ProductCreateRequest {
  categoryId: string
  name: string
  description?: string
  basePrice: number
  variants: ProductVariantRequest[]
}

/** Payload for PUT /api/admin/products/{id} (Requirement 1.4). */
export interface ProductUpdateRequest {
  categoryId: string
  name: string
  description?: string
  basePrice: number
}

/** Payload for POST /api/admin/products/{id}/variants (Requirement 1.6, 1.7). */
export interface AddProductVariantRequest {
  sku: string
  attributes?: string
  price: number
  stockQuantity: number
  lowStockThreshold?: number
}

/**
 * Payload for PUT /api/admin/products/{id}/variants/{variantId}.
 * Mirrors the backend's UpdateProductVariantRequest DTO — deliberately
 * has no `stockQuantity` field, since Tồn_Kho changes must go
 * exclusively through InventoryService to keep the audit trail intact.
 */
export interface UpdateProductVariantRequest {
  sku: string
  attributes?: string
  price: number
  lowStockThreshold?: number
}

/**
 * Sortable columns for the Admin product list, mirroring the backend
 * whitelist in ProductService#ADMIN_LIST_SORTABLE_FIELDS.
 */
export type AdminProductSortBy = 'name' | 'basePrice' | 'createdAt'

/** Sort direction accepted by GET /api/admin/products. */
export type AdminProductSortDir = 'asc' | 'desc'

/**
 * Query parameters accepted by GET /api/admin/products (Requirement
 * 1.4). `page` is 0-based; all fields are optional on the caller side
 * since the backend applies its own defaults (page=0, size=20,
 * sort=createdAt desc).
 */
export interface AdminProductListParams {
  page?: number
  size?: number
  keyword?: string
  categoryId?: string
  sortBy?: AdminProductSortBy
  sortDir?: AdminProductSortDir
}
