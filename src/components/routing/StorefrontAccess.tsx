import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAccountStore } from '../../store/accountStore'

export default function StorefrontAccess({ children, sessionReady }: { children: ReactNode; sessionReady: boolean }) {
  const location = useLocation()
  const authenticated = useAccountStore((state) => state.isAuthenticated)
  const restoring = useAccountStore((state) => state.isRestoring)
  const publicPage = ['/', '/login', '/register'].includes(location.pathname)
    || /^\/products\/[^/]+\/?$/.test(location.pathname)
  if (publicPage) return <>{children}</>
  if (!sessionReady || restoring) return <p role="status">Đang kiểm tra đăng nhập...</p>
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}
