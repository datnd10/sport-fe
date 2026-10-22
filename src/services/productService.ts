import { apiClient } from './apiClient'
import type { ProductDetailResponse, ProductListParams, ProductSearchResult } from './productService.types'

// API client for the Category & Product module (design.md — "Module
// Category & Product"). Talks to the public GET /api/products endpoint,
// which supports categoryId/keyword/minPrice/maxPrice plus arbitrary
// Biến_Thể_Sản_Phẩm attribute filters (Requirement 2.2, 2.3, 2.6) and
// also powers the homepage's featured products section (Requirement 2.1).
const PRODUCT_BASE = '/products'

/**
 * Fetches the public list of Sản_Phẩm, optionally filtered by
 * categoryId/keyword/price range/variant attributes (Requirement 2.2).
 * Passing no params returns the full active product list, which the
 * homepage uses (client-side) to show a set of featured products
 * (Requirement 2.1).
 */
async function listProducts(params?: ProductListParams): Promise<ProductSearchResult> {
  const response = await apiClient.get<ProductSearchResult>(PRODUCT_BASE, { params })
  return response.data
}

/**
 * Fetches the full public detail of a single Sản_Phẩm — price,
 * description, images, Biến_Thể_Sản_Phẩm and their Tồn_Kho status
 * (Requirement 2.5) — for the Product detail page.
 */
async function getProductDetail(productId: string): Promise<ProductDetailResponse> {
  const response = await apiClient.get<ProductDetailResponse>(`${PRODUCT_BASE}/${productId}`)
  return response.data
}

export const productService = {
  listProducts,
  getProductDetail,
}

export default productService
