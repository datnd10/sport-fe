import { Link, useLocation, useParams } from 'react-router-dom'
import { Badge, Button, Footer, Header } from '../../components/shared'
import type { OrderResponse } from '../../services/orderService.types'
import { resolveUploadUrl } from '../../services/apiClient'
import './OrderConfirmationPage.css'

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

const PAYMENT_METHOD_LABELS: Record<OrderResponse['paymentMethod'], string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

/**
 * Trang xác nhận đặt hàng: shown right after CheckoutPage successfully
 * creates an Đơn_Hàng, displaying the order code (Requirement 4.8) and,
 * for Chuyển_Khoản_Ngân_Hàng orders, the bank account/QR info needed to
 * complete payment (Requirement 4.4).
 *
 * <p>The order data is passed via navigation state from CheckoutPage
 * (there is no public "get order by id" endpoint for guests — see
 * SecurityConfig — so this page cannot refetch on its own). If the state
 * is missing (e.g. the page was reloaded directly), a fallback message
 * points the user back to their order history/home instead of erroring.
 * Requirements: 4.1, 4.4, 4.5, 4.8
 */
function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const location = useLocation()
  const order = (location.state as { order?: OrderResponse } | null)?.order

  if (!order || order.id !== orderId) {
    return (
      <div className="order-confirmation-page">
        <Header />
        <main className="order-confirmation-content">
          <div className="order-confirmation-missing">
            <p>Không tìm thấy thông tin đơn hàng để hiển thị.</p>
            <Link to="/">Quay lại trang chủ</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="order-confirmation-page">
      <Header />

      <main className="order-confirmation-content">
        <div className="order-confirmation-banner">
          <Badge variant="brand">Đặt hàng thành công</Badge>
          <h2 className="order-confirmation-title">Cảm ơn bạn đã đặt hàng!</h2>
          <p className="order-confirmation-code">
            Mã đơn hàng: <strong>{order.orderCode}</strong>
          </p>
        </div>

        {order.paymentMethod === 'BANK_TRANSFER' && order.bankTransferInfo ? (
          <section className="order-confirmation-section order-confirmation-bank">
            <h3>Thông tin chuyển khoản</h3>
            <dl className="order-confirmation-bank-details">
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
            {order.bankTransferInfo.qrImageUrl ? (
              <img
                className="order-confirmation-qr"
                src={resolveUploadUrl(order.bankTransferInfo.qrImageUrl)}
                alt="Mã QR chuyển khoản"
              />
            ) : null}
          </section>
        ) : null}

        {order.paymentMethod === 'COD' ? (
          <p className="order-confirmation-cod-note">
            Đơn hàng của bạn đã được ghi nhận. Bạn sẽ thanh toán khi nhận hàng, không cần xác nhận thanh toán trước.
          </p>
        ) : null}

        <section className="order-confirmation-section">
          <h3>Thông tin giao hàng</h3>
          <p>
            {order.recipientName} · {order.recipientPhone}
          </p>
          <p>{order.shippingAddress}</p>
          <p className="order-confirmation-payment-method">
            Phương thức thanh toán: {PAYMENT_METHOD_LABELS[order.paymentMethod]}
          </p>
        </section>

        <section className="order-confirmation-section">
          <h3>Chi tiết đơn hàng</h3>
          <ul className="order-confirmation-items">
            {order.items.map((item) => (
              <li key={item.id} className="order-confirmation-item">
                <span>
                  {item.productName} ({item.attributes}) × {item.quantity}
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="order-confirmation-totals">
            <div className="order-confirmation-totals-row">
              <span>Tạm tính</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 ? (
              <div className="order-confirmation-totals-row order-confirmation-discount">
                <span>Giảm giá</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            ) : null}
            <div className="order-confirmation-totals-row order-confirmation-total">
              <span>Tổng tiền</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </section>

        <div className="order-confirmation-actions">
          <Link to="/">
            <Button variant="ghost">Tiếp tục mua sắm</Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OrderConfirmationPage
