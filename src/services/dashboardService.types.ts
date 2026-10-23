// Request/response shapes mirroring the backend Admin Dashboard DTOs
// (com.example.sport_be.dto.dashboard.*) used by the Admin Dashboard
// overview page.
// Requirements: 10.1, 10.2, 10.3

/**
 * Selectable time range for the Dashboard, mirrors DashboardRange.java.
 * Accepted `range` query parameter values: `today`, `7days`, `month`.
 */
export type DashboardRange = 'today' | '7days' | 'month'

export type OverviewRange = DashboardRange | '30days' | 'custom'
export interface DashboardMetrics {
  totalOrders: number
  orderedValue: number
  deliveredValue: number
  discountAmount: number
  averageOrderValue: number
  newCustomers: number
  cancelledOrders: number
  deliveredOrders: number
  unitsSold: number
  statuses: OrderStatusBreakdownResponse[]
}
export interface DashboardOverview {
  from: string
  to: string
  previousFrom: string
  previousTo: string
  timeZone: string
  generatedAt: string
  metrics: DashboardMetrics
  previousMetrics: DashboardMetrics
  trend: { date: string; orderedValue: number; deliveredValue: number }[]
  categories: CategoryRevenueResponse[]
  topProducts: { productId: string; productName: string; quantity: number; netValue: number }[]
  operations: { pendingOrders: number; confirmedOrders: number; shippingOrders: number; lowStockVariants: number; outOfStockVariants: number }
  recentOrders: import('./orderService.types').OrderSummaryResponse[]
  stockAlerts: { variantId: string; productId: string; productName: string; sku: string; stockQuantity: number; lowStockThreshold: number; status: 'LOW_STOCK' | 'OUT_OF_STOCK' }[]
}

/** Every Trạng_Thái_Đơn_Hàng value, mirrors OrderStatus.java. */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'

/**
 * A single entry in the Dashboard summary's order-status breakdown,
 * nested inside DashboardSummaryResponse.
 */
export interface OrderStatusBreakdownResponse {
  status: OrderStatus
  count: number
}

/**
 * Dashboard summary metrics for the selected time range, returned by
 * GET /api/admin/dashboard/summary?range=... (Requirement 10.1, 10.2).
 */
export interface DashboardSummaryResponse {
  totalOrders: number
  totalRevenue: number
  lowStockProductCount: number
  averageOrderValue: number
  newCustomerCount: number
  cancelledOrderCount: number
  statusBreakdown: OrderStatusBreakdownResponse[]
}

/**
 * A single entry in the best-selling products list, returned by
 * GET /api/admin/dashboard/top-products?range=... (Requirement 10.3).
 */
export interface TopProductResponse {
  productId: string
  productName: string
  totalQuantitySold: number
}

/**
 * A single day's revenue point for the revenue trend chart, returned by
 * GET /api/admin/dashboard/revenue-by-day?range=.... One entry per
 * calendar day in the range, including zero-revenue days.
 */
export interface DailyRevenueResponse {
  date: string
  revenue: number
}

/**
 * A single entry in the revenue-by-category breakdown, returned by
 * GET /api/admin/dashboard/revenue-by-category?range=....
 */
export interface CategoryRevenueResponse {
  categoryId: string
  categoryName: string
  revenue: number
}
