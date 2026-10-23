import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import ChangePasswordForm from './ChangePasswordForm'
import accountService from '../../services/accountService'
vi.mock('../../services/accountService', () => ({ default: { changePassword: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); vi.mocked(accountService.changePassword).mockResolvedValue(undefined) })
function fill(confirm = 'New@456') {
  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: 'Current@123' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'New@456' } })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), { target: { value: confirm } })
}
it('rejects a confirmation mismatch before calling the API', () => {
  render(<ChangePasswordForm />)
  fill('Different@456')
  fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))
  expect(screen.getByText('Xác nhận mật khẩu mới không khớp.')).toBeInTheDocument()
  expect(accountService.changePassword).not.toHaveBeenCalled()
})
it('submits the password unchanged and clears sensitive fields on success', async () => {
  render(<ChangePasswordForm />)
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu mới' }))
  expect(screen.getByLabelText('Mật khẩu mới')).toHaveAttribute('type', 'text')
  fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))
  await screen.findByRole('status')
  expect(accountService.changePassword).toHaveBeenCalledWith({ currentPassword: 'Current@123', newPassword: 'New@456', confirmPassword: 'New@456' })
  expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveValue('')
  expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('')
  expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toHaveValue('')
  expect(screen.getByLabelText('Mật khẩu mới')).toHaveAttribute('type', 'password')
})
it('shows API failures without claiming success', async () => {
  vi.mocked(accountService.changePassword).mockRejectedValue(new Error('Failed'))
  render(<ChangePasswordForm />)
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))
  await screen.findByRole('alert')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Đổi mật khẩu' })).toBeEnabled()
})
