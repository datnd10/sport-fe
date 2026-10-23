import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import ReviewComposer from './ReviewComposer'
import ReviewImages from './ReviewImages'
import reviewService from '../../services/reviewService'
import { useAccountStore } from '../../store/accountStore'
vi.mock('../../services/reviewService', () => ({ default: { getEligibility: vi.fn(), submitReview: vi.fn() } }))
beforeEach(() => {
  vi.clearAllMocks()
  useAccountStore.setState({ account: { id: 'customer', email: 'a@test.com', fullName: 'Demo', role: 'CUSTOMER', phone: null, address: null } })
  vi.mocked(reviewService.getEligibility).mockResolvedValue([{ orderItemId: 'item', orderCode: 'ORDER', attributes: 'size=40' }])
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() }))
})
it('previews/removes photos and sends the selected files with an eligible purchase', async () => {
  const submitted = vi.fn()
  vi.mocked(reviewService.submitReview).mockResolvedValue({ id: 'review', rating: 5 } as never)
  render(<MemoryRouter><ReviewComposer productId="product" onSubmitted={submitted} /></MemoryRouter>)
  await screen.findByText('Chia sẻ trải nghiệm của bạn')
  const file = new File(['image'], 'photo.png', { type: 'image/png' })
  fireEvent.change(screen.getByLabelText(/Ảnh đính kèm/), { target: { files: [file] } })
  expect(screen.getByAltText('Ảnh đã chọn 1')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Bỏ ảnh 1' }))
  expect(screen.queryByAltText('Ảnh đã chọn 1')).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText(/Ảnh đính kèm/), { target: { files: [file] } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }))
  await waitFor(() => expect(reviewService.submitReview).toHaveBeenCalledWith('product', { orderItemId: 'item', rating: 5, comment: '' }, [file]))
  expect(await screen.findByText('Đã gửi đánh giá của bạn.')).toBeInTheDocument()
})
it('rejects invalid file types without submitting', async () => {
  render(<MemoryRouter><ReviewComposer productId="product" onSubmitted={vi.fn()} /></MemoryRouter>)
  await screen.findByText('Chia sẻ trải nghiệm của bạn')
  fireEvent.change(screen.getByLabelText(/Ảnh đính kèm/), { target: { files: [new File(['text'], 'file.txt', { type: 'text/plain' })] } })
  expect(screen.getByRole('alert')).toHaveTextContent('JPG, PNG hoặc WebP')
  expect(reviewService.submitReview).not.toHaveBeenCalled()
})
it('shows no review form for a customer without eligible delivered purchases', async () => {
  vi.mocked(reviewService.getEligibility).mockResolvedValue([])
  render(<MemoryRouter><ReviewComposer productId="product" onSubmitted={vi.fn()} /></MemoryRouter>)
  await screen.findByText(/Bạn có thể đánh giá sau khi đơn hàng đã giao/)
  expect(screen.queryByRole('button', { name: 'Gửi đánh giá' })).not.toBeInTheDocument()
})
it('opens photos in a dialog and navigates between them', () => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')) }
  render(<ReviewImages images={[{ id: '1', filePath: 'uploads/1.png', displayOrder: 0 }, { id: '2', filePath: 'uploads/2.png', displayOrder: 1 }]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Xem ảnh đánh giá 1' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ảnh đánh giá tiếp theo' }))
  expect(screen.getByText('2 / 2')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Đóng ảnh' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('reviews exactly the purchase selected from an order, even when another purchase comes first', async () => {
  vi.mocked(reviewService.getEligibility).mockResolvedValue([
    { orderItemId: 'older', orderCode: 'OLD', attributes: 'size=40' },
    { orderItemId: 'selected', orderCode: 'SELECTED', attributes: 'size=41' },
  ])
  vi.mocked(reviewService.submitReview).mockResolvedValue({ id: 'review', rating: 5 } as never)
  render(<MemoryRouter><ReviewComposer productId="product" requestedOrderItemId="selected" onSubmitted={vi.fn()} /></MemoryRouter>)
  await screen.findByText('Chia sẻ trải nghiệm của bạn')
  expect(screen.getByLabelText('Lần mua')).toHaveValue('selected')
  expect(screen.queryByRole('option', { name: /#OLD/ })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }))
  await waitFor(() => expect(reviewService.submitReview).toHaveBeenCalledWith('product', { orderItemId: 'selected', rating: 5, comment: '' }, []))
})

it('does not silently switch to another order when the requested purchase is already reviewed or ineligible', async () => {
  render(<MemoryRouter><ReviewComposer productId="product" requestedOrderItemId="already-reviewed" onSubmitted={vi.fn()} /></MemoryRouter>)
  await screen.findByText(/Sản phẩm trong lần mua này đã được đánh giá hoặc chưa đủ điều kiện/)
  expect(screen.queryByRole('button', { name: 'Gửi đánh giá' })).not.toBeInTheDocument()
  expect(reviewService.submitReview).not.toHaveBeenCalled()
})
