import type { Role } from './authService.types'

// Request/response shapes mirroring the backend Admin Tài_Khoản (Account)
// management DTOs (com.example.sport_be.dto.account.AdminAccountResponse)
// used by the Admin Tài_Khoản management page.
// Requirements: see lananhsport spec — Admin Quản_Lý_Tài_Khoản module.

/**
 * A single Tài_Khoản row as returned by the Admin accounts list/toggle
 * endpoints. Mirrors com.example.sport_be.dto.account.AdminAccountResponse.
 */
export interface AdminAccountResponse {
  id: string
  email: string
  fullName: string
  phone: string | null
  address: string | null
  role: Role
  enabled: boolean
  createdAt: string
}

/**
 * Query parameters accepted by GET /api/admin/accounts. `page` is
 * 0-based; all fields are optional on the caller side since the backend
 * applies its own defaults (page=0, size=20, sort=createdAt desc).
 * `keyword` matches against email OR fullName (case-insensitive contains).
 */
export interface AdminAccountListParams {
  page?: number
  size?: number
  keyword?: string
}

/** Payload for PUT /api/admin/accounts/{id}/enabled. */
export interface SetAccountEnabledRequest {
  enabled: boolean
}
