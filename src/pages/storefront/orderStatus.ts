import type { BadgeVariant } from '../../components/shared'
import type { OrderStatus } from '../../services/orderService.types'

// Shared Trạng_Thái_Đơn_Hàng label/Badge-variant mapping used by the
// order history and order detail pages (Requirement 5.1, 5.6).
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
}

export const ORDER_STATUS_BADGE_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  PENDING: 'warning',
  CONFIRMED: 'accent',
  SHIPPING: 'accent',
  DELIVERED: 'brand',
  CANCELLED: 'error',
}
