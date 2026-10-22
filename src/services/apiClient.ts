import axios from 'axios'
import { getAccessToken, useAccountStore } from '../store/accountStore'
import type { ApiErrorResponse } from './authService.types'
import { notifyError } from './toast'

// Base URL is configured via the VITE_API_BASE_URL env variable so it can
// differ between local development, staging and production without code
// changes. Falls back to the local backend dev server.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * The backend's origin (no trailing `/api`), used to resolve
 * Hình_Ảnh_Sản_Phẩm `filePath`s, which are served from the static
 * `/uploads/**` resource handler (see WebConfig.java) rather than under
 * `/api`.
 */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

/**
 * Resolves a Hình_Ảnh_Sản_Phẩm's relative `filePath` (e.g.
 * `uploads/products/{id}/foo.jpg`) to an absolute URL against the
 * backend's origin.
 */
export function resolveUploadUrl(filePath: string): string {
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`
  return `${API_ORIGIN}${normalizedPath}`
}

// Attaches the JWT (when present) to every outgoing request. The token is
// held in memory by the account store (src/store/accountStore.ts); the
// store is the single source of truth, this interceptor just reads it.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Route guard integration (task 24.2, Requirement 6.5): whenever any API
// call comes back with 401 (missing/expired/invalid token), the session
// is no longer valid. Clear the stored auth state and send the user to
// the login page so they can re-authenticate. A hard navigation is used
// (rather than react-router's navigate) because this interceptor runs
// outside of React's render tree and may fire from any page, including
// ones rendered outside the router context (e.g. during tests).
//
// This interceptor also centralizes error toasts: every failed API call
// (network error, 4xx, 5xx) surfaces a toast.error with a human-readable
// message, so no individual page/store needs to remember to show one.
// Callers that want to react to the error further (e.g. render an
// inline field error) still can — this only adds the toast side effect.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status

      if (status === 401) {
        const { isAuthenticated, reset } = useAccountStore.getState()
        if (isAuthenticated) {
          reset()
          notifyError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.assign('/login')
          }
        } else {
          notifyError('Bạn cần đăng nhập để thực hiện hành động này.')
        }
      } else {
        const data = error.response?.data as ApiErrorResponse | undefined
        const message = data?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'
        notifyError(message)
      }
    } else {
      notifyError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    }
    return Promise.reject(error)
  },
)

export default apiClient
