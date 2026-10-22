import { apiClient } from './apiClient'
import type { AccountResponse } from './authService.types'

// API client for the authenticated account's own profile
// (design.md — "Module Account & Auth"). Talks to
// GET/PUT /api/account/me. Requirements: 6.6
const ACCOUNT_BASE = '/account'

export interface UpdateProfileRequest {
  fullName: string
  phone?: string
  address?: string
}

/** Fetches the current account's profile (Requirement 6.6). */
async function getProfile(): Promise<AccountResponse> {
  const response = await apiClient.get<AccountResponse>(`${ACCOUNT_BASE}/me`)
  return response.data
}

/**
 * Updates the current account's profile (fullName, phone, address).
 * Returns the updated profile on success (Requirement 6.6).
 */
async function updateProfile(payload: UpdateProfileRequest): Promise<AccountResponse> {
  const response = await apiClient.put<AccountResponse>(`${ACCOUNT_BASE}/me`, payload)
  return response.data
}

export const accountService = {
  getProfile,
  updateProfile,
}

export default accountService
