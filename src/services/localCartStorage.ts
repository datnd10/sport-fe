// Controlled access point for persisting the Khách_Hàng vãng lai (guest)
// Giỏ_Hàng across page reloads. This module is the ONLY place allowed to
// read/write the guest cart's localStorage mirror, mirroring the pattern
// established by tokenStorage.ts for the auth token. Requirements: 3.6
const LOCAL_CART_KEY = 'guestCart'

/** A single guest-cart line item kept in localStorage (no server id yet). */
export interface LocalCartItem {
  variantId: string
  productName: string
  sku: string
  attributes: string
  unitPrice: number
  quantity: number
  stockQuantity: number
}

export function readLocalCart(): LocalCartItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupted/unavailable storage — treat as an empty guest cart.
    return []
  }
}

export function writeLocalCart(items: LocalCartItem[]): void {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
  } catch {
    // Ignore write failures; the in-memory cart still works for the
    // current session, it just won't survive a reload.
  }
}

export function clearLocalCart(): void {
  try {
    localStorage.removeItem(LOCAL_CART_KEY)
  } catch {
    // Ignore — nothing to clean up if storage is unavailable.
  }
}
