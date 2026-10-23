import type { DiscountType } from './discountService.types'

/** Preview only; the backend recalculates the final discount when the order is placed. */
export function computeDiscountAmount(discount: { discountType: DiscountType; discountValue: number } | null, subtotal: number): number {
  if (!discount) return 0
  const raw = discount.discountType === 'PERCENTAGE'
    ? Math.round(subtotal * discount.discountValue) / 100
    : discount.discountValue
  return Math.max(0, Math.min(raw, subtotal))
}
