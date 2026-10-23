import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './apiClient'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

describe('apiClient', () => {
  it('is configured with a base URL', () => {
    expect(apiClient.defaults.baseURL).toBeTruthy()
  })

  it('sends JSON content type by default', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  it.each([
    ['http://localhost:8080/api', '/uploads/bank-qr.png', 'http://localhost:8080/uploads/bank-qr.png'],
    ['https://api.example.com/api', 'uploads/bank-qr.png', 'https://api.example.com/uploads/bank-qr.png'],
    ['/api', '/uploads/bank-qr.png', '/uploads/bank-qr.png'],
    ['/shop/api/', '/uploads/bank-qr.png', '/shop/uploads/bank-qr.png'],
    ['https://api.example.com/api', 'https://cdn.example.com/qr.png', 'https://cdn.example.com/qr.png'],
  ])('resolves uploaded images using backend %s', async (baseUrl, path, expected) => {
    vi.stubEnv('VITE_API_BASE_URL', baseUrl)
    const { resolveUploadUrl } = await import('./apiClient')
    expect(resolveUploadUrl(path)).toBe(expected)
  })
})
