import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import AvailableDiscounts from './AvailableDiscounts'
import CheckoutPage from './CheckoutPage'
import discountService from '../../services/discountService'
import orderService from '../../services/orderService'
import { useCartStore } from '../../store/cartStore'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
vi.mock('../../services/discountService', () => ({ default: { getAvailableCodes: vi.fn(), validateCode: vi.fn() } }))
vi.mock('../../services/orderService', () => ({ default: { createOrder: vi.fn() } }))
vi.mock('../../components/shared', async original => ({ ...await original<typeof import('../../components/shared')>(), Header: () => null, Footer: () => null }))
const offers = [
  { id: 'percent', code: 'SALE10', discountType: 'PERCENTAGE' as const, discountValue: 10, validTo: '2027-01-01T00:00:00Z' },
  { id: 'fixed', code: 'SAVE50K', discountType: 'FIXED_AMOUNT' as const, discountValue: 50000, validTo: '2027-01-01T00:00:00Z' },
]
beforeEach(() => { vi.clearAllMocks(); vi.mocked(discountService.getAvailableCodes).mockResolvedValue(offers) })
it('ranks offers by actual savings, caps savings to the subtotal and applies the selected code', async () => {
  const apply = vi.fn().mockResolvedValue(undefined)
  const { rerender } = render(<AvailableDiscounts subtotal={20000} disabled={false} onApply={apply} />)
  await screen.findByText('SAVE50K')
  expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('SAVE50K')
  expect(screen.getByText('Tiết kiệm 20.000 đ cho đơn này')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Áp dụng mã SAVE50K' }))
  expect(apply).toHaveBeenCalledWith('SAVE50K')
  rerender(<AvailableDiscounts subtotal={20000} appliedCode="SAVE50K" disabled onApply={apply} />)
  expect(screen.getByRole('button', { name: 'Đã áp dụng mã SAVE50K' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Áp dụng mã SALE10' })).toBeDisabled()
})

function renderCheckoutForCartTest() {
  useCartStore.setState({ items: [{ id: 'cart-item', productId: 'product', variantId: 'variant', productName: 'Giày', sku: 'sku', attributes: '', unitPrice: 20000, quantity: 1, lineTotal: 20000, stockQuantity: 10 }], totalAmount: 20000, itemCount: 1, loadCart: vi.fn().mockResolvedValue(undefined) })
  render(<MemoryRouter initialEntries={['/checkout']}><Routes><Route path="/checkout" element={<CheckoutPage />} /><Route path="/orders/confirmation/:orderId" element={<p>Đã tạo đơn thử</p>} /></Routes></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Tên người nhận'), { target: { value: 'Nguyễn An' } })
  fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0900000000' } })
  fireEvent.change(screen.getByLabelText('Địa chỉ giao hàng'), { target: { value: 'Hà Nội' } })
}

it('clears the frontend cart immediately after successful order creation', async () => {
  vi.mocked(orderService.createOrder).mockResolvedValue({ id: 'created-order' } as never)
  renderCheckoutForCartTest()
  fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }))
  await screen.findByText('Đã tạo đơn thử')
  expect(useCartStore.getState().items).toEqual([])
  expect(useCartStore.getState().itemCount).toBe(0)
  expect(useCartStore.getState().totalAmount).toBe(0)
})

it('retains the frontend cart when order creation fails', async () => {
  vi.mocked(orderService.createOrder).mockRejectedValue(new Error('Failed'))
  renderCheckoutForCartTest()
  fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }))
  await waitFor(() => expect(orderService.createOrder).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeEnabled())
  expect(useCartStore.getState().items).toHaveLength(1)
  expect(useCartStore.getState().totalAmount).toBe(20000)
  expect(screen.queryByText('Đã tạo đơn thử')).not.toBeInTheDocument()
})
it('retries failures and explains when no offers are available', async () => {
  vi.mocked(discountService.getAvailableCodes).mockRejectedValueOnce(new Error('failed')).mockResolvedValueOnce([])
  render(<AvailableDiscounts subtotal={20000} disabled={false} onApply={vi.fn()} />)
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByText(/Hiện chưa có mã giảm giá còn hiệu lực/)
})
it('checkout validates a selected offer, updates the total and lets the customer remove it', async () => {
  useCartStore.setState({ items: [{ id: 'item', productId: 'product', variantId: 'variant', productName: 'Giày', sku: 'sku', attributes: '', unitPrice: 200000, quantity: 1, lineTotal: 200000, stockQuantity: 10 }], totalAmount: 200000, loadCart: vi.fn().mockResolvedValue(undefined) })
  vi.mocked(discountService.validateCode).mockResolvedValue({ ...offers[1], valid: true })
  render(<MemoryRouter><CheckoutPage /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Áp dụng mã SAVE50K' }))
  await waitFor(() => expect(discountService.validateCode).toHaveBeenCalledWith('SAVE50K'))
  expect(await screen.findByText('150.000 đ')).toBeInTheDocument()
  expect(orderService.createOrder).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Hủy mã' }))
  expect(screen.queryByText('150.000 đ')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Bạn có mã khác? Nhập mã tại đây')).toHaveValue('')
  vi.mocked(discountService.validateCode).mockResolvedValueOnce({ ...offers[0], valid: true })
  const manual = screen.getByLabelText('Bạn có mã khác? Nhập mã tại đây')
  fireEvent.change(manual, { target: { value: 'SALE10' } })
  fireEvent.keyDown(manual, { key: 'Enter' })
  await screen.findByText('180.000 đ')
  expect(discountService.validateCode).toHaveBeenLastCalledWith('SALE10')
  expect(orderService.createOrder).not.toHaveBeenCalled()
})
