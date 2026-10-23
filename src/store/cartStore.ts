import { create } from 'zustand'
import cartService from '../services/cartService'
import { getErrorMessage } from '../services/apiError'
import {
  clearLocalCart,
  readLocalCart,
  writeLocalCart,
  type LocalCartItem,
} from '../services/localCartStorage'
import { notifyError, notifySuccess } from '../services/toast'
import { useAccountStore } from './accountStore'

// Giỏ_Hàng (Cart) store (design.md — "Module Cart").
//
// Khách_Hàng vãng lai (guests, Requirement 3.6): the cart lives entirely
// client-side, persisted to localStorage via localCartStorage.ts. There is
// no server-side Giỏ_Hàng to call into — every /api/cart/** route requires
// authentication (see SecurityConfig) — so stock limits (Requirement 3.2,
// 3.3, 3.4) are enforced here using the `stockQuantity` snapshot captured
// when the item was added/last synced from the product detail page.
//
// Tài_Khoản đã đăng nhập (authenticated accounts): every action calls the
// backend Cart API (GET /api/cart, POST /api/cart/items, PUT/DELETE
// /api/cart/items/{itemId}) and CartService there is the sole authority on
// stock limits, so the store simply mirrors whatever CartResponse comes
// back (Requirement 3.1, 3.2, 3.3, 3.4, 3.5).
//
// UI components (CartPage, Header's cart badge, ...) only ever see this
// one CartItemView[] shape and call addItem/updateItemQuantity/removeItem
// — they never need to branch on guest vs. authenticated mode.
export interface CartItemView {
  productId?: string
  imagePath?: string | null
  /** The server-side cart item id once authenticated; the variantId for
   * guest carts (which have no server-assigned item id). Stable enough to
   * use as a React list key and as the id updateItemQuantity/removeItem
   * take. */
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

/**
 * Pure function computing a Giỏ_Hàng's total amount from its items. Kept
 * as a standalone export so task 26.2's dedicated client-side total
 * calculation logic (and its fast-check property tests, task 26.3) can
 * reuse or extend it without touching store internals.
 *
 * **Validates: Requirements 3.3, 3.4** (tổng tiền Giỏ_Hàng luôn bằng tổng
 * giá × số lượng của toàn bộ các mục).
 */
export function calculateCartTotal(items: Pick<CartItemView, 'lineTotal'>[]): number {
  return items.reduce((sum, item) => sum + item.lineTotal, 0)
}

function toLineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity
}

function localItemToView(item: LocalCartItem): CartItemView {
  return {
    id: item.variantId,
    variantId: item.variantId,
    productName: item.productName,
    sku: item.sku,
    attributes: item.attributes,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    stockQuantity: item.stockQuantity,
    lineTotal: toLineTotal(item.unitPrice, item.quantity),
  }
}

function viewToLocalItem(item: CartItemView): LocalCartItem {
  return {
    variantId: item.variantId,
    productName: item.productName,
    sku: item.sku,
    attributes: item.attributes,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    stockQuantity: item.stockQuantity,
  }
}

function serverItemToView(item: {
  id: string
  variantId: string
  productName: string
  sku: string
  attributes: string
  unitPrice: number
  quantity: number
  stockQuantity: number
  lineTotal: number
}): CartItemView {
  return { ...item }
}

/** Minimal shape needed to add a variant to the cart from a product page. */
export interface AddToCartInput {
  variantId: string
  productName: string
  sku: string
  attributes: string
  unitPrice: number
  stockQuantity: number
  quantity: number
}

interface CartState {
  items: CartItemView[]
  itemCount: number
  totalAmount: number
  /** True while an add/update/remove/load call is in flight. */
  isLoading: boolean
  /** Last user-facing message (e.g. "hết hàng", "đã giới hạn theo tồn kho"). */
  message: string | null

