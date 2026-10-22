import axios from 'axios'
import type { ApiErrorResponse, FieldError } from './authService.types'

// Shared helper for turning a failed API call into the backend's
// fieldErrors structure (see ErrorResponse.java) so forms can show
// field-level validation messages. Requirements: 6.1, 6.2
export function getFieldErrors(error: unknown): FieldError[] {
  if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.data?.fieldErrors) {
    return error.response.data.fieldErrors
  }
  return []
}

/** Extracts a human-readable message from a failed API call, falling back
 * to a generic message when the backend didn't return one. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return fallback
}
