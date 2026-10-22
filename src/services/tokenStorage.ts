// Controlled access point for persisting the JWT access token across page
// reloads. The access token itself lives in memory (see accountStore.ts);
// this module is the ONLY place allowed to read/write the token's
// localStorage mirror, so direct `localStorage` calls don't get scattered
// across the codebase. Requirements: 6.1, 6.2, 6.3, 6.4
const AUTH_TOKEN_KEY = 'authToken'

export function readStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    // localStorage can throw in restricted environments (e.g. private
    // browsing in some browsers) — treat as "no stored session".
    return null
  }
}

export function writeStoredToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // Ignore write failures; the in-memory token still works for the
    // current session, it just won't survive a reload.
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // Ignore — nothing to clean up if storage is unavailable.
  }
}
