import { useEffect, useState } from 'react'
import { Button, DiscountIcon } from '../../components/shared'
import discountService from '../../services/discountService'
import type { AvailableDiscountResponse } from '../../services/discountService.types'
import { computeDiscountAmount } from '../../services/discountPricing'
import { orderMoney } from './orderFormatting'
import '../../components/shared/Skeleton.css'
import './AvailableDiscounts.css'

type Props = { subtotal: number; appliedCode?: string; disabled: boolean; onApply: (code: string) => Promise<void> }
function AvailableDiscounts({ subtotal, appliedCode, disabled, onApply }: Props) {
  const [offers, setOffers] = useState<AvailableDiscountResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError(false)
      try { const data = await discountService.getAvailableCodes(); if (active) setOffers(data) }
      catch { if (active) setError(true) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [retry])
  const sorted = [...offers].sort((a, b) => computeDiscountAmount(b, subtotal) - computeDiscountAmount(a, subtotal))
  return <div className="available-discounts" aria-labelledby="available-discounts-title">
    <div className="available-discounts-heading"><DiscountIcon /><h4 id="available-discounts-title">Ưu đãi dành cho đơn hàng</h4></div>
    <p className="available-discounts-intro">Chọn một mã bên dưới để áp dụng. Mỗi đơn hàng sử dụng một mã giảm giá.</p>
    {loading ? <div className="available-discounts-loading skeleton-block" role="status" aria-label="Đang tải mã giảm giá" /> : error ? <div className="available-discounts-feedback" role="alert"><span>Chưa tải được ưu đãi. Bạn vẫn có thể nhập mã bên dưới.</span><Button type="button" variant="ghost" onClick={() => setRetry(n => n + 1)}>Thử lại</Button></div> : sorted.length === 0 ? <p className="available-discounts-feedback">Hiện chưa có mã giảm giá còn hiệu lực. Bạn có thể nhập mã riêng nếu có.</p> : <>
      <ul className="available-discounts-list">{sorted.map((offer, index) => <li className={`available-discount ${appliedCode === offer.code ? 'is-applied' : ''}`} key={offer.id}>
        <div className="available-discount-value"><span>GIẢM</span><strong>{offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}%` : orderMoney(offer.discountValue)}</strong></div>
        <div className="available-discount-info"><div><strong>{offer.code}</strong>{index === 0 && computeDiscountAmount(offer, subtotal) > 0 && <span className="available-discount-best">Tiết kiệm nhất</span>}</div><span>Tiết kiệm {orderMoney(computeDiscountAmount(offer, subtotal))} cho đơn này</span><small>HSD: {new Date(offer.validTo).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div>
        <Button type="button" variant={appliedCode === offer.code ? 'secondary' : 'primary'} disabled={disabled || appliedCode === offer.code} aria-label={`${appliedCode === offer.code ? 'Đã áp dụng' : 'Áp dụng'} mã ${offer.code}`} onClick={() => { void onApply(offer.code) }}>{appliedCode === offer.code ? 'Đã chọn' : 'Áp dụng'}</Button>
      </li>)}</ul><p className="available-discounts-note">Ưu đãi còn hiệu lực và còn lượt sử dụng. Mã sẽ được kiểm tra lại khi đặt hàng.</p>
    </>}
  </div>
}
export default AvailableDiscounts
