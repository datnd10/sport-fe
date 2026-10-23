import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccountStore } from '../../store/accountStore'
import reviewService from '../../services/reviewService'
import { getErrorMessage } from '../../services/apiError'
import type { ReviewEligibility, ReviewResponse } from '../../services/reviewService.types'
import './Reviews.css'

type Attachment = { file: File; url: string }
export default function ReviewComposer({ productId, requestedOrderItemId, onSubmitted }: { productId: string; requestedOrderItemId?: string; onSubmitted: (review: ReviewResponse) => void }) {
  const account = useAccountStore((state) => state.account)
  const [eligible, setEligible] = useState<ReviewEligibility[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [eligibilityError, setEligibilityError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [orderItemId, setOrderItemId] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const urls = useRef(new Set<string>())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sending, setSending] = useState(false)
  const accountId = account?.id
  const role = account?.role
  useEffect(() => {
    let active = true
    if (accountId && role === 'CUSTOMER') {
      reviewService.getEligibility(productId).then((purchases) => {
        const items = requestedOrderItemId ? purchases.filter(item => item.orderItemId === requestedOrderItemId) : purchases
        if (active) { setEligible(items); setOrderItemId(items[0]?.orderItemId ?? ''); setEligibilityError(null) }
      }).catch((reason) => { if (active) setEligibilityError(getErrorMessage(reason, 'Không thể kiểm tra quyền đánh giá.')) })
        .finally(() => { if (active) setLoadedFor(`${productId}:${accountId}:${requestedOrderItemId ?? ''}:${retry}`) })
    }
    return () => { active = false }
  }, [productId, accountId, role, requestedOrderItemId, retry])
  useEffect(() => {
    const currentUrls = urls.current
    return () => { currentUrls.forEach((url) => URL.revokeObjectURL(url)); currentUrls.clear() }
  }, [])

  function removeImage(index: number) {
    const attachment = attachments[index]
    URL.revokeObjectURL(attachment.url)
    urls.current.delete(attachment.url)
    setAttachments((current) => current.filter((_, position) => position !== index))
  }

  if (!account) return <p className="review-composer-hint"><Link to="/login">Đăng nhập</Link> để đánh giá sản phẩm bạn đã mua.</p>
  if (account.role !== 'CUSTOMER') return null
  if (loadedFor !== `${productId}:${accountId}:${requestedOrderItemId ?? ''}:${retry}`) return <p role="status">Đang kiểm tra quyền đánh giá...</p>
  if (eligibilityError) return <div role="alert">{eligibilityError} <button type="button" onClick={() => setRetry((value) => value + 1)}>Thử lại</button></div>
  return <div className="review-composer">
    {success ? <p role="status" className="review-form-success">Đã gửi đánh giá của bạn.</p> : null}
    {eligible.length === 0 ? !success && <p className="review-composer-hint">{requestedOrderItemId ? 'Sản phẩm trong lần mua này đã được đánh giá hoặc chưa đủ điều kiện. Chỉ đơn hàng đã giao mới được đánh giá.' : 'Bạn có thể đánh giá sau khi đơn hàng đã giao. Mỗi sản phẩm trong một lần mua được đánh giá một lần.'}</p> : <form onSubmit={async (event) => {
      event.preventDefault()
      if (sending) return
      setSending(true); setError(null); setSuccess(false)
      try {
        const review = await reviewService.submitReview(productId, { orderItemId, rating, comment: comment.trim() }, attachments.map((item) => item.file))
        const remaining = eligible.filter((item) => item.orderItemId !== orderItemId)
        setEligible(remaining); setOrderItemId(remaining[0]?.orderItemId ?? '')
        attachments.forEach((item) => { URL.revokeObjectURL(item.url); urls.current.delete(item.url) })
        setAttachments([]); setComment(''); setRating(5); setSuccess(true)
        onSubmitted(review)
      } catch (reason) { setError(getErrorMessage(reason, 'Không thể gửi đánh giá. Vui lòng thử lại.')) }
      finally { setSending(false) }
    }}>
      <h4>Chia sẻ trải nghiệm của bạn</h4>
      <label htmlFor="review-order-item">Lần mua</label>
      <select id="review-order-item" value={orderItemId} disabled={sending} onChange={(event) => setOrderItemId(event.target.value)}>
        {eligible.map((item) => <option key={item.orderItemId} value={item.orderItemId}>#{item.orderCode} · {item.attributes}</option>)}
      </select>
      <fieldset disabled={sending} className="review-stars-input"><legend>Đánh giá của bạn</legend>
        {[1, 2, 3, 4, 5].map((value) => <label key={value}><input type="radio" name="review-rating" value={value} checked={rating === value} onChange={() => setRating(value)} aria-label={`${value} sao`} /><span className={value <= rating ? 'selected' : ''} aria-hidden="true">★</span></label>)}
        <span>{rating} / 5</span>
      </fieldset>
      <label htmlFor="review-comment">Nhận xét</label>
      <textarea id="review-comment" value={comment} disabled={sending} maxLength={5000} rows={4} placeholder="Chia sẻ về sản phẩm, kích cỡ và trải nghiệm sử dụng..." onChange={(event) => setComment(event.target.value)} />
      <label htmlFor="review-image-upload">Ảnh đính kèm ({attachments.length}/5)</label>
      <input id="review-image-upload" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={sending || attachments.length >= 5} onChange={(event) => {
        const files = Array.from(event.target.files ?? [])
        event.target.value = ''
        if (attachments.length + files.length > 5) { setError('Tối đa 5 ảnh cho một đánh giá.'); return }
        if (files.some((file) => file.size === 0 || file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
          setError('Chọn ảnh JPG, PNG hoặc WebP không rỗng, tối đa 5 MB mỗi ảnh.'); return
        }
        setError(null)
        const added = files.map((file) => { const url = URL.createObjectURL(file); urls.current.add(url); return { file, url } })
        setAttachments((current) => [...current, ...added])
      }} />
      <p className="review-upload-hint">Tối đa 5 ảnh JPG, PNG hoặc WebP, mỗi ảnh không quá 5 MB.</p>
      <div className="review-file-previews">{attachments.map((item, index) => <div key={item.url}><img src={item.url} alt={`Ảnh đã chọn ${index + 1}`} /><button type="button" disabled={sending} aria-label={`Bỏ ảnh ${index + 1}`} onClick={() => removeImage(index)}>×</button></div>)}</div>
      {error ? <p role="alert" className="review-form-error">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={sending}>{sending ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
    </form>}
  </div>
}
