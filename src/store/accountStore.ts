import { create } from 'zustand'
import accountService, { type UpdateProfileRequest } from '../services/accountService'
import authService from '../services/authService'
import type { AccountResponse, LoginRequest, RegisterRequest } from '../services/authService.types'
import { clearStoredToken, readStoredToken, writeStoredToken } from '../services/tokenStorage'
import { useCartStore } from './cartStore'

// Tài_Khoản (Account) store: holds the current session (JWT + profile) in
// memory, with a controlled, explicit persistence path through
// tokenStorage.ts so only this store touches localStorage for the token.
// Requirements: 6.1, 6.2, 6.3, 6.4
interface AccountState {
  token: string | null
  account: AccountResponse | null
  isAuthenticated: boolean
  /** True while restoreSession() is checking for a persisted session. */
  isRestoring: boolean

  register: (payload: RegisterRequest) => Promise<AccountResponse>
  login: (payload: LoginRequest) => Promise<AccountResponse>
  logout: () => void
  /**
   * Restores the in-memory session from the persisted token on app
   * startup (e.g. page reload), then fetches the account profile (which
   * includes the role) so route guards like RequireAdmin can evaluate
   * ROLE_ADMIN immediately (Requirement 6.7). If the token turns out to
   * be expired/invalid, the GET /api/account/me call fails with 401 and
   * the apiClient response interceptor (task 24.2) clears the session.
   */
  restoreSession: () => Promise<void>
  /** Re-fetches the current account's profile from the backend. */
  refreshProfile: () => Promise<AccountResponse>
  /**
   * Updates the current account's profile (fullName, phone, address) via
   * PUT /api/account/me and keeps the in-memory profile in sync with the
   * backend's response (Requirement 6.6).
   */
  updateProfile: (payload: UpdateProfileRequest) => Promise<AccountResponse>
  reset: () => void
}

export const useAccountStore = create<AccountState>((set, get) => ({
  token: null,
  account: null,
  isAuthenticated: false,
  isRestoring: false,

  register: async (payload) => {
    // Registration does not log the user in automatically on the backend
    // (POST /api/auth/register only returns the created account, no
    // token) — callers should follow up with login() or redirect to the
    // login page per Requirement 6.1.
    return authService.register(payload)
  },

  login: async (payload) => {
    const response = await authService.login(payload)
    writeStoredToken(response.token)
    set({ token: response.token, account: response.account, isAuthenticated: true })

    // Merge any guest cart built up before login into the account's
    // server-side Giỏ_Hàng (Requirement 3.6). A failed merge must not
    // fail the login itself — the guest cart is preserved locally and
    // cartStore surfaces its own message for this case.
    await useCartStore.getState().mergeGuestCartOnLogin()

    return response.account
  },

  logout: () => {
    clearStoredToken()
    set({ token: null, account: null, isAuthenticated: false })
  },

  restoreSession: async () => {
    if (get().isRestoring) {
      return
    }
    set({ isRestoring: true })
    const storedToken = readStoredToken()
    if (!storedToken) {
      set({ isRestoring: false })
      return
    }

    // The account profile itself is not persisted; only the token is.
    // Set the token first so the apiClient interceptor attaches it to
    // the GET /api/account/me request below.
    set({ token: storedToken, isAuthenticated: true })
    try {
      const account = await accountService.getProfile()
      set({ account })
    } catch {
      // Invalid/expired token: the apiClient response interceptor already
      // clears the session on 401. Nothing else to do here.
    } finally {
      set({ isRestoring: false })
    }
  },

  refreshProfile: async () => {
    const account = await accountService.getProfile()
    set({ account })
    return account
  },

  updateProfile: async (payload) => {
    const account = await accountService.updateProfile(payload)
    set({ account })
    return account
  },

  reset: () => {
    clearStoredToken()
    set({ token: null, account: null, isAuthenticated: false, isRestoring: false })
  },
}))

/**
 * Reads the current in-memory access token outside of a React render
 * (e.g. from the axios interceptor in apiClient.ts), without subscribing
 * to the store.
 */
export function getAccessToken(): string | null {
  return useAccountStore.getState().token
}