  /** Loads the cart: GET /api/cart when authenticated, local storage otherwise. */
  loadCart: () => Promise<void>
  /**
   * Adds a Biến_Thể_Sản_Phẩm to the Giỏ_Hàng. Rejects when stock is 0
   * (Requirement 3.2); when authenticated, the backend is the source of
   * truth for this check, when a guest, the store checks the
   * `stockQuantity` snapshot passed in.
   */
  addItem: (input: AddToCartInput) => Promise<void>
  /**
   * Updates a Giỏ_Hàng item's quantity, clamping to available stock
   * instead of rejecting when the request exceeds it (Requirement 3.3, 3.4).
   */
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>
  /** Removes an item from the Giỏ_Hàng (Requirement 3.5). */
  removeItem: (itemId: string) => Promise<void>
  /** Clears any user-facing message (e.g. once the user dismisses it). */
  clearMessage: () => void
  /**
   * Merges the guest's local Giỏ_Hàng (localStorage) into the Account's
   * server-side Giỏ_Hàng right after a successful login, via POST
   * /api/cart/merge (Requirement 3.6). No-ops when the local cart is
   * empty — there is nothing to merge. On success, the local guest cart
   * is cleared and the store switches over to the merged server cart.
   * On failure, the local guest cart is left untouched (so nothing is
   * lost) and a message is surfaced, without rethrowing — a failed merge
   * must not block the login flow itself.
   */
  mergeGuestCartOnLogin: () => Promise<void>
  reset: () => void
}

