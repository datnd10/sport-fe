import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, DiscountIcon, OrderIcon, ProductIcon, AccountIcon } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import dashboardService from '../../services/dashboardService'
import type { DashboardOverview, OverviewRange } from '../../services/dashboardService.types'
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from '../storefront/orderStatus'
import AdminLayout from './AdminLayout'
import '../../components/shared/Skeleton.css'
import './AdminDashboardPage.css'

const money = (n: number) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
const number = (n: number) => n.toLocaleString('vi-VN')
const shortDate = (date: string) => date.split('-').slice(1).reverse().join('/')
const fullDate = (date: string) => date.split('-').reverse().join('/')
const shortMoney = (n: number) => n >= 1e9 ? `${number(n / 1e9)} tỷ` : n >= 1e6 ? `${number(n / 1e6)} tr` : n >= 1000 ? `${number(n / 1000)}k` : number(n)
const time = (date: string) => new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
const colors = { PENDING: '#d59b2b', CONFIRMED: '#6a9abd', SHIPPING: '#7476b4', DELIVERED: '#2e7d32', CANCELLED: '#ce6969' }
const ranges: { key: OverviewRange; label: string }[] = [{ key: 'today', label: 'Hôm nay' }, { key: '7days', label: '7 ngày qua' }, { key: '30days', label: '30 ngày qua' }, { key: 'month', label: 'Tháng này' }, { key: 'custom', label: 'Tùy chọn' }]

