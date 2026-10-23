import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Footer, Header } from '../../components/shared'
import type { CartItemView } from '../../store/cartStore'
import { useCartStore } from '../../store/cartStore'
import { getErrorMessage } from '../../services/apiError'
import '../../components/shared/Skeleton.css'
import { resolveUploadUrl } from '../../services/apiClient'
import './CartPage.css'

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

function CartPage() {
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const items = useCartStore((state) => state.items)
  const totalAmount = useCartStore((state) => state.totalAmount)
  const isLoading = useCartStore((state) => state.isLoading)
  const message = useCartStore((state) => state.message)
  const loadCart = useCartStore((state) => state.loadCart)
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearMessage = useCartStore((state) => state.clearMessage)

  useEffect(() => {
    let active = true
    loadCart().then(() => { if (active) setLoadError(null) }).catch((error) => {
      if (active) setLoadError(getErrorMessage(error, 'Không thể tải giỏ hàng. Vui lòng thử lại.'))
    }).finally(() => { if (active) setHasLoaded(true) })
    return () => { active = false }
  }, [loadCart, retry])

  function handleQuantityChange(item: CartItemView, nextQuantity: number) {
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1 || item.stockQuantity < 1) {
      return
    }
    updateItemQuantity(item.id, Math.min(nextQuantity, item.stockQuantity))
  }

  const initialLoading = !hasLoaded || (isLoading && items.length === 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const checkoutBlocked = isLoading || items.some((item) => item.stockQuantity === 0 || item.quantity > item.stockQuantity || item.quantity < 1)

  return (
    <div className="cart-page">
      <Header showSearch={false} />

      <main className="cart-page-content">
        <nav className="cart-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Giỏ hàng</span></nav>
        <div className="cart-heading"><div><span className="cart-eyebrow">LANANHSPORT</span><h2 className="cart-page-title">Giỏ hàng của bạn</h2><p>Kiểm tra lựa chọn của bạn trước khi thanh toán.</p></div>{hasLoaded && !loadError ? <span className="cart-count">{itemCount} sản phẩm</span> : null}</div>

        {message ? (
          <div className="cart-page-message" role="status">
            <span>{message}</span>
            <button type="button" className="cart-page-message-dismiss" onClick={clearMessage} aria-label="Đóng">
              ×
            </button>
          </div>
        ) : null}

        {initialLoading ? <div className="cart-page-body" aria-busy="true"><span className="cart-loading-label" role="status">Đang tải giỏ hàng...</span><div aria-hidden="true" className="cart-skeleton-items">{[0, 1, 2].map((index) => <div key={index} className="skeleton-block cart-skeleton-item" />)}</div><div aria-hidden="true" className="skeleton-block cart-skeleton-summary" /></div> : null}
        {!initialLoading && loadError ? <div className="cart-page-empty" role="alert"><p>{loadError}</p><Button onClick={() => setRetry((value) => value + 1)}>Thử lại</Button></div> : null}

        {!initialLoading && !loadError && items.length === 0 ? (
          <div className="cart-page-empty">
            <span className="cart-empty-icon" aria-hidden="true">♧</span><h3>Giỏ hàng của bạn đang trống</h3><p>Khám phá sản phẩm và chọn món đồ phù hợp với bạn.</p>
            <Link className="btn btn-primary" to="/">Khám phá sản phẩm</Link>
          </div>
        ) : null}

        {!initialLoading && !loadError && items.length > 0 ? (
          <div className="cart-page-body">
            <ul className="cart-page-items">
              {items.map((item) => {
                const isOutOfStock = item.stockQuantity === 0
                return (
                  <li key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-product-identity">
                        <div className="cart-product-image" aria-hidden="true">
                          {item.imagePath ? <img src={resolveUploadUrl(item.imagePath)} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
                          <span className="cart-product-image-placeholder">◇</span>
                        </div>
                        <div><p className="cart-item-name">{item.productId ? <Link to={`/products/${item.productId}`}>{item.productName}</Link> : item.productName}</p>
                      <p className="cart-item-attributes">
                        {item.attributes} · SKU: {item.sku}
                      </p>
                      {isOutOfStock ? <Badge variant="error">Hết hàng</Badge> : null}
                        </div></div>
                    </div>

                    <div className="cart-item-price"><small>Đơn giá</small>{formatPrice(item.unitPrice)}</div>

                    <div className="cart-item-quantity">
                      <button
                        type="button"
                        className="cart-item-quantity-btn"
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isLoading || isOutOfStock}
                        aria-label={`Giảm số lượng ${item.productName}`}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="cart-item-quantity-input"
                        min={1}
                        max={item.stockQuantity}
                        value={item.quantity}
                        disabled={isLoading || isOutOfStock}
                        step={1}
                        onChange={(event) => handleQuantityChange(item, Number(event.target.value))}
                        aria-label={`Số lượng ${item.productName}`}
                      />
                      <button
                        type="button"
                        className="cart-item-quantity-btn"
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        disabled={item.quantity >= item.stockQuantity || isLoading}
                        aria-label={`Tăng số lượng ${item.productName}`}
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-subtotal"><small>Thành tiền</small>{formatPrice(item.lineTotal)}</div>

                    <Button
                      variant="ghost"
                      className="cart-item-remove"
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      aria-label={`Xóa ${item.productName} khỏi giỏ hàng`}
                    >
                      Xóa
                    </Button>
                  </li>
                )
              })}
            </ul>

            <aside className="cart-page-summary" aria-labelledby="cart-summary-heading">
              <h3 id="cart-summary-heading">Tóm tắt đơn hàng</h3>
              <div className="cart-summary-row"><span>Số lượng sản phẩm</span><strong>{itemCount}</strong></div>
              <div className="cart-summary-row"><span>Tạm tính</span><span>{formatPrice(totalAmount)}</span></div>
              <div className="cart-summary-total-row"><span className="cart-page-summary-label">Tổng tiền</span><span className="cart-page-summary-total">{formatPrice(totalAmount)}</span></div>
              <p className="cart-summary-note">Mã giảm giá và thông tin giao hàng được xác nhận ở bước thanh toán.</p>
              {checkoutBlocked ? <><Button disabled>Tiến hành thanh toán</Button><p className="cart-stock-warning">{isLoading ? 'Đang cập nhật giỏ hàng...' : 'Vui lòng xóa sản phẩm hết hàng hoặc điều chỉnh số lượng trước khi thanh toán.'}</p></> : <Link to="/checkout" className="btn btn-primary cart-checkout">Tiến hành thanh toán <span aria-hidden="true">→</span></Link>}
              <Link to="/" className="cart-continue">← Tiếp tục mua sắm</Link>
              <div className="cart-payment-note">Thanh toán khi nhận hàng hoặc chuyển khoản ngân hàng.</div>
            </aside>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}

export default CartPage