function recomputeTotals(items: CartItemView[]): { itemCount: number; totalAmount: number } {
  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: calculateCartTotal(items),
  }
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  itemCount: 0,
  totalAmount: 0,
  isLoading: false,
  message: null,

  loadCart: async () => {
    const { isAuthenticated } = useAccountStore.getState()
    if (!isAuthenticated) {
      const items = readLocalCart().map(localItemToView)
      set({ items, ...recomputeTotals(items) })
      return
    }

    set({ isLoading: true })
    try {
      const cart = await cartService.getCart()
      const items = cart.items.map(serverItemToView)
      set({ items, ...recomputeTotals(items) })
    } finally {
      set({ isLoading: false })
    }
  },

  addItem: async (input) => {
    const { isAuthenticated } = useAccountStore.getState()

    if (!isAuthenticated) {
      if (input.stockQuantity === 0) {
        set({ message: 'Sản phẩm này đã hết hàng.' })
        notifyError('Sản phẩm này đã hết hàng.')
        return
      }

      const current = readLocalCart()
      const existingIndex = current.findIndex((item) => item.variantId === input.variantId)
      const requestedQuantity =
        existingIndex >= 0 ? current[existingIndex].quantity + input.quantity : input.quantity
      const cappedQuantity = Math.min(requestedQuantity, input.stockQuantity)

      const nextLocalItems =
        existingIndex >= 0
          ? current.map((item, index) =>
              index === existingIndex
                ? { ...item, quantity: cappedQuantity, stockQuantity: input.stockQuantity }
                : item,
            )
          : [
              ...current,
              {
                variantId: input.variantId,
                productName: input.productName,
                sku: input.sku,
                attributes: input.attributes,
                unitPrice: input.unitPrice,
                quantity: cappedQuantity,
                stockQuantity: input.stockQuantity,
              },
            ]

      writeLocalCart(nextLocalItems)
      const items = nextLocalItems.map(localItemToView)
      const wasClamped = cappedQuantity < requestedQuantity
      set({
        items,
        ...recomputeTotals(items),
        message: wasClamped ? 'Số lượng đã được giới hạn theo tồn kho hiện có.' : null,
      })
      if (wasClamped) {
        notifyError('Số lượng đã được giới hạn theo tồn kho hiện có.')
      } else {
        notifySuccess('Đã thêm sản phẩm vào giỏ hàng.')
      }
      return
    }

    set({ isLoading: true })
    try {
      const cart = await cartService.addItem({ variantId: input.variantId, quantity: input.quantity })
      const items = cart.items.map(serverItemToView)
      set({ items, ...recomputeTotals(items), message: null })
      notifySuccess('Đã thêm sản phẩm vào giỏ hàng.')
    } catch (error) {
      set({ message: getErrorMessage(error, 'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.') })
    } finally {
      set({ isLoading: false })
    }
  },

  updateItemQuantity: async (itemId, quantity) => {
    const { isAuthenticated } = useAccountStore.getState()

    if (!isAuthenticated) {
      const current = readLocalCart()
      const target = current.find((item) => item.variantId === itemId)
      if (!target) {
        return
      }
      const cappedQuantity = Math.min(quantity, target.stockQuantity)
      const nextLocalItems = current.map((item) =>
        item.variantId === itemId ? { ...item, quantity: cappedQuantity } : item,
      )
      writeLocalCart(nextLocalItems)
      const items = nextLocalItems.map(localItemToView)
      const wasClamped = cappedQuantity < quantity
      set({
        items,
        ...recomputeTotals(items),
        message: wasClamped ? 'Số lượng đã được giới hạn theo tồn kho hiện có.' : null,
      })
      if (wasClamped) {
        notifyError('Số lượng đã được giới hạn theo tồn kho hiện có.')
      } else {
        notifySuccess('Đã cập nhật số lượng sản phẩm.')
      }
      return
    }

    set({ isLoading: true })
    try {
      const cart = await cartService.updateItemQuantity(itemId, { quantity })
      const items = cart.items.map(serverItemToView)
      const updatedItem = items.find((item) => item.id === itemId)
      const wasClamped = Boolean(updatedItem && updatedItem.quantity < quantity)
      set({
        items,
        ...recomputeTotals(items),
        message: wasClamped ? 'Số lượng đã được giới hạn theo tồn kho hiện có.' : null,
      })
      notifySuccess(wasClamped ? 'Số lượng đã được giới hạn theo tồn kho hiện có.' : 'Đã cập nhật số lượng sản phẩm.')
    } catch (error) {
      set({ message: getErrorMessage(error, 'Không thể cập nhật số lượng. Vui lòng thử lại.') })
    } finally {
      set({ isLoading: false })
    }
  },

  removeItem: async (itemId) => {
    const { isAuthenticated } = useAccountStore.getState()

    if (!isAuthenticated) {
      const nextLocalItems = readLocalCart().filter((item) => item.variantId !== itemId)
      writeLocalCart(nextLocalItems)
      const items = nextLocalItems.map(localItemToView)
      set({ items, ...recomputeTotals(items), message: null })
      notifySuccess('Đã xóa sản phẩm khỏi giỏ hàng.')
      return
    }

    set({ isLoading: true })
    try {
      const cart = await cartService.removeItem(itemId)
      const items = cart.items.map(serverItemToView)
      set({ items, ...recomputeTotals(items), message: null })
      notifySuccess('Đã xóa sản phẩm khỏi giỏ hàng.')
    } catch (error) {
      set({ message: getErrorMessage(error, 'Không thể xóa sản phẩm khỏi giỏ hàng. Vui lòng thử lại.') })
    } finally {
      set({ isLoading: false })
    }
  },

  clearMessage: () => set({ message: null }),

  mergeGuestCartOnLogin: async () => {
    const localItems = readLocalCart()
    if (localItems.length === 0) {
      return
    }

    set({ isLoading: true })
    try {
      const cart = await cartService.mergeCart(
        localItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      )
      clearLocalCart()
      const items = cart.items.map(serverItemToView)
      set({ items, ...recomputeTotals(items), message: null })
    } catch (error) {
      set({ message: getErrorMessage(error, 'Không thể hợp nhất giỏ hàng. Giỏ hàng tạm của bạn vẫn được giữ lại.') })
    } finally {
      set({ isLoading: false })
    }
  },

  reset: () => {
    clearLocalCart()
    set({ items: [], itemCount: 0, totalAmount: 0, isLoading: false, message: null })
  },
}))

// Re-exported so other modules (e.g. task 26.2's merge-on-login logic)
// can read/write the guest cart snapshot without reaching into
// localCartStorage.ts directly, and so viewToLocalItem's shape stays in
// sync with CartItemView.
export { viewToLocalItem }
