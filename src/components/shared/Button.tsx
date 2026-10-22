import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

// Shared Button component used by both Storefront (Khách_Hàng) and Admin
// (Quản_Trị_Viên) pages. Styling references the Tone_Màu_Chủ_Đạo design
// tokens defined in src/styles/tokens.css (task 23.1) — no hardcoded colors.
// Requirements: 11.1, 11.2, 11.3
export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

function Button({ children, variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  const variantClass = `btn-${variant}`
  const classes = ['btn', variantClass, className].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}

export default Button
