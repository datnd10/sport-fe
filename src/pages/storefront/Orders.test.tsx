import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import OrderHistoryPage from './OrderHistoryPage'
import OrderDetailPage from './OrderDetailPage'
import orderService from '../../services/orderService'
import type { OrderResponse, OrderSummaryResponse } from '../../services/orderService.types'
vi.mock('../../services/orderService', () => ({ default: { getMyOrders: vi.fn(), getOrderById: vi.fn() } }))
vi.mock('../../components/shared', async original => ({ ...await original<typeof import('../../components/shared')>(), Header: () => null, Footer: () => null }))
const item = { id: 'item', productId: 'product', productName: 'Giày đã mua', sku: 'SKU40', attributes: 'Size 40', unitPrice: 100000, quantity: 2, lineTotal: 200000, imagePath: 'uploads/shoe.jpg' }
const orders: OrderSummaryResponse[] = Array.from({ length: 7 }, (_, n) => ({ id: `${n}`, orderCode: `ORDER${n}`, createdAt: `2026-10-${10 + n}T10:00:00Z`, totalAmount: 200000, status: n === 0 ? 'CANCELLED' : 'DELIVERED', paymentMethod: 'COD', accountEmail: null, accountFullName: null, items: [item] }))
const detail: OrderResponse = { ...orders[0], recipientName: 'Nguyễn An', recipientPhone: '0900000000', shippingAddress: 'Hà Nội', subtotal: 200000, discountAmount: 20000, totalAmount: 180000, items: [item], bankTransferInfo: null }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(orderService.getMyOrders).mockResolvedValue(orders); vi.mocked(orderService.getOrderById).mockResolvedValue(detail) })
it('paginates orders and applies an order-code search only after submit', async () => {
  render(<MemoryRouter><OrderHistoryPage /></MemoryRouter>)
  await screen.findByText('#ORDER6')
  expect(screen.queryByText('#ORDER0')).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Tìm theo mã đơn hàng'), { target: { value: 'ORDER0' } })
  expect(screen.getByText('#ORDER6')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }))
  expect(screen.getByText('#ORDER0')).toBeInTheDocument()
  expect(screen.queryByText('#ORDER6')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
  expect(screen.getByText('#ORDER0')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Đã hủy 1/ }))
  expect(screen.getByText('#ORDER0')).toBeInTheDocument()
  expect(screen.queryByText('#ORDER1')).not.toBeInTheDocument()
  expect(orderService.getMyOrders).toHaveBeenCalledTimes(1)
})
it('retries a failed history request and shows the empty state', async () => {
  vi.mocked(orderService.getMyOrders).mockRejectedValueOnce(new Error('failed')).mockResolvedValueOnce([])
  render(<MemoryRouter><OrderHistoryPage /></MemoryRouter>)
  expect(screen.getByRole('status', { name: 'Đang tải đơn hàng' })).toBeInTheDocument()
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByText('Bạn chưa có đơn hàng nào')
  expect(screen.getByRole('link', { name: 'Khám phá sản phẩm' })).toHaveAttribute('href', '/')
})
function renderDetail() { render(<MemoryRouter initialEntries={['/orders/0']}><Routes><Route path="/orders/:orderId" element={<OrderDetailPage />} /></Routes></MemoryRouter>) }
it('shows purchased prices and recipient details without a delivery timeline for cancelled orders', async () => {
  renderDetail()
  await screen.findByText('Giày đã mua')
  expect(screen.getByText('180.000 đ')).toBeInTheDocument()
  expect(screen.getByText('−20.000 đ')).toBeInTheDocument()
  expect(screen.getByText('Nguyễn An')).toBeInTheDocument()
  expect(screen.queryByRole('listitem', { current: 'step' })).not.toBeInTheDocument()
  expect(screen.queryByText('Đánh giá sản phẩm ↗')).not.toBeInTheDocument()
})
it('marks the actual shipping step and offers reviews only after delivery', async () => {
  vi.mocked(orderService.getOrderById).mockResolvedValue({ ...detail, status: 'DELIVERED' })
  renderDetail()
  const review = await screen.findByRole('link', { name: 'Đánh giá sản phẩm ↗' })
  expect(review).toHaveAttribute('href', '/products/product?orderItemId=item#reviews-heading')
  await waitFor(() => expect(document.querySelector('[aria-current="step"]')).toHaveTextContent('Đã giao'))
})
