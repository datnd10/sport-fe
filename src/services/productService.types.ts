// Request/response shapes mirroring the backend Category/Product DTOs
// (com.example.sport_be.dto.category.*, com.example.sport_be.dto.product.*).
// Requirements: 2.1, 2.2

export interface CategoryResponse {
  id: string
  name: string
  slug: string
}

export interface ProductVariantResponse {
  id: string
  sku: string
  attributes: string
  price: number
  stockQuantity: number
  lowStockThreshold: number
}

export interface ProductResponse {
  averageRating?: number
  reviewCount?: number
  id: string
  categoryId: string
  name: string
  description: string | null
  basePrice: number
  active: boolean
  variants: ProductVariantResponse[]
  images: ProductImageResponse[]
}

export interface ProductSearchResult {
  totalElements?: number
  totalPages?: number
  page?: number
  size?: number
  products: ProductResponse[]
  suggestedCategories: CategoryResponse[]
}

/** A single Hình_Ảnh_Sản_Phẩm, part of a ProductDetailResponse. */
export interface ProductImageResponse {
  id: string
  filePath: string
  displayOrder: number
}

/**
 * Full product detail returned by GET /api/products/{id}: price,
 * description, Danh_Mục, every Biến_Thể_Sản_Phẩm (with Tồn_Kho status)
 * and every Hình_Ảnh_Sản_Phẩm (Requirement 2.5).
 */
export interface ProductDetailResponse {
  id: string
  category: CategoryResponse
  name: string
  description: string | null
  basePrice: number
  active: boolean
  variants: ProductVariantResponse[]
  images: ProductImageResponse[]
}

/** Query parameters accepted by GET /api/products (Requirement 2.2, 2.6). */
export interface ProductListParams {
  page?: number
  size?: number
  minRating?: number
  sort?: string
  categoryId?: string
  keyword?: string
  minPrice?: number
  maxPrice?: number
  /** Extra Biến_Thể_Sản_Phẩm attribute filters, e.g. { size: '42' }. */
  [attribute: string]: string | number | undefined
}
