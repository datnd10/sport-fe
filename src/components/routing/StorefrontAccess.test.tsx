import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, expect, it } from 'vitest'
import StorefrontAccess from './StorefrontAccess'
import { useAccountStore } from '../../store/accountStore'

function Login() {
  const { state } = useLocation()
  return <p>Login:{state?.from?.pathname}{state?.from?.search}</p>
}
function show(path: string, ready = true) {
  render(<MemoryRouter initialEntries={[path]}><StorefrontAccess sessionReady={ready}><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="*" element={<p>Page content</p>} />
  </Routes></StorefrontAccess></MemoryRouter>)
}
beforeEach(() => useAccountStore.setState({ isAuthenticated: false, isRestoring: false }))
it.each(['/', '/products/demo', '/register'])('keeps %s publicly accessible', (path) => {
  show(path)
  expect(screen.getByText('Page content')).toBeInTheDocument()
})
it.each(['/cart', '/checkout', '/search?keyword=shoe', '/categories/shoes', '/orders/confirmation/demo', '/account/profile', '/admin', '/unknown'])('requires login for %s and remembers the URL', (path) => {
  show(path)
  expect(screen.getByText(`Login:${path}`)).toBeInTheDocument()
  expect(screen.queryByText('Page content')).not.toBeInTheDocument()
})
it('waits for session restoration before redirecting', () => {
  show('/cart', false)
  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(screen.queryByText('Login:/cart')).not.toBeInTheDocument()
})
it('allows authenticated visitors into protected routes', () => {
  useAccountStore.setState({ isAuthenticated: true })
  show('/cart')
  expect(screen.getByText('Page content')).toBeInTheDocument()
})
