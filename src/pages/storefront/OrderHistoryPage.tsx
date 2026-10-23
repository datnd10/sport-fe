import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Footer, Header, OrderIcon, Pagination, SearchIcon } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import orderService from '../../services/orderService'
import type { OrderStatus, OrderSummaryResponse } from '../../services/orderService.types'
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from './orderStatus'
import { OrderLoading, OrderProduct } from './OrderUi'
import { orderDate, orderMoney, paymentLabels } from './orderFormatting'
import './OrderHistoryPage.css'

const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED']
const PAGE_SIZE = 5
function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [draft, setDraft] = useState('')
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError(null)
      try { const data = await orderService.getMyOrders(); if (active) setOrders(data) }
      catch (e) { if (active) setError(getErrorMessage(e, 'Không thể tải đơn hàng. Vui lòng thử lại.')) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [retry])
  const counts = (value: OrderStatus) => orders.filter(o => o.status === value).length
  const results = orders.filter(o => (!status || o.status === status) && o.orderCode.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')))
    .sort((a, b) => sort === 'price' ? b.totalAmount - a.totalAmount : sort === 'oldest' ? Date.parse(a.createdAt) - Date.parse(b.createdAt) : Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const safePage = Math.min(page, Math.max(0, Math.ceil(results.length / PAGE_SIZE) - 1))
  const shown = results.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  function search(e: FormEvent) { e.preventDefault(); setKeyword(draft.trim()); setPage(0) }
  function reset() { setStatus(''); setKeyword(''); setDraft(''); setPage(0) }
  return <div className="orders-page"><Header /><main className="orders-content">
    <nav className="orders-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><span>/</span><span>Đơn hàng của tôi</span></nav>
    <div className="orders-heading"><div><span className="orders-eyebrow">LANANHSPORT · TÀI KHOẢN</span><h2>Đơn hàng của tôi</h2><p>Theo dõi từng đơn hàng, từ lúc đặt mua đến khi nhận sản phẩm.</p></div><Link className="orders-link-button" to="/">Tiếp tục mua sắm ↗</Link></div>
    <div className="orders-stats" aria-label="Tổng quan đơn hàng">
      <div><span>Tổng đơn hàng</span><strong>{loading || error ? '—' : orders.length.toString().padStart(2, '0')}</strong><OrderIcon /></div>
      <div><span>Đang xử lý & giao hàng</span><strong>{loading || error ? '—' : (counts('PENDING') + counts('CONFIRMED') + counts('SHIPPING')).toString().padStart(2, '0')}</strong><span className="orders-stat-dot" /></div>
      <div><span>Đã giao thành công</span><strong>{loading || error ? '—' : counts('DELIVERED').toString().padStart(2, '0')}</strong><span className="orders-stat-check" aria-hidden="true">✓</span></div>
    </div>
    {loading ? <OrderLoading /> : error ? <div className="orders-panel orders-empty" role="alert"><OrderIcon /><h3>Chưa thể tải đơn hàng</h3><p>{error}</p><Button onClick={() => setRetry(r => r + 1)}>Thử lại</Button></div> : <>
      <section className="orders-panel orders-filters" aria-label="Tìm và lọc đơn hàng">
        <div className="orders-status-tabs" role="group" aria-label="Trạng thái đơn hàng">
          <button type="button" aria-pressed={!status} onClick={() => { setStatus(''); setPage(0) }}>Tất cả <span>{orders.length}</span></button>
          {statuses.map(s => <button type="button" key={s} aria-pressed={status === s} onClick={() => { setStatus(s); setPage(0) }}>{ORDER_STATUS_LABELS[s]} <span>{counts(s)}</span></button>)}
        </div>
        <div className="orders-filter-row"><form onSubmit={search}><SearchIcon /><input aria-label="Tìm theo mã đơn hàng" placeholder="Nhập mã đơn hàng cần tìm…" value={draft} onChange={e => setDraft(e.target.value)} /><Button type="submit">Tìm kiếm</Button></form><label>Sắp xếp<select value={sort} onChange={e => { setSort(e.target.value); setPage(0) }}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="price">Giá trị cao nhất</option></select></label></div>
      </section>
      <div className="orders-result-label" role="status"><span>{results.length ? `Hiển thị ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, results.length)} trong ${results.length} đơn hàng` : orders.length ? 'Không có đơn hàng phù hợp' : '0 đơn hàng'}</span>{(status || keyword) && <button type="button" onClick={reset}>Xóa bộ lọc</button>}</div>
      {shown.length ? <ul className="orders-list">{shown.map(order => <li className="orders-panel orders-card" key={order.id}>
        <div className="orders-card-header"><div><Link to={`/orders/${order.id}`}>#{order.orderCode}</Link><span>Đặt lúc {orderDate(order.createdAt)}</span></div><Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge></div>
        {order.items?.length ? <><ul className="orders-products">{order.items.slice(0, 2).map(item => <OrderProduct key={item.id} item={item} />)}</ul>{order.items.length > 2 && <Link className="orders-more" to={`/orders/${order.id}`}>Xem thêm {order.items.length - 2} sản phẩm trong đơn →</Link>}</> : <p className="orders-card-placeholder">Xem chi tiết để kiểm tra sản phẩm và thông tin nhận hàng.</p>}
        <div className="orders-card-footer"><div><span>{paymentLabels[order.paymentMethod]}</span>{order.items && <small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</small>}</div><div className="orders-card-actions"><div><span>Thành tiền</span><strong>{orderMoney(order.totalAmount)}</strong></div><Link className="orders-link-button orders-link-primary" to={`/orders/${order.id}`}>Xem chi tiết <span aria-hidden="true">→</span></Link></div></div>
      </li>)}</ul> : <div className="orders-panel orders-empty"><OrderIcon /><h3>{orders.length ? 'Chưa tìm thấy đơn hàng' : 'Bạn chưa có đơn hàng nào'}</h3><p>{orders.length ? 'Thử mã đơn khác hoặc xóa bộ lọc để xem tất cả đơn hàng.' : 'Khám phá sản phẩm yêu thích và bắt đầu đơn hàng đầu tiên của bạn.'}</p>{orders.length ? <Button variant="secondary" onClick={reset}>Xem tất cả đơn hàng</Button> : <Link className="orders-link-button orders-link-primary" to="/">Khám phá sản phẩm</Link>}</div>}
      {results.length > PAGE_SIZE && <Pagination page={safePage} totalPages={Math.ceil(results.length / PAGE_SIZE)} onPageChange={setPage} />}
    </>}
  </main><Footer /></div>
}
export default OrderHistoryPage
