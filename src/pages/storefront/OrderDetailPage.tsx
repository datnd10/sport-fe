import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, Footer, Header, OrderIcon } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import orderService from '../../services/orderService'
import type { OrderResponse, OrderStatus } from '../../services/orderService.types'
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from './orderStatus'
import { OrderLoading, OrderProduct } from './OrderUi'
import { orderDate, orderMoney, paymentLabels } from './orderFormatting'
import './OrderHistoryPage.css'
import './OrderDetailPage.css'

const steps: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED']
const descriptions: Record<OrderStatus, string> = {
  PENDING: 'Đơn hàng đã được ghi nhận và đang chờ cửa hàng xác nhận.',
  CONFIRMED: 'Cửa hàng đã xác nhận đơn và đang chuẩn bị sản phẩm của bạn.',
  SHIPPING: 'Đơn hàng đang được giao đến địa chỉ nhận hàng của bạn.',
  DELIVERED: 'Đơn hàng đã giao thành công. Cảm ơn bạn đã mua sắm tại LananhSport!',
  CANCELLED: 'Đơn hàng này đã bị hủy và sẽ không tiếp tục được giao.',
}
function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError(null); setOrder(null)
      if (!orderId) { setError('Không tìm thấy mã đơn hàng.'); setLoading(false); return }
      try { const data = await orderService.getOrderById(orderId); if (active) setOrder(data) }
      catch (e) { if (active) setError(getErrorMessage(e, 'Không thể tải chi tiết đơn hàng.')) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [orderId, retry])
  return <div className="orders-page"><Header /><main className="orders-content">
    <nav className="orders-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><span>/</span><Link to="/account/orders">Đơn hàng của tôi</Link><span>/</span><span>Chi tiết đơn hàng</span></nav>
    {loading ? <OrderLoading /> : error ? <div className="orders-panel orders-empty" role="alert"><OrderIcon /><h2>Chưa thể hiển thị đơn hàng</h2><p>{error}</p><Button onClick={() => setRetry(r => r + 1)}>Thử lại</Button><Link to="/account/orders">Quay lại đơn hàng của tôi</Link></div> : order && <>
      <div className="orders-heading"><div><span className="orders-eyebrow">LANANHSPORT · CHI TIẾT ĐƠN HÀNG</span><h2>Đơn hàng #{order.orderCode}</h2><p>Đặt lúc {orderDate(order.createdAt)}</p></div><Link className="orders-link-button" to="/account/orders">← Đơn hàng của tôi</Link></div>
      <section className={`orders-panel order-tracking ${order.status === 'CANCELLED' ? 'order-tracking-cancelled' : ''}`} aria-label="Tiến trình đơn hàng">
        <div className="order-tracking-heading"><div><h3>{ORDER_STATUS_LABELS[order.status]}</h3><p>{descriptions[order.status]}</p></div><Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge></div>
        {order.status !== 'CANCELLED' && <ol className="order-steps">{steps.map((step, index) => <li key={step} className={index <= steps.indexOf(order.status) ? 'is-complete' : ''} aria-current={step === order.status ? 'step' : undefined}><span className="order-step-number" aria-hidden="true">{index < steps.indexOf(order.status) ? '✓' : index + 1}</span><span>{ORDER_STATUS_LABELS[step]}</span>{index === 0 && <small>{orderDate(order.createdAt)}</small>}{step === order.status && index !== 0 && <small>Trạng thái hiện tại</small>}</li>)}</ol>}
      </section>
      <div className="order-detail-layout"><div className="order-detail-main">
        <section className="orders-panel order-detail-products"><div className="order-section-heading"><h3>Sản phẩm trong đơn</h3><span>{order.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm</span></div><ul className="orders-products">{order.items.map(item => <OrderProduct key={item.id} item={item} review={order.status === 'DELIVERED'} />)}</ul></section>
        <section className="orders-panel order-delivery"><h3>Địa chỉ nhận hàng</h3><div className="order-delivery-body"><span className="order-delivery-icon" aria-hidden="true">⌖</span><div><strong>{order.recipientName}</strong><p>{order.recipientPhone}</p><p>{order.shippingAddress}</p></div></div></section>
      </div><aside className="order-detail-sidebar">
        <section className="orders-panel order-payment"><h3>Thông tin thanh toán</h3><dl><div><dt>Phương thức</dt><dd>{paymentLabels[order.paymentMethod]}</dd></div><div><dt>Tạm tính</dt><dd>{orderMoney(order.subtotal)}</dd></div><div><dt>Giảm giá</dt><dd className={order.discountAmount > 0 ? 'order-discount' : ''}>{order.discountAmount > 0 ? '−' : ''}{orderMoney(order.discountAmount)}</dd></div><div className="order-grand-total"><dt>Tổng tiền</dt><dd>{orderMoney(order.totalAmount)}</dd></div></dl><p className="order-payment-note">{order.status === 'CANCELLED' ? 'Đơn hàng đã hủy. Nếu đã chuyển khoản, vui lòng liên hệ cửa hàng để được hỗ trợ.' : order.paymentMethod === 'COD' ? 'Thanh toán cho nhân viên giao hàng khi nhận sản phẩm.' : 'Nội dung chuyển khoản: ' + order.orderCode}</p></section>
        {order.paymentMethod === 'BANK_TRANSFER' && order.bankTransferInfo && order.status !== 'CANCELLED' && <section className="orders-panel order-bank"><h3>Thông tin chuyển khoản</h3><dl><div><dt>Ngân hàng</dt><dd>{order.bankTransferInfo.bankName}</dd></div><div><dt>Số tài khoản</dt><dd>{order.bankTransferInfo.accountNumber}</dd></div><div><dt>Chủ tài khoản</dt><dd>{order.bankTransferInfo.accountHolder}</dd></div><div><dt>Nội dung</dt><dd>{order.orderCode}</dd></div></dl></section>}
        <div className="order-help"><OrderIcon /><div><strong>Cần xem lại thông tin?</strong><p>Giữ mã đơn #{order.orderCode} để cửa hàng tra cứu khi bạn cần hỗ trợ.</p></div></div>
      </aside></div>
    </>}
  </main><Footer /></div>
}
export default OrderDetailPage
