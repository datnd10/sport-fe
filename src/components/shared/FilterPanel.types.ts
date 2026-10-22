import type { ProductListParams } from '../../services/productService.types'

// Shared shape for the combined filter values edited by FilterPanel and
// consumed by pages that call productService.listProducts.
// Requirements: 2.6
export interface ProductFilterValues {
  categoryId: string
  minPrice: string
  maxPrice: string
  /** Biến_Thể_Sản_Phẩm attribute filters, e.g. { size: '42', color: 'Đỏ' }. */
  attributes: Record<string, string>
}

export function createEmptyFilterValues(): ProductFilterValues {
  return { categoryId: '', minPrice: '', maxPrice: '', attributes: {} }
}

/** True when no filter field (price/category/attributes) is set. */
export function isFilterEmpty(value: ProductFilterValues): boolean {
  return (
    value.categoryId === '' &&
    value.minPrice === '' &&
    value.maxPrice === '' &&
    Object.keys(value.attributes).length === 0
  )
}

/**
 * Combines keyword + filter values into the query params accepted by
 * GET /api/products, AND'ing every filter condition together
 * (Requirement 2.6).
 */
export function toProductListParams(keyword: string, value: ProductFilterValues): ProductListParams {
  const params: ProductListParams = {}

  if (keyword.trim() !== '') {
    params.keyword = keyword.trim()
  }
  if (value.categoryId !== '') {
    params.categoryId = value.categoryId
  }
  if (value.minPrice !== '') {
    params.minPrice = Number(value.minPrice)
  }
  if (value.maxPrice !== '') {
    params.maxPrice = Number(value.maxPrice)
  }
  for (const [key, attributeValue] of Object.entries(value.attributes)) {
    if (attributeValue.trim() !== '') {
      params[key] = attributeValue
    }
  }

  return params
}
