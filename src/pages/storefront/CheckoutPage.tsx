import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Footer, Header } from '../../components/shared'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import discountService from '../../services/discountService'
import type { DiscountValidationResponse } from '../../services/discountService.types'
import orderService from '../../services/orderService'
import type { PaymentMethod } from '../../services/orderService.types'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import { useCartStore } from '../../store/cartStore'
import './CheckoutPage.css'
import AvailableDiscounts from './AvailableDiscounts'
import { computeDiscountAmount } from '../../services/discountPricing'

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

/**
 * Trang Checkout: shipping info form, Phương_Thức_Thanh_Toán selector,
 * and Mã_Giảm_Giá input, submitted together as a single Đơn_Hàng via
 * POST /api/orders. Works for both Khách_Hàng vãng lai (guest) and
 * authenticated accounts — cartStore already resolved which cart items
 * to show, this page only needs to read them.
 * Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
function CheckoutPage() {
  const navigate = useNavigate()
  const account = useAccountStore((state) => state.account)
  const items = useCartStore((state) => state.items)
  const totalAmount = useCartStore((state) => state.totalAmount)
  const loadCart = useCartStore((state) => state.loadCart)
  const resetCart = useCartStore((state) => state.reset)

  const [recipientName, setRecipientName] = useState(account?.fullName ?? '')
  const [recipientPhone, setRecipientPhone] = useState(account?.phone ?? '')
  const [shippingAddress, setShippingAddress] = useState(account?.address ?? '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')

  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidationResponse | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadCart()
  }, [loadCart])

  const discountAmount = computeDiscountAmount(appliedDiscount, totalAmount)
  const payableAmount = Math.max(totalAmount - discountAmount, 0)

  async function handleApplyDiscount(selectedCode?: string) {
    if (isValidatingDiscount || isSubmitting) return
    const code = (selectedCode ?? discountCodeInput).trim()
    setDiscountError(null)
    if (!code) {
      return
    }

    setIsValidatingDiscount(true)
    try {
      const validation = await discountService.validateCode(code)
      setAppliedDiscount(validation)
      setDiscountCodeInput(validation.code)
    } catch (error) {
      setAppliedDiscount(null)
      setDiscountError(getErrorMessage(error, 'Mã giảm giá không hợp lệ hoặc đã hết hiệu lực.'))
    } finally {
      setIsValidatingDiscount(false)
    }
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null)
    setDiscountCodeInput('')
    setDiscountError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    if (isValidatingDiscount) return

    if (items.length === 0) {
      setFormError('Giỏ hàng của bạn đang trống.')
      return
    }

    setIsSubmitting(true)
    try {
      const order = await orderService.createOrder({
        items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        recipientName,
        recipientPhone,
        shippingAddress,
        paymentMethod,
        discountCode: appliedDiscount?.code,
      })

      resetCart()
      notifySuccess('Đặt hàng thành công.')
      navigate(`/orders/confirmation/${order.id}`, { state: { order } })
    } catch (error) {
      const backendFieldErrors = getFieldErrors(error)
      if (backendFieldErrors.length > 0) {
        setFieldErrors(
          Object.fromEntries(backendFieldErrors.map((fieldError) => [fieldError.field, fieldError.message])),
        )
      }
      setFormError(getErrorMessage(error, 'Đặt hàng không thành công. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="checkout-page">
      <Header />

      <main className="checkout-page-content">
        <h2 className="checkout-page-title">Thanh toán</h2>

        {items.length === 0 ? (
          <div className="checkout-page-empty">
            <p>Giỏ hàng của bạn đang trống, không thể tiến hành thanh toán.</p>
            <Link to="/">Tiếp tục mua sắm</Link>
          </div>
        ) : (
          <form className="checkout-page-body" onSubmit={handleSubmit}>
            <div className="checkout-page-main">
              <section className="checkout-section">
                <h3 className="checkout-section-title">Thông tin giao hàng</h3>

                <div className="checkout-field">
                  <label htmlFor="checkout-recipientName">Tên người nhận</label>
                  <input
                    id="checkout-recipientName"
                    type="text"
                    autoComplete="name"
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    required
                  />
                  {fieldErrors.recipientName ? (
                    <span className="checkout-field-error">{fieldErrors.recipientName}</span>
                  ) : null}
                </div>

                <div className="checkout-field">
                  <label htmlFor="checkout-recipientPhone">Số điện thoại</label>
                  <input
                    id="checkout-recipientPhone"
                    type="tel"
                    autoComplete="tel"
                    value={recipientPhone}
                    onChange={(event) => setRecipientPhone(event.target.value)}
                    required
                  />
                  {fieldErrors.recipientPhone ? (
                    <span className="checkout-field-error">{fieldErrors.recipientPhone}</span>
                  ) : null}
                </div>

                <div className="checkout-field">
                  <label htmlFor="checkout-shippingAddress">Địa chỉ giao hàng</label>
                  <input
                    id="checkout-shippingAddress"
                    type="text"
                    autoComplete="street-address"
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    required
                  />
                  {fieldErrors.shippingAddress ? (
                    <span className="checkout-field-error">{fieldErrors.shippingAddress}</span>
                  ) : null}
                </div>
              </section>

              <section className="checkout-section">
                <h3 className="checkout-section-title">Phương thức thanh toán</h3>

                <div className="checkout-payment-options">
                  <label className="checkout-payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </label>

                  <label className="checkout-payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    />
                    <span>Chuyển khoản ngân hàng</span>
                  </label>
                </div>

                {paymentMethod === 'BANK_TRANSFER' ? (
                  <p className="checkout-payment-note">
                    Thông tin tài khoản ngân hàng/mã QR để chuyển khoản sẽ được hiển thị ở trang xác nhận sau khi đặt
                    hàng thành công.
                  </p>
                ) : null}
              </section>

              <section className="checkout-section">
                <h3 className="checkout-section-title">Mã giảm giá</h3>

                <AvailableDiscounts subtotal={totalAmount} appliedCode={appliedDiscount?.code}
                  disabled={isValidatingDiscount || isSubmitting} onApply={handleApplyDiscount} />

                <div className="checkout-manual-discount">
                <label htmlFor="checkout-discount-code">Bạn có mã khác? Nhập mã tại đây</label>

                {appliedDiscount ? (
                  <div className="checkout-discount-applied">
                    <span>
                      Đã áp dụng mã <strong>{appliedDiscount.code}</strong>
                    </span>
                    <Button type="button" variant="ghost" onClick={handleRemoveDiscount} disabled={isValidatingDiscount || isSubmitting}>
                      Hủy mã
                    </Button>
                  </div>
                ) : (
                  <div className="checkout-discount-input">
                    <input
                      type="text"
                      id="checkout-discount-code"
                      placeholder="Nhập mã giảm giá"
                      value={discountCodeInput}
                      onChange={(event) => setDiscountCodeInput(event.target.value)}
                      onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void handleApplyDiscount() } }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => { void handleApplyDiscount() }}
                      disabled={isSubmitting || isValidatingDiscount || !discountCodeInput.trim()}
                    >
                      {isValidatingDiscount ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </Button>
                  </div>
                )}

                {discountError ? <span className="checkout-field-error" role="alert">{discountError}</span> : null}
                </div>
              </section>
            </div>

            <aside className="checkout-summary">
              <h3 className="checkout-section-title">Đơn hàng của bạn</h3>

              <ul className="checkout-summary-items">
                {items.map((item) => (
                  <li key={item.id} className="checkout-summary-item">
                    <span className="checkout-summary-item-name">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="checkout-summary-item-price">{formatPrice(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="checkout-summary-row">
                <span>Tạm tính</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>

              {discountAmount > 0 ? (
                <div className="checkout-summary-row checkout-summary-discount">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              ) : null}

              <div className="checkout-summary-row checkout-summary-total">
                <span>Tổng tiền</span>
                <span>{formatPrice(payableAmount)}</span>
              </div>

              {formError ? <p className="checkout-form-error">{formError}</p> : null}

              <Button type="submit" disabled={isSubmitting || isValidatingDiscount} className="checkout-submit">
                {isSubmitting ? 'Đang đặt hàng...' : 'Đặt hàng'}
              </Button>
            </aside>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default CheckoutPage
