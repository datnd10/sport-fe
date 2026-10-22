import type { HTMLAttributes } from 'react'
import './Badge.css'

// Shared status Badge used by both Storefront (Khách_Hàng) and Admin
// (Quản_Trị_Viên) pages, e.g. Trạng_Thái_Đơn_Hàng, Tồn_Kho status.
// "brand"/"accent" use the brand tokens; "error"/"warning" use the state
// tokens, per Requirement 11.4's exception for error/warning components.
// Requirements: 11.1, 11.2, 11.3
export type BadgeVariant = 'brand' | 'accent' | 'error' | 'warning'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

function Badge({ children, variant = 'brand', className, ...rest }: BadgeProps) {
  const classes = ['badge', `badge-${variant}`, className].filter(Boolean).join(' ')

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}

export default Badge
