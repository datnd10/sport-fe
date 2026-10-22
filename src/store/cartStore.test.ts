import { beforeEach, describe, expect, it, vi } from 'vitest'
import cartService from '../services/cartService'
import { useAccountStore } from './accountStore'
import { calculateCartTotal, useCartStore } from './cartStore'

vi.mock('../services/cartService', () => ({
  default: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItemQuantity: vi.fn(),
    removeItem: vi.fn(),
    mergeCart: vi.fn(),
  },
}))

const mockedCartService = vi.mocked(cartService)

function setAuthenticated(isAuthenticated: boolean) {
  useAccountStore.setState({ isAuthenticated })
}

describe('calculateCartTotal', () => {
  it('sums the lineTotal of every item', () => {
    expect(
      calculateCartTotal([{ lineTotal: 100 }, { lineTotal: 250 }, { lineTotal: 0 }]),
    ).toBe(350)
  })

  it('returns 0 for an empty cart', () => {
    expect(calculateCartTotal([])).toBe(0)
  })
})

describe('useCartStore (guest/localStorage mode)', () => {
  beforeEach(() => {
    localStorage.clear()
    setAuthenticated(false)
    useCartStore.getState().reset()
    vi.clearAllMocks()
  })

  it('starts with an empty cart', () => {
    expect(useCartStore.getState().itemCount).toBe(0)
    expect(useCartStore.getState().totalAmount).toBe(0)
  })

  it('reset keeps the item count at zero', () => {
    useCartStore.getState().reset()
    expect(useCartStore.getState().itemCount).toBe(0)
  })

  it('adding an in-stock variant increases the item count and total (Requirement 3.1)', async () => {
    await useCartStore.getState().addItem({
      variantId: 'v1',
      productName: 'Vợt cầu lông',
      sku: 'SKU-1',
      attributes: 'Màu đỏ',
      unitPrice: 100,
      stockQuantity: 5,
      quantity: 2,
    })

    const state = useCartStore.getState()
    expect(state.itemCount).toBe(2)
    expect(state.totalAmount).toBe(200)
    expect(state.items).toHaveLength(1)
    expect(mockedCartService.addItem).not.toHaveBeenCalled()
  })

  it('rejects adding an out-of-stock variant (Requirement 3.2)', async () => {
    await useCartStore.getState().addItem({
      variantId: 'v1',
      productName: 'Vợt cầu lông',
      sku: 'SKU-1',
      attributes: 'Màu đỏ',
      unitPrice: 100,
      stockQuantity: 0,
      quantity: 1,
    })

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(0)
    expect(state.message).toMatch(/hết hàng/)
  })

  it('clamps quantity updates to available stock (Requirement 3.3, 3.4)', async () => {
    await useCartStore.getState().addItem({
      variantId: 'v1',
      productName: 'Vợt cầu lông',
      sku: 'SKU-1',
      attributes: 'Màu đỏ',
      unitPrice: 100,
      stockQuantity: 3,
      quantity: 1,
    })

    await useCartStore.getState().updateItemQuantity('v1', 10)

    const state = useCartStore.getState()
    expect(state.items[0].quantity).toBe(3)
    expect(state.totalAmount).toBe(300)
    expect(state.message).toMatch(/giới hạn/)
  })

  it('removes an item and updates the total (Requirement 3.5)', async () => {
    await useCartStore.getState().addItem({
      variantId: 'v1',
      productName: 'Vợt cầu lông',
      sku: 'SKU-1',
      attributes: 'Màu đỏ',
      unitPrice: 100,
      stockQuantity: 5,
      quantity: 2,
    })

    await useCartStore.getState().removeItem('v1')

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(0)
    expect(state.totalAmount).toBe(0)
  })

  it('mergeGuestCartOnLogin is a no-op when the local cart is empty (Requirement 3.6)', async () => {
    await useCartStore.getState().mergeGuestCartOnLogin()
    expect(mockedCartService.mergeCart).not.toHaveBeenCalled()
  })

  it('mergeGuestCartOnLogin sends the local cart and switches to the merged server cart (Requirement 3.6)', async () => {
    await useCartStore.getState().addItem({
      variantId: 'v1',
      productName: 'Vợt cầu lông',
      sku: 'SKU-1',
      attributes: 'Màu đỏ',
      unitPrice: 100,
      stockQuantity: 5,
      quantity: 2,
    })

    mockedCartService.mergeCart.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          variantId: 'v1',
          productName: 'Vợt cầu lông',
          sku: 'SKU-1',
          attributes: 'Màu đỏ',
          unitPrice: 100,
          quantity: 2,
          stockQuantity: 5,
          lineTotal: 200,
        },
      ],
      totalAmount: 200,
    })

    await useCartStore.getState().mergeGuestCartOnLogin()

    expect(mockedCartService.mergeCart).toHaveBeenCalledWith([{ variantId: 'v1', quantity: 2 }])
    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].id).toBe('item-1')
    expect(state.totalAmount).toBe(200)
    expect(localStorage.getItem('guestCart')).toBeNull()
  })

  it('mergeGuestCartOnLogin keeps the local cart and surfaces a message on failure (Requirement 3.6)', async () => {
    await useCartStore.getState().addItem({
      variantId: 'v1',
      productName: 'Vợt cầu lông',
      sku: 'SKU-1',
      attributes: 'Màu đỏ',
      unitPrice: 100,
      stockQuantity: 5,
      quantity: 2,
    })

    mockedCartService.mergeCart.mockRejectedValue(new Error('network error'))

    await useCartStore.getState().mergeGuestCartOnLogin()

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.message).toBeTruthy()
    expect(localStorage.getItem('guestCart')).not.toBeNull()
  })
})

