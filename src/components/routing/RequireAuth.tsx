import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAccountStore } from '../../store/accountStore'

// Route guard that only renders its children when the user is
// authenticated. Otherwise redirects to the Đăng nhập (login) page,
// remembering the originally requested location so LoginPage can send
// the user back after a successful login.
// Requirements: 6.5
function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAccountStore((state) => state.isAuthenticated)
  const isRestoring = useAccountStore((state) => state.isRestoring)
  const location = useLocation()

  if (isRestoring) {
    // Avoid redirecting to /login while a persisted session is still
    // being restored on initial app load (see accountStore.restoreSession).
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default RequireAuth
