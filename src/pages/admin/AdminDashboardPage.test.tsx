import { type PropsWithChildren } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import AdminDashboardPage from './AdminDashboardPage'
import dashboardService from '../../services/dashboardService'
import type { DashboardOverview } from '../../services/dashboardService.types'
vi.mock('../../services/dashboardService', () => ({ default: { getOverview: vi.fn() } }))
vi.mock('./AdminLayout', () => ({ default: ({ children }: PropsWithChildren) => <main>{children}</main> }))
vi.mock('recharts', () => {
  const Group = ({ children }: PropsWithChildren) => <div>{children}</div>
  const Empty = () => null
  return { ResponsiveContainer: Group, LineChart: Group, PieChart: Group, Pie: Group, CartesianGrid: Empty, Cell: Empty, Legend: Empty, Line: Empty, Tooltip: Empty, XAxis: Empty, YAxis: Empty }
})
const metrics: DashboardOverview['metrics'] = { totalOrders: 3, orderedValue: 600000, deliveredValue: 400000, averageOrderValue: 300000, discountAmount: 50000, newCustomers: 1, cancelledOrders: 1, deliveredOrders: 1, unitsSold: 4, statuses: [{ status: 'PENDING', count: 1 }, { status: 'DELIVERED', count: 1 }, { status: 'CANCELLED', count: 1 }] }
const overview: DashboardOverview = {
  from: '2026-01-02', to: '2026-01-08', previousFrom: '2025-12-26', previousTo: '2026-01-01', generatedAt: '2026-01-08T01:00:00Z', timeZone: 'Asia/Ho_Chi_Minh',
  metrics, previousMetrics: { ...metrics, orderedValue: 0, deliveredValue: 0 },
  trend: [{ date: '2026-01-02', orderedValue: 600000, deliveredValue: 400000 }],
  categories: [{ categoryId: 'category', categoryName: 'Giày', revenue: 600000 }],
  topProducts: [{ productId: 'product', productName: 'Giày demo', quantity: 4, netValue: 600000 }],
  operations: { pendingOrders: 8, confirmedOrders: 2, shippingOrders: 5, lowStockVariants: 2, outOfStockVariants: 1 },
  stockAlerts: [{ variantId: 'variant', productId: 'product', productName: 'Giày demo', sku: 'SKU-DEMO', stockQuantity: 0, lowStockThreshold: 5, status: 'OUT_OF_STOCK' }],
  recentOrders: [{ id: 'order', orderCode: 'ORDER-DEMO', status: 'PENDING', paymentMethod: 'COD', totalAmount: 200000, accountEmail: null, accountFullName: 'Khách demo', createdAt: '2026-01-08T01:00:00Z' }],
}
beforeEach(() => { vi.mocked(dashboardService.getOverview).mockReset().mockResolvedValue(overview) })
function show() { render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>) }
it('shows net order values, explains zero comparison baselines, and links to filtered work lists', async () => {
  show()
  expect(screen.getByRole('status', { name: 'Đang tải dashboard' })).toBeInTheDocument()
  await screen.findByText('Giá trị đơn đặt')
  expect(screen.getAllByText('Kỳ trước chưa có dữ liệu so sánh')).toHaveLength(2)
  expect(screen.getByRole('link', { name: /Chờ xác nhận.*8/ })).toHaveAttribute('href', '/admin/orders?status=PENDING')
  expect(screen.getByRole('link', { name: /1 biến thể hết hàng/ })).toHaveAttribute('href', '/admin/inventory?stockStatus=OUT_OF_STOCK')
  expect(screen.getByRole('link', { name: 'Cập nhật →' })).toHaveAttribute('href', '/admin/inventory?keyword=SKU-DEMO')
  expect(screen.getByRole('link', { name: '#ORDER-DEMO' })).toHaveAttribute('href', '/admin/orders?keyword=ORDER-DEMO')
  expect(screen.getByText(/chưa phải xác nhận tiền thực thu/)).toBeInTheDocument()
})
it('applies custom dates only when the user submits and refreshes the applied range', async () => {
  show()
  await screen.findByText('Giá trị đơn đặt')
  fireEvent.click(screen.getByRole('button', { name: 'Tùy chọn' }))
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-01-01' } })
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-01-03' } })
  expect(dashboardService.getOverview).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }))
  await waitFor(() => expect(dashboardService.getOverview).toHaveBeenLastCalledWith({ range: 'custom', from: '2026-01-01', to: '2026-01-03' }))
  await screen.findByRole('button', { name: '↻ Làm mới' })
  fireEvent.click(screen.getByRole('button', { name: '↻ Làm mới' }))
  await waitFor(() => expect(dashboardService.getOverview).toHaveBeenCalledTimes(3))
})
it('retries failures and renders useful empty states', async () => {
  vi.mocked(dashboardService.getOverview).mockRejectedValueOnce(new Error('Failed')).mockResolvedValueOnce({ ...overview, metrics: { ...metrics, totalOrders: 0 }, categories: [], topProducts: [], recentOrders: [], stockAlerts: [] })
  show()
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByText('Chưa có đơn hàng trong khoảng thời gian này.')
  expect(screen.getByText('Cửa hàng chưa có đơn hàng nào.')).toBeInTheDocument()
})
it('ignores an outdated request after changing the selected period', async () => {
  let resolveOld!: (data: DashboardOverview) => void
  vi.mocked(dashboardService.getOverview).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve })).mockResolvedValueOnce(overview)
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Tháng này' }))
  await screen.findByText('Giá trị đơn đặt')
  await act(async () => resolveOld({ ...overview, metrics: { ...metrics, orderedValue: 999999999 } }))
  expect(screen.queryByText('999.999.999 ₫')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tháng này' })).toHaveAttribute('aria-pressed', 'true')
})
