import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Footer, Header } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import orderService from '../../services/orderService'
import type { OrderResponse } from '../../services/orderService.types'
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from './orderStatus'
import './OrderDetailPage.css'

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

const PAYMENT_METHOD_LABELS: Record<OrderResponse['paymentMethod'], string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

/**
 * Trang chi tiết Đơn_Hàng cho Khách_Hàng: shows the purchased
 * Sản_Phẩm list, quantities, prices, Phương_Thức_Thanh_Toán, and
 * shipping address for a single Đơn_Hàng in the Customer's own order
 * history, fetched via GET /api/orders/{id} (Requirement 5.6).
 * Protected by the RequireAuth route guard (task 24.2); the backend
 * additionally ensures a Customer may only fetch their own orders.
 * Requirements: 5.6
 */
function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      return
    }

    const currentOrderId = orderId
    let isMounted = true

    async function loadOrder() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await orderService.getOrderById(currentOrderId)
        if (isMounted) {
          setOrder(data)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error, 'Không thể tải thông tin đơn hàng. Vui lòng thử lại.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadOrder()

    return () => {
      isMounted = false
    }
  }, [orderId])

  return (
    <div className="order-detail-page">
      <Header />

      <main className="order-detail-content">
        {isLoading ? <p className="order-detail-status">Đang tải...</p> : null}

        {!isLoading && loadError ? (
          <div className="order-detail-missing">
            <p className="order-detail-error">{loadError}</p>
            <Link to="/account/orders">Quay lại lịch sử đơn hàng</Link>
          </div>
        ) : null}

        {!isLoading && !loadError && order ? (
          <>
            <div className="order-detail-header">
              <div>
                <h2 className="order-detail-title">Đơn hàng #{order.orderCode}</h2>
                <p className="order-detail-date">
                  Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>

            <section className="order-detail-section">
              <h3>Thông tin giao hàng</h3>
              <p>
                {order.recipientName} · {order.recipientPhone}
              </p>
              <p>{order.shippingAddress}</p>
              <p className="order-detail-payment-method">
                Phương thức thanh toán: {PAYMENT_METHOD_LABELS[order.paymentMethod]}
              </p>
            </section>

            <section className="order-detail-section">
              <h3>Sản phẩm đã mua</h3>
              <ul className="order-detail-items">
                {order.items.map((item) => (
                  <li key={item.id} className="order-detail-item">
                    <div className="order-detail-item-info">
                      <span className="order-detail-item-name">{item.productName}</span>
                      <span className="order-detail-item-attributes">
                        {item.attributes} · SKU: {item.sku}
                      </span>
                    </div>
                    <span className="order-detail-item-quantity">x{item.quantity}</span>
                    <span className="order-detail-item-price">{formatPrice(item.unitPrice)}</span>
                    <span className="order-detail-item-total">{formatPrice(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="order-detail-totals">
                <div className="order-detail-totals-row">
                  <span>Tạm tính</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 ? (
                  <div className="order-detail-totals-row order-detail-discount">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                ) : null}
                <div className="order-detail-totals-row order-detail-total">
                  <span>Tổng tiền</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </section>

            {order.paymentMethod === 'BANK_TRANSFER' && order.bankTransferInfo ? (
              <section className="order-detail-section">
                <h3>Thông tin chuyển khoản</h3>
                <dl className="order-detail-bank-details">
                  <div>
                    <dt>Ngân hàng</dt>
                    <dd>{order.bankTransferInfo.bankName}</dd>
                  </div>
                  <div>
                    <dt>Số tài khoản</dt>
                    <dd>{order.bankTransferInfo.accountNumber}</dd>
                  </div>
                  <div>
                    <dt>Chủ tài khoản</dt>
                    <dd>{order.bankTransferInfo.accountHolder}</dd>
                  </div>
                </dl>
              </section>
            ) : null}

            <div className="order-detail-actions">
              <Link to="/account/orders">Quay lại lịch sử đơn hàng</Link>
            </div>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}

export default OrderDetailPage
