import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAccountStore } from '../../store/accountStore'

// Route guard for Quản_Trị_Viên (Admin)-only routes. Requires both an
// authenticated session AND the ROLE_ADMIN role: unauthenticated users
// are sent to login (same as RequireAuth), while authenticated users
// without the Admin role are redirected home instead of seeing the
// admin route at all (Requirement 6.7).
function RequireAdmin({ children }: { children: ReactNode }) {
  const isAuthenticated = useAccountStore((state) => state.isAuthenticated)
  const isRestoring = useAccountStore((state) => state.isRestoring)
  const role = useAccountStore((state) => state.account?.role)
  const location = useLocation()

  if (isRestoring) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RequireAdmin
