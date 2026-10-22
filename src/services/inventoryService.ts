import { apiClient } from './apiClient'
import type { PageResponse } from './common.types'
import type {
  AdminInventoryListParams,
  InventoryHistoryResponse,
  InventoryItemResponse,
  StockAdjustmentRequest,
} from './inventoryService.types'

// API client for the Admin Tồn_Kho (Inventory) management page
// (design.md — "Module Inventory"). Every endpoint here lives under
// /api/admin/** and requires ROLE_ADMIN per SecurityConfig.
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
const ADMIN_INVENTORY_BASE = '/admin/inventory'

/**
 * Fetches a paginated, optionally keyword-filtered page of the current
 * Tồn_Kho state (stockQuantity, lowStockThreshold, derived stockStatus)
 * across every Biến_Thể_Sản_Phẩm, sorted by SKU ascending (Requirement
 * 7.3, 7.4). `page` is 0-based, mirroring the backend.
 */
async function listInventory(params: AdminInventoryListParams = {}): Promise<PageResponse<InventoryItemResponse>> {
  const response = await apiClient.get<PageResponse<InventoryItemResponse>>(ADMIN_INVENTORY_BASE, {
    params: {
      page: params.page,
      size: params.size,
      keyword: params.keyword || undefined,
    },
  })
  return response.data
}

/**
 * Manually adjusts a Biến_Thể_Sản_Phẩm's stockQuantity to an absolute new
 * value (Requirement 7.1). Rejects (via a thrown AxiosError) when the
 * requested value is negative (Requirement 7.2).
 */
async function adjustStock(variantId: string, payload: StockAdjustmentRequest): Promise<InventoryItemResponse> {
  const response = await apiClient.put<InventoryItemResponse>(`${ADMIN_INVENTORY_BASE}/${variantId}`, payload)
  return response.data
}

/**
 * Fetches the Tồn_Kho change history (timestamp, changeAmount, reason)
 * for a single Biến_Thể_Sản_Phẩm (Requirement 7.5).
 */
async function getHistory(variantId: string): Promise<InventoryHistoryResponse[]> {
  const response = await apiClient.get<InventoryHistoryResponse[]>(`${ADMIN_INVENTORY_BASE}/${variantId}/history`)
  return response.data
}

export const inventoryService = {
  listInventory,
  adjustStock,
  getHistory,
}

export default inventoryService
