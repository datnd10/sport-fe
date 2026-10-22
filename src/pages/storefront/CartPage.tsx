import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Footer, Header } from '../../components/shared'
import type { CartItemView } from '../../store/cartStore'
import { useCartStore } from '../../store/cartStore'
import './CartPage.css'

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

/**
 * Trang Giỏ_Hàng (Cart page): lists every item in the current Giỏ_Hàng
 * with add/update-quantity/remove actions, each item's subtotal
 * (lineTotal), and the cart's total. Works identically for Khách_Hàng
 * vãng lai (guest, localStorage-backed) and authenticated accounts
 * (backend-API-backed) — the store (cartStore.ts) already resolved which
 * mode to use, so this component never branches on auth state itself.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
function CartPage() {
  const items = useCartStore((state) => state.items)
  const totalAmount = useCartStore((state) => state.totalAmount)
  const isLoading = useCartStore((state) => state.isLoading)
  const message = useCartStore((state) => state.message)
  const loadCart = useCartStore((state) => state.loadCart)
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearMessage = useCartStore((state) => state.clearMessage)

  useEffect(() => {
    loadCart()
  }, [loadCart])

  function handleQuantityChange(item: CartItemView, nextQuantity: number) {
    if (nextQuantity < 1) {
      return
    }
    updateItemQuantity(item.id, nextQuantity)
  }

  return (
    <div className="cart-page">
      <Header />

      <main className="cart-page-content">
        <h2 className="cart-page-title">Giỏ hàng</h2>

        {message ? (
          <div className="cart-page-message" role="status">
            <span>{message}</span>
            <button type="button" className="cart-page-message-dismiss" onClick={clearMessage} aria-label="Đóng">
              ×
            </button>
          </div>
        ) : null}

        {isLoading && items.length === 0 ? <p className="cart-page-status">Đang tải...</p> : null}

        {!isLoading && items.length === 0 ? (
          <div className="cart-page-empty">
            <p>Giỏ hàng của bạn đang trống.</p>
            <Link to="/">Tiếp tục mua sắm</Link>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="cart-page-body">
            <ul className="cart-page-items">
              {items.map((item) => {
                const isOutOfStock = item.stockQuantity === 0
                return (
                  <li key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <p className="cart-item-name">{item.productName}</p>
                      <p className="cart-item-attributes">
                        {item.attributes} · SKU: {item.sku}
                      </p>
                      {isOutOfStock ? <Badge variant="error">Hết hàng</Badge> : null}
                    </div>

                    <div className="cart-item-price">{formatPrice(item.unitPrice)}</div>

                    <div className="cart-item-quantity">
                      <button
                        type="button"
                        className="cart-item-quantity-btn"
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isLoading}
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
                        disabled={isLoading}
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

                    <div className="cart-item-subtotal">{formatPrice(item.lineTotal)}</div>

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

            <div className="cart-page-summary">
              <span className="cart-page-summary-label">Tổng tiền:</span>
              <span className="cart-page-summary-total">{formatPrice(totalAmount)}</span>
            </div>

            <div className="cart-page-actions">
              <Link to="/">
                <Button variant="ghost">Tiếp tục mua sắm</Button>
              </Link>
              <Link to="/checkout">
                <Button variant="primary">Tiến hành thanh toán</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}

export default CartPage
