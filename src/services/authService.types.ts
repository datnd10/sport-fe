// Request/response shapes mirroring the backend auth DTOs
// (com.example.sport_be.dto.auth.*, com.example.sport_be.dto.account.*).
// Requirements: 6.1, 6.2, 6.3, 6.4

export type Role = 'CUSTOMER' | 'ADMIN'

export interface AccountResponse {
  id: string
  email: string
  fullName: string
  phone: string | null
  address: string | null
  role: Role
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phone?: string
  address?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  account: AccountResponse
}

export interface FieldError {
  field: string
  message: string
}

// Standard error body returned by the backend (see ErrorResponse.java).
export interface ApiErrorResponse {
  timestamp: string
  status: number
  errorCode: string
  message: string
  fieldErrors: FieldError[]
}
