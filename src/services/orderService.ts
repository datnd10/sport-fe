import { apiClient } from './apiClient'
import type { PageResponse } from './common.types'
import type {
  AdminOrderListParams,
  CreateOrderRequest,
  OrderResponse,
  OrderSummaryResponse,
  UpdateOrderStatusRequest,
} from './orderService.types'

// API client for the Order & Checkout module (design.md — "Module Order
// & Checkout"). POST /api/orders is public (available to both guests and
// authenticated Customers — see OrderController.java), so this service
// can be called regardless of auth state; apiClient's request
// interceptor still attaches the JWT when present so logged-in orders
// are associated with the Account.
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
const ORDER_BASE = '/orders'

/**
 * Places a new Đơn_Hàng from the submitted line items and shipping info
 * (Requirement 4.1, 4.3). The response includes the order's bankTransferInfo
 * when paymentMethod is BANK_TRANSFER (Requirement 4.4) and the orderCode
 * used on the confirmation page (Requirement 4.8).
 */
async function createOrder(payload: CreateOrderRequest): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>(ORDER_BASE, payload)
  return response.data
}

/**
 * Fetches the order history for the currently authenticated Customer:
 * only Đơn_Hàng belonging to that Account (Requirement 5.1). Requires an
 * authenticated caller — apiClient's interceptors handle redirecting to
 * login on a 401.
 */
async function getMyOrders(): Promise<OrderSummaryResponse[]> {
  const response = await apiClient.get<OrderSummaryResponse[]>(ORDER_BASE)
  return response.data
}

/**
 * Fetches a single Đơn_Hàng's full detail: purchased line items,
 * quantities, prices, payment method, and shipping address
 * (Requirement 5.6).
 */
async function getOrderById(orderId: string): Promise<OrderResponse> {
  const response = await apiClient.get<OrderResponse>(`${ORDER_BASE}/${orderId}`)
  return response.data
}

const ADMIN_ORDER_BASE = '/admin/orders'

/**
 * Fetches a paginated, optionally filtered page of every Đơn_Hàng,
 * including customer info, total amount, and current
 * Trạng_Thái_Đơn_Hàng, for the Admin order management page
 * (Requirement 5.2). `page` is 0-based, mirroring the backend.
 * `keyword` searches by orderCode OR customer name/email; `status`
 * filters by Trạng_Thái_Đơn_Hàng. Requires an authenticated ROLE_ADMIN
 * caller.
 */
async function getAllOrders(params: AdminOrderListParams = {}): Promise<PageResponse<OrderSummaryResponse>> {
  const response = await apiClient.get<PageResponse<OrderSummaryResponse>>(ADMIN_ORDER_BASE, {
    params: {
      page: params.page,
      size: params.size,
      keyword: params.keyword || undefined,
      status: params.status || undefined,
    },
  })
  return response.data
}

/**
 * Updates an Đơn_Hàng's Trạng_Thái_Đơn_Hàng to the target status
 * (Requirement 5.3). Also used to cancel an order by passing
 * `{ status: 'CANCELLED' }` (Requirement 5.4). The backend rejects
 * transitions that don't follow the allowed state machine sequence
 * (Requirement 5.5) with an error response surfaced via getErrorMessage.
 */
async function updateOrderStatus(orderId: string, payload: UpdateOrderStatusRequest): Promise<OrderResponse> {
  const response = await apiClient.put<OrderResponse>(`${ADMIN_ORDER_BASE}/${orderId}/status`, payload)
  return response.data
}

export const orderService = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
}

export default orderService
