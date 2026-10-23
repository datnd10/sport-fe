import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the storefront home page at the root route', async () => {
    await act(async () => { render(<App />) })
    expect(screen.getByRole('heading', { name: 'LananhSport' })).toBeInTheDocument()
  })
})
