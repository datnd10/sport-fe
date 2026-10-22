// Request/response shapes mirroring the backend Admin Inventory DTOs
// (com.example.sport_be.dto.inventory.*) used by the Admin Tồn_Kho
// management page.
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5

/** Derived stock status for a Biến_Thể_Sản_Phẩm (Property 27). */
export type StockStatus = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK'

/**
 * A single Biến_Thể_Sản_Phẩm's inventory state, returned by
 * GET /api/admin/inventory (Requirement 7.3, 7.4).
 */
export interface InventoryItemResponse {
  variantId: string
  sku: string
  productId: string
  productName: string
  attributes?: string | null
  price: number
  stockQuantity: number
  lowStockThreshold: number
  stockStatus: StockStatus
}

/** Reason a Tồn_Kho change happened, mirrors InventoryChangeReason.java. */
export type InventoryChangeReason = 'ORDER_PLACED' | 'ORDER_CANCELLED' | 'MANUAL_ADJUSTMENT'

/**
 * A single InventoryHistory entry, returned by
 * GET /api/admin/inventory/{variantId}/history (Requirement 7.5).
 */
export interface InventoryHistoryResponse {
  id: string
  variantId: string
  changeAmount: number
  reason: InventoryChangeReason
  changedAt: string
}

/** Payload for PUT /api/admin/inventory/{variantId} (Requirement 7.1, 7.2). */
export interface StockAdjustmentRequest {
  newQuantity: number
}

/**
 * Query parameters accepted by GET /api/admin/inventory (Requirement
 * 7.3, 7.4). `page` is 0-based; all fields are optional on the caller
 * side since the backend applies its own defaults (page=0, size=20).
 * `keyword` performs a case-insensitive, partial-match search on SKU
 * or the related Sản_Phẩm's name.
 */
export interface AdminInventoryListParams {
  page?: number
  size?: number
  keyword?: string
}
