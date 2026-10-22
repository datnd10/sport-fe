import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getErrorMessage } from '../../services/apiError'
import dashboardService from '../../services/dashboardService'
import type {
  CategoryRevenueResponse,
  DailyRevenueResponse,
  DashboardRange,
  DashboardSummaryResponse,
  OrderStatus,
  TopProductResponse,
} from '../../services/dashboardService.types'
import AdminLayout from './AdminLayout'
import './AdminForms.css'
import './AdminDashboardPage.css'

function formatCurrency(value: number): string {
  return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7days', label: '7 ngày qua' },
  { value: 'month', label: 'Tháng này' },
]

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
}

// Fixed per-status colors so the Trạng_Thái_Đơn_Hàng pie chart's slices
// stay visually consistent across renders/time ranges, matching the
// Badge variant colors used elsewhere for the same statuses (Requirement
// 10, consistent with orderStatus.ts's PENDING=warning/CONFIRMED,
// SHIPPING=accent/DELIVERED=brand/CANCELLED=error convention).
const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  SHIPPING: '#6366f1',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
}

const CATEGORY_CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#6366f1', '#ef4444', '#06b6d4', '#a855f7', '#84cc16']

/**
 * Trang Dashboard tổng quan cho Quản_Trị_Viên: hiển thị các chỉ số tổng
 * quan (tổng Đơn_Hàng, doanh thu, giá trị đơn trung bình, khách hàng
 * mới, đơn bị hủy, Sản_Phẩm sắp hết hàng) và trực quan hóa bằng chart
 * (xu hướng doanh thu theo ngày, phân bố Đơn_Hàng theo trạng thái, top
 * Sản_Phẩm bán chạy, doanh thu theo Danh_Mục) cho một khoảng thời gian
 * được chọn (Requirement 10.1, 10.2, 10.3).
 */
