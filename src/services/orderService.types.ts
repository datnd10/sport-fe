// Request/response shapes mirroring the backend Order DTOs
// (com.example.sport_be.dto.order.*). Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8

export type PaymentMethod = 'COD' | 'BANK_TRANSFER'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'

/** A single variantId/quantity pair sent as part of POST /api/orders. */
export interface OrderItemRequest {
  variantId: string
  quantity: number
}

export interface CreateOrderRequest {
  items: OrderItemRequest[]
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  paymentMethod: PaymentMethod
  discountCode?: string
}

export interface OrderItemResponse {
  id: string
  productId?: string
  imagePath?: string | null
  productName: string
  sku: string
  attributes: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

/**
 * Shop bank account/QR info returned alongside an OrderResponse when the
 * chosen Phương_Thức_Thanh_Toán is Chuyển_Khoản_Ngân_Hàng (Requirement 4.4).
 */
export interface BankTransferInfoResponse {
  bankName: string
  accountNumber: string
  accountHolder: string
  qrImageUrl: string
}

/** Returned by POST /api/orders as the order confirmation data (Requirement 4.8). */
export interface OrderResponse {
  id: string
  orderCode: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  subtotal: number
  discountAmount: number
  totalAmount: number
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  items: OrderItemResponse[]
  bankTransferInfo: BankTransferInfoResponse | null
  createdAt: string
}

/**
 * Lightweight summary of an Đơn_Hàng used for list views: the
 * Customer's own order history (GET /api/orders, Requirement 5.1) and
 * the Admin's full order list (GET /api/admin/orders, Requirement 5.2).
 * Mirrors OrderSummaryResponse.java.
 */
export interface OrderSummaryResponse {
  id: string
  orderCode: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  totalAmount: number
  accountEmail: string | null
  accountFullName: string | null
  createdAt: string
  items?: OrderItemResponse[]
}

/** Request payload for PUT /api/admin/orders/{id}/status (Requirement 5.3, 5.5). */
export interface UpdateOrderStatusRequest {
  status: OrderStatus
}

/**
 * Query parameters accepted by GET /api/admin/orders (Requirement 5.2).
 * `page` is 0-based; all fields are optional on the caller side since
 * the backend applies its own defaults (page=0, size=20, sort=createdAt
 * desc). `keyword` matches against orderCode OR the customer's
 * name/email; `status` filters by Trạng_Thái_Đơn_Hàng — an invalid
 * status value is ignored by the backend rather than erroring.
 */
export interface AdminOrderListParams {
  page?: number
  size?: number
  keyword?: string
  status?: OrderStatus
}
