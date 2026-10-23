import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import ProfilePage from './ProfilePage'
import { useAccountStore } from '../../store/accountStore'
vi.mock('../../components/shared', async (original) => ({ ...await original<typeof import('../../components/shared')>(), Header: () => null, Footer: () => null }))
const profile = { id: 'customer', fullName: 'Minh Anh', email: 'demo@example.com', phone: '0900000000', address: 'Địa chỉ demo', role: 'CUSTOMER' as const }
const update = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  useAccountStore.setState({ account: profile, updateProfile: update })
  update.mockImplementation(async (values) => ({ ...profile, ...values }))
})
it('populates the form, resets drafts and saves trimmed changes', async () => {
  render(<MemoryRouter><ProfilePage /></MemoryRouter>)
  const name = await screen.findByLabelText(/Họ và tên/)
  expect(name).toHaveValue('Minh Anh')
  expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
  expect(screen.getByLabelText('Email đăng nhập')).toHaveAttribute('readonly')
  fireEvent.change(name, { target: { value: 'Changed' } })
  fireEvent.click(screen.getByRole('button', { name: 'Hủy thay đổi' }))
  expect(name).toHaveValue('Minh Anh')
  fireEvent.change(name, { target: { value: '  Ngọc Anh  ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(update).toHaveBeenCalledWith({ fullName: 'Ngọc Anh', phone: '0900000000', address: 'Địa chỉ demo' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu thông tin')
  expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
})
it('retains unsaved input when saving fails', async () => {
  update.mockRejectedValue(new Error('Failed'))
  render(<MemoryRouter><ProfilePage /></MemoryRouter>)
  const name = await screen.findByLabelText(/Họ và tên/)
  fireEvent.change(name, { target: { value: 'Ngọc Anh' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await screen.findByRole('alert')
  expect(name).toHaveValue('Ngọc Anh')
  expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeEnabled()
})
