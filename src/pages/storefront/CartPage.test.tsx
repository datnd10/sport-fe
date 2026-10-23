import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import CartPage from './CartPage'
import { useCartStore } from '../../store/cartStore'
vi.mock('../../components/shared', async (original) => ({
  ...await original<typeof import('../../components/shared')>(), Header: () => null, Footer: () => null,
}))
const update = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  useCartStore.setState({ items: [{ id: 'item', variantId: 'variant', productName: 'Demo shoe', sku: 'SKU', attributes: 'size=40', unitPrice: 20000, quantity: 1, stockQuantity: 3, lineTotal: 20000 }], totalAmount: 20000, isLoading: false, message: null, loadCart: vi.fn().mockResolvedValue(undefined), updateItemQuantity: update })
})
it('shows the order summary and clamps quantity to stock', async () => {
  render(<MemoryRouter><CartPage /></MemoryRouter>)
  await screen.findByRole('heading', { name: 'Tóm tắt đơn hàng' })
  expect(screen.getByRole('link', { name: /Tiến hành thanh toán/ })).toHaveAttribute('href', '/checkout')
  fireEvent.change(screen.getByLabelText('Số lượng Demo shoe'), { target: { value: '99' } })
  expect(update).toHaveBeenCalledWith('item', 3)
  fireEvent.change(screen.getByLabelText('Số lượng Demo shoe'), { target: { value: '1.5' } })
  expect(update).toHaveBeenCalledTimes(1)
})
it('prevents checkout when an item is out of stock', async () => {
  useCartStore.setState({ items: useCartStore.getState().items.map((item) => ({ ...item, stockQuantity: 0 })) })
  render(<MemoryRouter><CartPage /></MemoryRouter>)
  await screen.findByRole('heading', { name: 'Tóm tắt đơn hàng' })
  expect(screen.getByRole('button', { name: 'Tiến hành thanh toán' })).toBeDisabled()
  expect(screen.queryByRole('link', { name: /Tiến hành thanh toán/ })).not.toBeInTheDocument()
})
it('reserves space with skeletons until the cart request finishes', () => {
  useCartStore.setState({ items: [], loadCart: vi.fn(() => new Promise<void>(() => {})) })
  render(<MemoryRouter><CartPage /></MemoryRouter>)
  expect(screen.getByRole('status')).toHaveTextContent('Đang tải giỏ hàng')
  expect(screen.queryByText('Giỏ hàng của bạn đang trống')).not.toBeInTheDocument()
})
