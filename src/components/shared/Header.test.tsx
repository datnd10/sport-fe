import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it } from 'vitest'
import Header from './Header'
import { useAccountStore } from '../../store/accountStore'
beforeEach(() => useAccountStore.setState({ isAuthenticated: true, account: { id: 'a', fullName: 'Minh Anh', email: 'a@example.com', role: 'CUSTOMER', phone: null, address: null } }))
it('puts account links in a dropdown and closes with Escape or outside click', () => {
  render(<MemoryRouter><Header /></MemoryRouter>)
  const trigger = screen.getByText('Minh Anh')
  const details = trigger.closest('details')!
  expect(details.open).toBe(false)
  expect(screen.getByText('Giỏ hàng')).not.toBeVisible()
  fireEvent.click(trigger)
  expect(details.open).toBe(true)
  expect(screen.getByRole('link', { name: 'Giỏ hàng' })).toHaveAttribute('href', '/cart')
  expect(screen.getByRole('link', { name: 'Chỉnh sửa thông tin' })).toHaveAttribute('href', '/account/profile')
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(details.open).toBe(false)
  fireEvent.click(trigger)
  fireEvent.pointerDown(document.body)
  expect(details.open).toBe(false)
})
