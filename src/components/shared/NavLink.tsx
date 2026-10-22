import { NavLink as RouterNavLink, type NavLinkProps as RouterNavLinkProps } from 'react-router-dom'
import './NavLink.css'

// Shared navigation link used by both Storefront and Admin navigation.
// Wraps React Router's NavLink and highlights the active/selected link
// using the brand design tokens (--color-brand-primary-light background,
// --color-brand-primary text) instead of hardcoded colors.
// Requirements: 11.1, 11.2, 11.3
type NavLinkProps = Omit<RouterNavLinkProps, 'className'> & {
  className?: string
}

function NavLink({ className, ...rest }: NavLinkProps) {
  return (
    <RouterNavLink
      {...rest}
      className={({ isActive }) =>
        ['nav-link', isActive ? 'nav-link-active' : '', className].filter(Boolean).join(' ')
      }
    />
  )
}

export default NavLink
