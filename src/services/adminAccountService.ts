import { apiClient } from './apiClient'
import type { PageResponse } from './common.types'
import type { AdminAccountListParams, AdminAccountResponse } from './adminAccountService.types'

// API client for the Admin Tài_Khoản (Account) management page. Every
// endpoint here lives under /api/admin/accounts/** and requires
// ROLE_ADMIN per SecurityConfig. Scope is deliberately limited to
// viewing + searching + khóa/mở khóa (enable/disable) — no delete, no
// role change, no editing another Tài_Khoản's personal info.
const ADMIN_ACCOUNT_BASE = '/admin/accounts'

/**
 * Fetches a paginated, optionally filtered page of Tài_Khoản for the
 * Admin account management list. `page` is 0-based, mirroring the
 * backend. `keyword` searches email OR fullName (case-insensitive
 * contains); results are sorted by createdAt descending.
 */
async function listAllAccounts(params: AdminAccountListParams = {}): Promise<PageResponse<AdminAccountResponse>> {
  const response = await apiClient.get<PageResponse<AdminAccountResponse>>(ADMIN_ACCOUNT_BASE, {
    params: {
      page: params.page,
      size: params.size,
      keyword: params.keyword || undefined,
    },
  })
  return response.data
}

/**
 * Khóa/mở khóa (enable/disable) a Tài_Khoản so it can/can't log in.
 * Rejects (via a thrown AxiosError, HTTP 422) when the Quản_Trị_Viên
 * tries to lock their own currently logged-in account.
 */
async function setAccountEnabled(accountId: string, enabled: boolean): Promise<AdminAccountResponse> {
  const response = await apiClient.put<AdminAccountResponse>(`${ADMIN_ACCOUNT_BASE}/${accountId}/enabled`, {
    enabled,
  })
  return response.data
}

export const adminAccountService = {
  listAllAccounts,
  setAccountEnabled,
}

export default adminAccountService