function AdminDashboardPage() {
  const [range, setRange] = useState<DashboardRange>('today')
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)
  const [topProducts, setTopProducts] = useState<TopProductResponse[]>([])
  const [revenueByDay, setRevenueByDay] = useState<DailyRevenueResponse[]>([])
  const [revenueByCategory, setRevenueByCategory] = useState<CategoryRevenueResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const [summaryData, topProductsData, revenueByDayData, revenueByCategoryData] = await Promise.all([
          dashboardService.getSummary(range),
          dashboardService.getTopProducts(range),
          dashboardService.getRevenueByDay(range),
          dashboardService.getRevenueByCategory(range),
        ])
        if (isMounted) {
          setSummary(summaryData)
          setTopProducts(topProductsData)
          setRevenueByDay(revenueByDayData)
          setRevenueByCategory(revenueByCategoryData)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error, 'Không thể tải dữ liệu Dashboard. Vui lòng thử lại.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [range])

  const revenueChartData = revenueByDay.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
  }))

  const statusChartData = (summary?.statusBreakdown ?? []).map((entry) => ({
    ...entry,
    label: ORDER_STATUS_LABELS[entry.status],
  }))

  const topProductsChartData = topProducts
    .slice(0, 10)
    .map((product) => ({ ...product, shortName: truncateLabel(product.productName) }))

  const categoryChartData = revenueByCategory.map((entry) => ({ ...entry, shortName: truncateLabel(entry.categoryName) }))

  return (
    <AdminLayout title="Dashboard">
      <section className="admin-card admin-dashboard-filters">
        <div className="admin-form-field admin-dashboard-range-field">
          <label htmlFor="dashboard-range">Khoảng thời gian</label>
          <select
            id="dashboard-range"
            value={range}
            onChange={(event) => setRange(event.target.value as DashboardRange)}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {isLoading ? <p>Đang tải...</p> : null}
      {!isLoading && loadError ? <p className="admin-form-error">{loadError}</p> : null}

      {!isLoading && !loadError && summary ? (
        <section className="admin-dashboard-summary">
          <div className="admin-dashboard-stat-card">
            <p className="admin-dashboard-stat-label">Tổng số Đơn hàng</p>
            <p className="admin-dashboard-stat-value">{summary.totalOrders}</p>
          </div>
          <div className="admin-dashboard-stat-card">
            <p className="admin-dashboard-stat-label">Tổng doanh thu</p>
            <p className="admin-dashboard-stat-value">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <div className="admin-dashboard-stat-card">
            <p className="admin-dashboard-stat-label">Giá trị đơn trung bình</p>
            <p className="admin-dashboard-stat-value">{formatCurrency(summary.averageOrderValue)}</p>
          </div>
          <div className="admin-dashboard-stat-card">
            <p className="admin-dashboard-stat-label">Khách hàng mới</p>
            <p className="admin-dashboard-stat-value">{summary.newCustomerCount}</p>
          </div>
          <div
            className={
              summary.cancelledOrderCount > 0
                ? 'admin-dashboard-stat-card admin-dashboard-stat-card-alert'
                : 'admin-dashboard-stat-card'
            }
          >
            <p className="admin-dashboard-stat-label">Đơn hàng bị hủy</p>
            <p className="admin-dashboard-stat-value">{summary.cancelledOrderCount}</p>
          </div>
          <div
            className={
              summary.lowStockProductCount > 0
                ? 'admin-dashboard-stat-card admin-dashboard-stat-card-alert'
                : 'admin-dashboard-stat-card'
            }
          >
            <p className="admin-dashboard-stat-label">Sản phẩm sắp hết hàng</p>
            <p className="admin-dashboard-stat-value">{summary.lowStockProductCount}</p>
          </div>
        </section>
      ) : null}

      {!isLoading && !loadError ? (
        <section className="admin-dashboard-charts">
          <div className="admin-card admin-dashboard-chart-card">
            <h3>Xu hướng doanh thu</h3>
            {revenueChartData.length === 0 ? (
              <p>Chưa có dữ liệu doanh thu trong khoảng thời gian này.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueChartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value: number) => value.toLocaleString('vi-VN')} width={80} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="admin-card admin-dashboard-chart-card">
            <h3>Đơn hàng theo trạng thái</h3>
            {statusChartData.length === 0 ? (
              <p>Chưa có Đơn_Hàng nào trong khoảng thời gian này.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.status} fill={ORDER_STATUS_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value ?? 0)} đơn`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="admin-card admin-dashboard-chart-card">
            <h3>Top 10 sản phẩm bán chạy</h3>
            {topProductsChartData.length === 0 ? (
              <p>Chưa có dữ liệu bán hàng trong khoảng thời gian này.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={topProductsChartData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="shortName" width={140} />
                  <Tooltip formatter={(value) => `${Number(value ?? 0)} sản phẩm`} />
                  <Bar dataKey="totalQuantitySold" name="Số lượng đã bán" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="admin-card admin-dashboard-chart-card">
            <h3>Doanh thu theo danh mục</h3>
            {categoryChartData.length === 0 ? (
              <p>Chưa có dữ liệu doanh thu theo danh mục trong khoảng thời gian này.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryChartData} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="shortName" angle={-20} textAnchor="end" height={60} />
                  <YAxis tickFormatter={(value: number) => value.toLocaleString('vi-VN')} width={80} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Bar dataKey="revenue" name="Doanh thu" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={entry.categoryId} fill={CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      ) : null}

      {!isLoading && !loadError ? (
        <section className="admin-card">
          <h3>Sản phẩm bán chạy nhất</h3>
          {topProducts.length === 0 ? <p>Chưa có dữ liệu bán hàng trong khoảng thời gian này.</p> : null}
          {topProducts.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Số lượng đã bán</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.productId}>
                    <td>{product.productName}</td>
                    <td>{product.totalQuantitySold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      ) : null}
    </AdminLayout>
  )
}

/** Shortens a long product/category name for compact axis labels. */
function truncateLabel(label: string): string {
  const MAX_LENGTH = 18
  return label.length > MAX_LENGTH ? `${label.slice(0, MAX_LENGTH - 1)}…` : label
}

export default AdminDashboardPage
