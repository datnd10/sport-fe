import { describe, expect, it } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  it('is configured with a base URL', () => {
    expect(apiClient.defaults.baseURL).toBeTruthy()
  })

  it('sends JSON content type by default', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
