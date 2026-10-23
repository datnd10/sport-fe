import { Link } from 'react-router-dom'
import { ProductIcon } from '../../components/shared'
import { resolveUploadUrl } from '../../services/apiClient'
import type { OrderItemResponse } from '../../services/orderService.types'
import '../../components/shared/Skeleton.css'
import { orderMoney } from './orderFormatting'

export function OrderProduct({ item, review = false }: { item: OrderItemResponse; review?: boolean }) {
  return <li className="orders-product">
    <div className="orders-product-image"><ProductIcon />{item.imagePath && <img src={resolveUploadUrl(item.imagePath)} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} />}</div>
    <div className="orders-product-info"><strong>{item.productId ? <Link to={`/products/${item.productId}`}>{item.productName}</Link> : item.productName}</strong>{item.attributes && <span>{item.attributes}</span>}<small>{item.sku && `SKU: ${item.sku} · `}Số lượng: {item.quantity}</small>
      {review && item.productId && <Link className="orders-review-link" to={`/products/${item.productId}?orderItemId=${encodeURIComponent(item.id)}#reviews-heading`}>Đánh giá sản phẩm ↗</Link>}
    </div>
    <div className="orders-product-price"><strong>{orderMoney(item.lineTotal)}</strong><small>{orderMoney(item.unitPrice)} / sản phẩm</small></div>
  </li>
}
export function OrderLoading() {
  return <div className="orders-loading" role="status" aria-label="Đang tải đơn hàng" aria-busy="true">
    {[0, 1, 2].map(n => <div className="orders-panel orders-skeleton" key={n}><div className="skeleton-block" /><div className="skeleton-block" /><div className="skeleton-block" /></div>)}
  </div>
}