describe('useCartStore (authenticated/backend-API mode)', () => {
  beforeEach(() => {
    localStorage.clear()
    setAuthenticated(true)
    useCartStore.setState({ items: [], itemCount: 0, totalAmount: 0, isLoading: false, message: null })
    vi.clearAllMocks()
  })

  it('addItem calls the backend Cart API and mirrors its response', async () => {
    mockedCartService.addItem.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          variantId: 'v1',
          productName: 'Vợt cầu lông',
          sku: 'SKU-1',
          attributes: 'Màu đỏ',
          unitPrice: 100,
          quantity: 2,
          stockQuantity: 5,
          lineTotal: 200,
        },
      ],
      totalAmount: 200,
    })

    await useCartStore.getState().addItem({
      variantId: 'v1',
      productName: 'Vợt cầu lông',
      sku: 'SKU-1',
      attributes: 'Màu đỏ',
      unitPrice: 100,
      stockQuantity: 5,
      quantity: 2,
    })

    expect(mockedCartService.addItem).toHaveBeenCalledWith({ variantId: 'v1', quantity: 2 })
    const state = useCartStore.getState()
    expect(state.itemCount).toBe(2)
    expect(state.totalAmount).toBe(200)
  })

  it('updateItemQuantity surfaces a message when the backend clamps the quantity', async () => {
    mockedCartService.updateItemQuantity.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          variantId: 'v1',
          productName: 'Vợt cầu lông',
          sku: 'SKU-1',
          attributes: 'Màu đỏ',
          unitPrice: 100,
          quantity: 3,
          stockQuantity: 3,
          lineTotal: 300,
        },
      ],
      totalAmount: 300,
    })

    await useCartStore.getState().updateItemQuantity('item-1', 10)

    expect(mockedCartService.updateItemQuantity).toHaveBeenCalledWith('item-1', { quantity: 10 })
    expect(useCartStore.getState().message).toMatch(/giới hạn/)
  })

  it('removeItem calls the backend Cart API and mirrors its response', async () => {
    mockedCartService.removeItem.mockResolvedValue({ id: 'cart-1', items: [], totalAmount: 0 })

    await useCartStore.getState().removeItem('item-1')

    expect(mockedCartService.removeItem).toHaveBeenCalledWith('item-1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('loadCart fetches the cart from the backend', async () => {
    mockedCartService.getCart.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          variantId: 'v1',
          productName: 'Vợt cầu lông',
          sku: 'SKU-1',
          attributes: 'Màu đỏ',
          unitPrice: 100,
          quantity: 1,
          stockQuantity: 5,
          lineTotal: 100,
        },
      ],
      totalAmount: 100,
    })

    await useCartStore.getState().loadCart()

    expect(mockedCartService.getCart).toHaveBeenCalled()
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})
