import { apiClient } from './apiClient'
import type { AccountResponse, LoginRequest, LoginResponse, RegisterRequest } from './authService.types'

// API client for the Account & Auth module (design.md — "Module Account &
// Auth"). Talks to POST /api/auth/register and POST /api/auth/login.
// Requirements: 6.1, 6.2, 6.3, 6.4
const AUTH_BASE = '/auth'

/**
 * Registers a new Tài_Khoản (Account) with the Khách_Hàng (Customer) role.
 * Rejects (via a thrown AxiosError) when the email is already in use
 * (Requirement 6.2) or payload validation fails.
 */
async function register(payload: RegisterRequest): Promise<AccountResponse> {
  const response = await apiClient.post<AccountResponse>(`${AUTH_BASE}/register`, payload)
  return response.data
}

/**
 * Authenticates with email/password and returns the issued JWT alongside
 * the account's public profile (Requirement 6.3). Rejects with a generic
 * error when credentials are invalid (Requirement 6.4).
 */
async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(`${AUTH_BASE}/login`, payload)
  return response.data
}

export const authService = {
  register,
  login,
}

export default authService