function Change({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <span className="db-change db-change-neutral">{current ? 'Kỳ trước chưa có dữ liệu so sánh' : 'Không đổi so với kỳ trước'}</span>
  const percent = (current - previous) / previous * 100
  return <span className={`db-change ${percent === 0 ? 'db-change-neutral' : percent > 0 ? 'db-change-up' : 'db-change-down'}`}>{percent > 0 ? '↑' : percent < 0 ? '↓' : '→'} {Math.abs(percent).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% <small>so với kỳ trước</small></span>
}
function Empty({ text }: { text: string }) { return <div className="db-empty"><OrderIcon /><p>{text}</p></div> }
function Loading() { return <div className="db-loading" role="status" aria-label="Đang tải dashboard"><div className="db-kpis">{[0, 1, 2, 3].map(n => <div className="db-panel db-skeleton" key={n}><i className="skeleton-block" /><i className="skeleton-block" /><i className="skeleton-block" /></div>)}</div><div className="db-chart-grid">{[0, 1].map(n => <div className="db-panel db-skeleton db-skeleton-chart" key={n}><i className="skeleton-block" /></div>)}</div></div> }

function AdminDashboardPage() {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
  const [choice, setChoice] = useState<OverviewRange>('7days')
  const [from, setFrom] = useState(today.slice(0, 8) + '01')
  const [to, setTo] = useState(today)
  const [params, setParams] = useState<{ range: OverviewRange; from?: string; to?: string }>({ range: '7days' })
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateError, setDateError] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError(null)
      try { const result = await dashboardService.getOverview(params); if (active) setData(result) }
      catch (reason) { if (active) setError(getErrorMessage(reason, 'Không thể tải dashboard. Vui lòng thử lại.')) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [params, refresh])
  function selectRange(next: OverviewRange) {
    setChoice(next); setDateError('')
    if (next !== 'custom') setParams({ range: next })
  }
  function applyDates(event: FormEvent) {
    event.preventDefault()
    if (!from || !to || from > to || to > today || (Date.parse(to) - Date.parse(from)) / 86400000 >= 366) {
      setDateError('Chọn khoảng ngày hợp lệ, tối đa 366 ngày và không vượt quá hôm nay.'); return
    }
    setDateError(''); setParams({ range: 'custom', from, to })
  }
  const m = data?.metrics
  const p = data?.previousMetrics
  const totalCategoryValue = data?.categories.reduce((sum, item) => sum + item.revenue, 0) ?? 0
  return <AdminLayout title="Tổng quan"><div className="dashboard">
    <header className="db-heading"><div><span className="db-eyebrow">LANANHSPORT · ĐIỀU HÀNH CỬA HÀNG</span><h2>Tổng quan kinh doanh</h2><p>Nắm bắt tình hình bán hàng và những việc cần xử lý trong ngày.</p></div><div className="db-heading-actions"><span>{data ? `Cập nhật lúc ${time(data.generatedAt)}` : 'Thống kê theo giờ Việt Nam'}</span><Button variant="secondary" disabled={loading} onClick={() => setRefresh(n => n + 1)}>{loading ? 'Đang cập nhật…' : '↻ Làm mới'}</Button></div></header>
    <section className="db-panel db-toolbar" aria-label="Khoảng thời gian thống kê"><div className="db-range-buttons" role="group" aria-label="Chọn khoảng thời gian">{ranges.map(r => <button type="button" key={r.key} aria-pressed={choice === r.key} onClick={() => selectRange(r.key)}>{r.label}</button>)}</div><span className="db-timezone">UTC+7 · Việt Nam</span>
      {choice === 'custom' && <form className="db-date-form" onSubmit={applyDates}><label>Từ ngày<input type="date" value={from} max={to || today} onChange={e => setFrom(e.target.value)} required /></label><label>Đến ngày<input type="date" value={to} min={from} max={today} onChange={e => setTo(e.target.value)} required /></label><Button type="submit">Áp dụng</Button>{dateError && <p role="alert">{dateError}</p>}</form>}
    </section>
    {loading ? <Loading /> : error ? <div className="db-panel db-error" role="alert"><h3>Chưa thể tải tổng quan</h3><p>{error}</p><Button onClick={() => setRefresh(n => n + 1)}>Thử lại</Button></div> : data && m && p && <>
      <div className="db-period"><span>Thống kê <strong>{fullDate(data.from)} — {fullDate(data.to)}</strong></span><span>So sánh {fullDate(data.previousFrom)} — {fullDate(data.previousTo)}</span></div>
      <section className="db-kpis" aria-label="Chỉ số kinh doanh">
        <article className="db-panel db-kpi db-kpi-featured"><div className="db-kpi-label"><span>Giá trị đơn đặt</span><OrderIcon /></div><strong>{money(m.orderedValue)}</strong><Change current={m.orderedValue} previous={p.orderedValue} /><p>Sau giảm giá · Không gồm đơn hủy</p></article>
        <article className="db-panel db-kpi"><div className="db-kpi-label"><span>Giá trị đơn đã giao</span><span className="db-check" aria-hidden="true">✓</span></div><strong>{money(m.deliveredValue)}</strong><Change current={m.deliveredValue} previous={p.deliveredValue} /><p>{number(m.deliveredOrders)} đơn đã giao trong tập đơn đã chọn</p></article>
        <article className="db-panel db-kpi"><div className="db-kpi-label"><span>Tổng số đơn hàng</span><OrderIcon /></div><strong>{number(m.totalOrders)}</strong><Change current={m.totalOrders} previous={p.totalOrders} /><p>Bao gồm tất cả trạng thái</p></article>
        <article className="db-panel db-kpi"><div className="db-kpi-label"><span>Giá trị đơn trung bình</span><ProductIcon /></div><strong>{money(m.averageOrderValue)}</strong><Change current={m.averageOrderValue} previous={p.averageOrderValue} /><p>Tính trên các đơn chưa hủy</p></article>
      </section>
      <section className="db-panel db-secondary" aria-label="Chỉ số bổ sung"><div><AccountIcon /><span>Khách hàng mới<strong>{number(m.newCustomers)}</strong></span></div><div><ProductIcon /><span>Sản phẩm được đặt<strong>{number(m.unitsSold)}</strong></span></div><div><DiscountIcon /><span>Giảm giá đã áp dụng<strong>{money(m.discountAmount)}</strong></span></div><div><OrderIcon /><span>Đơn đã hủy<strong>{number(m.cancelledOrders)} <small>({m.totalOrders ? (m.cancelledOrders / m.totalOrders * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : 0}%)</small></strong></span></div></section>
      <section className="db-work" aria-labelledby="db-work-title"><div className="db-section-heading"><div><h3 id="db-work-title">Cần xử lý</h3><p>Tình trạng hiện tại trên toàn hệ thống, không phụ thuộc bộ lọc ngày.</p></div></div><div className="db-tasks">
        <Link to="/admin/orders?status=PENDING"><span className="db-task-icon db-amber"><OrderIcon /></span><div><span>Chờ xác nhận</span><strong>{number(data.operations.pendingOrders)} <small>đơn hàng</small></strong></div><span aria-hidden="true">↗</span></Link>
        <Link to="/admin/orders?status=CONFIRMED"><span className="db-task-icon"><ProductIcon /></span><div><span>Cần chuẩn bị hàng</span><strong>{number(data.operations.confirmedOrders)} <small>đơn hàng</small></strong></div><span aria-hidden="true">↗</span></Link>
        <Link to="/admin/orders?status=SHIPPING"><span className="db-task-icon"><OrderIcon /></span><div><span>Đang giao</span><strong>{number(data.operations.shippingOrders)} <small>đơn hàng</small></strong></div><span aria-hidden="true">↗</span></Link>
      </div></section>
      <div className="db-chart-grid"><section className="db-panel db-chart"><div className="db-section-heading"><div><h3>Giá trị đơn hàng theo ngày</h3><p>Theo ngày đặt đơn · Đã trừ giảm giá</p></div></div>{m.totalOrders === 0 ? <Empty text="Chưa có đơn hàng trong khoảng thời gian này." /> : <div className="db-chart-canvas"><ResponsiveContainer width="100%" height={300}><LineChart data={data.trend} margin={{ top: 15, right: 12, left: 0, bottom: 5 }}><CartesianGrid stroke="#e4ebe6" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={25} /><YAxis tickFormatter={shortMoney} tickLine={false} axisLine={false} width={65} /><Tooltip formatter={value => money(Number(value ?? 0))} labelFormatter={label => fullDate(String(label))} /><Legend iconType="plainline" /><Line dataKey="orderedValue" name="Đơn đặt (chưa hủy)" stroke="#81ae86" strokeWidth={2} strokeDasharray="5 4" dot={data.trend.length === 1} isAnimationActive={false} /><Line dataKey="deliveredValue" name="Đơn đã giao" stroke="#2e7d32" strokeWidth={3} dot={data.trend.length === 1} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>}</section>
      <section className="db-panel db-chart db-status-chart"><div className="db-section-heading"><div><h3>Phân bố trạng thái</h3><p>Các đơn được tạo trong khoảng đã chọn</p></div></div>{m.totalOrders === 0 ? <Empty text="Chưa có dữ liệu trạng thái đơn hàng." /> : <><div className="db-donut"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={m.statuses.filter(s => s.count > 0).map(s => ({ ...s, name: ORDER_STATUS_LABELS[s.status] }))} dataKey="count" nameKey="name" innerRadius={57} outerRadius={78} paddingAngle={3} stroke="none" isAnimationActive={false}>{m.statuses.filter(s => s.count > 0).map(s => <Cell key={s.status} fill={colors[s.status]} />)}</Pie><Tooltip formatter={value => `${number(Number(value ?? 0))} đơn`} /></PieChart></ResponsiveContainer><div className="db-donut-total"><strong>{number(m.totalOrders)}</strong><span>đơn hàng</span></div></div><div className="db-status-legend">{m.statuses.map(s => <div key={s.status}><i style={{ background: colors[s.status] }} /><span>{ORDER_STATUS_LABELS[s.status]}</span><strong>{number(s.count)}</strong><small>{(s.count / m.totalOrders * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</small></div>)}</div></>}</section></div>
      <div className="db-detail-grid"><section className="db-panel db-products"><div className="db-section-heading"><div><h3>Top sản phẩm được đặt</h3><p>Tối đa 10 sản phẩm · Số lượng từ đơn chưa hủy</p></div><Link to="/admin/products">Quản lý sản phẩm ↗</Link></div>{!data.topProducts.length ? <Empty text="Chưa có sản phẩm được đặt trong khoảng này." /> : <div className="db-table-wrap"><table className="db-table"><thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá trị sau giảm</th></tr></thead><tbody>{data.topProducts.map((item, index) => <tr key={item.productId}><td><div className="db-product-name"><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.productName}</strong></div></td><td>{number(item.quantity)}</td><td>{money(item.netValue)}</td></tr>)}</tbody></table></div>}</section>
      <section className="db-panel db-categories"><div className="db-section-heading"><div><h3>Giá trị theo danh mục</h3><p>Phân bổ giảm giá theo giá trị sản phẩm trong đơn</p></div></div>{!data.categories.length ? <Empty text="Chưa có dữ liệu danh mục trong khoảng này." /> : <><div className="db-category-list">{data.categories.map((item, i) => <div key={item.categoryId}><div><span>{item.categoryName}</span><strong>{money(item.revenue)}</strong></div><meter min={0} max={totalCategoryValue || 1} value={item.revenue} aria-label={`${item.categoryName}: ${money(item.revenue)}`} style={{ accentColor: i === 0 ? '#2e7d32' : '#81ae86' }} /><small>{totalCategoryValue ? (item.revenue / totalCategoryValue * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : 0}% giá trị đơn đặt</small></div>)}</div><div className="db-category-total"><span>Tổng sau giảm giá</span><strong>{money(totalCategoryValue)}</strong></div></>}</section></div>
      <section className="db-panel db-recent"><div className="db-section-heading"><div><h3>Đơn hàng mới nhất</h3><p>8 đơn gần nhất trên toàn hệ thống</p></div><Link to="/admin/orders">Tất cả đơn hàng ↗</Link></div>{!data.recentOrders.length ? <Empty text="Cửa hàng chưa có đơn hàng nào." /> : <div className="db-table-wrap"><table className="db-table"><thead><tr><th>Mã đơn / Thời gian</th><th>Khách hàng</th><th>Trạng thái</th><th>Thành tiền</th><th><span className="db-sr-only">Thao tác</span></th></tr></thead><tbody>{data.recentOrders.map(o => <tr key={o.id}><td><Link className="db-order-code" to={`/admin/orders?keyword=${encodeURIComponent(o.orderCode)}`}>#{o.orderCode}</Link><small className="db-cell-sub">{time(o.createdAt)}</small></td><td>{o.accountFullName || o.accountEmail || 'Khách vãng lai'}</td><td><Badge variant={ORDER_STATUS_BADGE_VARIANTS[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge></td><td className="db-table-money">{money(o.totalAmount)}</td><td><Link className="db-row-action" aria-label={`Xử lý đơn ${o.orderCode}`} to={`/admin/orders?keyword=${encodeURIComponent(o.orderCode)}`}>Xem →</Link></td></tr>)}</tbody></table></div>}</section>
      <section className="db-panel db-stock"><div className="db-section-heading"><div><h3>Cảnh báo tồn kho</h3><p>Chỉ tính biến thể và sản phẩm đang hoạt động · Tình trạng hiện tại</p></div><Link to="/admin/inventory">Quản lý tồn kho ↗</Link></div><div className="db-stock-counts"><Link to="/admin/inventory?stockStatus=OUT_OF_STOCK"><span className="db-stock-dot db-stock-dot-red" />{number(data.operations.outOfStockVariants)} biến thể hết hàng ↗</Link><Link to="/admin/inventory?stockStatus=LOW_STOCK"><span className="db-stock-dot db-stock-dot-amber" />{number(data.operations.lowStockVariants)} biến thể sắp hết ↗</Link></div>{!data.stockAlerts.length ? <Empty text="Không có biến thể đang hoạt động cần cảnh báo tồn kho." /> : <div className="db-table-wrap"><table className="db-table"><thead><tr><th>Sản phẩm / SKU</th><th>Tồn kho</th><th>Ngưỡng cảnh báo</th><th>Trạng thái</th><th><span className="db-sr-only">Thao tác</span></th></tr></thead><tbody>{data.stockAlerts.map(s => <tr key={s.variantId}><td><strong>{s.productName}</strong><small className="db-cell-sub">{s.sku}</small></td><td><strong className={s.stockQuantity === 0 ? 'db-stock-zero' : ''}>{number(s.stockQuantity)}</strong></td><td>{number(s.lowStockThreshold)}</td><td><Badge variant={s.status === 'OUT_OF_STOCK' ? 'error' : 'warning'}>{s.status === 'OUT_OF_STOCK' ? 'Hết hàng' : 'Sắp hết hàng'}</Badge></td><td><Link className="db-row-action" to={`/admin/inventory?keyword=${encodeURIComponent(s.sku)}`}>Cập nhật →</Link></td></tr>)}</tbody></table></div>}</section>
      <footer className="db-definition"><strong>Cách đọc số liệu</strong><p>Các chỉ số theo kỳ được tính theo ngày tạo đơn tại Việt Nam (UTC+7); trạng thái là trạng thái hiện tại của đơn. Giá trị đơn đặt, danh mục và sản phẩm đều đã trừ giảm giá và loại đơn hủy. Giá trị đơn đã giao là phần thuộc các đơn hiện đã giao, chưa phải xác nhận tiền thực thu. Kỳ trước có cùng số ngày và nằm ngay trước khoảng đang xem.</p></footer>
    </>}
  </div></AdminLayout>
}
export default AdminDashboardPage
