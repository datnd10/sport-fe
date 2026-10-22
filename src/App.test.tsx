import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the storefront home page at the root route', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'LananhSport' })).toBeInTheDocument()
  })
})
