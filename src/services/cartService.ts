import { apiClient } from './apiClient'
import type {
  AddCartItemRequest,
  CartResponse,
  MergeCartItemRequest,
  UpdateCartItemRequest,
} from './cartService.types'

// API client for the Cart module (design.md — "Module Cart"). Every one
// of these endpoints requires an authenticated Account (see
// SecurityConfig's `anyRequest().authenticated()` default — there is no
// server-side Giỏ_Hàng for Khách_Hàng vãng lai/guests); guest carts are
// handled entirely client-side by cartStore.ts instead.
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
const CART_BASE = '/cart'

/** Fetches the current Account's Giỏ_Hàng (Requirement 3.1, 3.3). */
async function getCart(): Promise<CartResponse> {
  const response = await apiClient.get<CartResponse>(CART_BASE)
  return response.data
}

/**
 * Adds a Biến_Thể_Sản_Phẩm to the current Account's Giỏ_Hàng. Rejects
 * (via a thrown AxiosError) when the variant is out of stock
 * (Requirement 3.2).
 */
async function addItem(payload: AddCartItemRequest): Promise<CartResponse> {
  const response = await apiClient.post<CartResponse>(`${CART_BASE}/items`, payload)
  return response.data
}

/**
 * Updates the quantity of an existing Giỏ_Hàng item. The backend clamps
 * the quantity down to the variant's current stock instead of rejecting
 * the request when it's exceeded (Requirement 3.3, 3.4).
 */
async function updateItemQuantity(itemId: string, payload: UpdateCartItemRequest): Promise<CartResponse> {
  const response = await apiClient.put<CartResponse>(`${CART_BASE}/items/${itemId}`, payload)
  return response.data
}

/** Removes an item from the current Account's Giỏ_Hàng (Requirement 3.5). */
async function removeItem(itemId: string): Promise<CartResponse> {
  const response = await apiClient.delete<CartResponse>(`${CART_BASE}/items/${itemId}`)
  return response.data
}

/**
 * Merges the Khách_Hàng's temporary (local/guest) Giỏ_Hàng into the
 * current Account's server-side Giỏ_Hàng right after a successful login
 * (Requirement 3.6).
 */
async function mergeCart(localItems: MergeCartItemRequest[]): Promise<CartResponse> {
  const response = await apiClient.post<CartResponse>(`${CART_BASE}/merge`, localItems)
  return response.data
}

export const cartService = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  mergeCart,
}

export default cartService
