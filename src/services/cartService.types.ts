// Request/response shapes mirroring the backend Cart DTOs
// (com.example.sport_be.dto.cart.*). Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6

/** A single line item within a Giỏ_Hàng (Cart), as returned by the backend. */
export interface CartItemResponse {
  id: string
  variantId: string
  productName: string
  sku: string
  attributes: string
  unitPrice: number
  quantity: number
  stockQuantity: number
  lineTotal: number
}

/** A Giỏ_Hàng (Cart) and its items, returned by GET/POST/PUT/DELETE /api/cart/**. */
export interface CartResponse {
  id: string
  items: CartItemResponse[]
  totalAmount: number
}

export interface AddCartItemRequest {
  variantId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

/** A single variantId/quantity pair sent as part of POST /api/cart/merge. */
export interface MergeCartItemRequest {
  variantId: string
  quantity: number
}
