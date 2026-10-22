import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Footer, Header } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import orderService from '../../services/orderService'
import type { OrderSummaryResponse } from '../../services/orderService.types'
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from './orderStatus'
import './OrderHistoryPage.css'

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Trang lịch sử Đơn_Hàng: lists every Đơn_Hàng belonging to the
 * currently authenticated Khách_Hàng, with order code, created date,
 * total amount, and current Trạng_Thái_Đơn_Hàng, fetched via
 * GET /api/orders (Requirement 5.1). Protected by the RequireAuth route
 * guard (task 24.2) — only reachable once logged in.
 * Requirements: 5.1
 */
function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await orderService.getMyOrders()
        if (isMounted) {
          setOrders(data)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error, 'Không thể tải lịch sử đơn hàng. Vui lòng thử lại.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="order-history-page">
      <Header />

      <main className="order-history-content">
        <h2 className="order-history-title">Lịch sử đơn hàng</h2>

        {isLoading ? <p className="order-history-status">Đang tải...</p> : null}

        {!isLoading && loadError ? <p className="order-history-error">{loadError}</p> : null}

        {!isLoading && !loadError && orders.length === 0 ? (
          <div className="order-history-empty">
            <p>Bạn chưa có đơn hàng nào.</p>
            <Link to="/">Tiếp tục mua sắm</Link>
          </div>
        ) : null}

        {!isLoading && !loadError && orders.length > 0 ? (
          <ul className="order-history-list">
            {orders.map((order) => (
              <li key={order.id} className="order-history-item">
                <Link to={`/orders/${order.id}`} className="order-history-item-link">
                  <div className="order-history-item-main">
                    <span className="order-history-item-code">Đơn hàng #{order.orderCode}</span>
                    <span className="order-history-item-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-history-item-meta">
                    <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <span className="order-history-item-total">{formatPrice(order.totalAmount)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}

export default OrderHistoryPage
