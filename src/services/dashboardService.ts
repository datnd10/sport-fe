import { apiClient } from './apiClient'
import type {
  CategoryRevenueResponse,
  DailyRevenueResponse,
  DashboardRange,
  DashboardSummaryResponse,
  TopProductResponse,
  DashboardOverview,
  OverviewRange,
} from './dashboardService.types'

// API client for the Admin Dashboard overview page (design.md — "Module
// Dashboard"). Every endpoint here lives under /api/admin/** and
// requires ROLE_ADMIN per SecurityConfig.
// Requirements: 10.1, 10.2, 10.3
const ADMIN_DASHBOARD_BASE = '/admin/dashboard'

/**
 * Fetches the Dashboard summary (total Đơn_Hàng, total revenue excluding
 * Đã_Hủy, low-stock product count) for the selected time range
 * (Requirement 10.1, 10.2).
 */
async function getSummary(range: DashboardRange): Promise<DashboardSummaryResponse> {
  const response = await apiClient.get<DashboardSummaryResponse>(`${ADMIN_DASHBOARD_BASE}/summary`, {
    params: { range },
  })
  return response.data
}

/**
 * Fetches the best-selling Sản_Phẩm list for the selected time range,
 * sorted descending by quantity sold (Requirement 10.3).
 */
async function getTopProducts(range: DashboardRange): Promise<TopProductResponse[]> {
  const response = await apiClient.get<TopProductResponse[]>(`${ADMIN_DASHBOARD_BASE}/top-products`, {
    params: { range },
  })
  return response.data
}

/**
 * Fetches the revenue trend for the selected time range, one point per
 * calendar day (including zero-revenue days), for the Dashboard's
 * revenue chart.
 */
async function getRevenueByDay(range: DashboardRange): Promise<DailyRevenueResponse[]> {
  const response = await apiClient.get<DailyRevenueResponse[]>(`${ADMIN_DASHBOARD_BASE}/revenue-by-day`, {
    params: { range },
  })
  return response.data
}

/**
 * Fetches revenue per Danh_Mục for the selected time range, sorted
 * descending by revenue, for the Dashboard's category breakdown chart.
 */
async function getRevenueByCategory(range: DashboardRange): Promise<CategoryRevenueResponse[]> {
  const response = await apiClient.get<CategoryRevenueResponse[]>(`${ADMIN_DASHBOARD_BASE}/revenue-by-category`, {
    params: { range },
  })
  return response.data
}

export const dashboardService = {
  async getOverview(params: { range: OverviewRange; from?: string; to?: string }): Promise<DashboardOverview> {
    const response = await apiClient.get<DashboardOverview>(`${ADMIN_DASHBOARD_BASE}/overview`, { params })
    return response.data
  },
  getSummary,
  getTopProducts,
  getRevenueByDay,
  getRevenueByCategory,
}

export default dashboardService
