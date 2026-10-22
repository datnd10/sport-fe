import type { SVGProps } from 'react'

// Small hand-drawn inline SVG icon set shared by Admin UI (sidebar nav +
// table row actions). Deliberately minimal (stroke-based, 24x24,
// currentColor) so no icon library dependency is introduced. Each icon
// is a plain function component so call sites can size/color them with
// normal CSS (width/height/color) like any other element.

type IconProps = SVGProps<SVGSVGElement>

function baseProps(props: IconProps): IconProps {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  }
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

export function CategoryIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}

export function ProductIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  )
}

export function InventoryIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M3 11h18" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function OrderIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v3h3" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </svg>
  )
}

export function DiscountIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M20 12 12 20l-9-9 8-8h5a2 2 0 0 1 2 2z" />
      <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ReviewIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.5 14.4 9l5.6.5-4.2 3.8L17 19l-5-3-5 3 1.2-5.7L4 9.5l5.6-.5Z" />
    </svg>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}

/** Chevron pointing left/right, used for the desktop collapse toggle. */
export function ChevronIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

/** Simple stylized ball icon used as the sidebar brand mark. */
export function BallLogoIcon(props: IconProps) {
  return (
    <svg {...baseProps({ strokeWidth: 1.5, ...props })}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="M5.3 5.3c2 2.4 2 11 0 13.4" />
      <path d="M18.7 5.3c-2 2.4-2 11 0 13.4" />
    </svg>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/** Eye with a slash through it, used to toggle a password field back to hidden. */
export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a14.6 14.6 0 0 1-3 3.9" />
      <path d="M6.2 6.2C4 7.8 2.5 10 2.5 12c0 0 1.8 3.6 5.6 5.7" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

/** Filled checkmark in a circle, used for feature/benefit bullet lists. */
export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.3l2.3 2.3 4.7-5.2" />
    </svg>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
      <path d="M14.5 6.5l3 3" />
    </svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

/** Magnifying glass, used on explicit "Tìm kiếm" (search) submit buttons. */
export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

/** Plus sign, used on icon-only "create new" action buttons. */
export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

/** Door with an arrow pointing out, used on the "Đăng xuất" (logout) button. */
export function LogoutIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

/** Simple person silhouette, used for the "Tài khoản" (Account) sidebar nav item. */
export function AccountIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  )
}

/**
 * Closed padlock with the shackle down, used on "khóa tài khoản" (lock
 * account) row actions — the account is currently enabled and clicking
 * will disable/lock it.
 */
export function LockIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <path d="M12 15v2" />
    </svg>
  )
}

/**
 * Open padlock with the shackle lifted off to one side, used on "mở
 * khóa tài khoản" (unlock account) row actions — the account is
 * currently disabled and clicking will re-enable it.
 */
export function UnlockIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 7.4-2" />
      <path d="M12 15v2" />
    </svg>
  )
}
