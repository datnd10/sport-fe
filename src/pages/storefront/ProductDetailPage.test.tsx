import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductDetailPage from './ProductDetailPage'
import productService from '../../services/productService'
import reviewService from '../../services/reviewService'
import { useCartStore } from '../../store/cartStore'
import { useAccountStore } from '../../store/accountStore'
import type { ProductDetailResponse } from '../../services/productService.types'
vi.mock('../../services/productService', () => ({ default: { getProductDetail: vi.fn() } }))
vi.mock('../../services/reviewService', () => ({ default: { getReviewsByProduct: vi.fn() } }))
vi.mock('../../components/shared', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../components/shared')>(), Header: () => null, Footer: () => null,
}))
const addItem = vi.fn()
const product: ProductDetailResponse = {
  id: 'demo', name: 'Demo shoe', category: { id: 'shoes', name: 'Giày', slug: 'giay' },
  basePrice: 20000, description: 'Mô tả sản phẩm', active: true, images: [],
  variants: [
    { id: 'sold-out', sku: 'OUT', attributes: 'size=38;color=Trắng', price: 20000, stockQuantity: 0, lowStockThreshold: 5 },
    { id: 'available', sku: 'IN', attributes: 'size=39;color=Đen', price: 21000, stockQuantity: 3, lowStockThreshold: 5 },
    { id: 'other', sku: 'OTHER', attributes: 'size=40;color=Trắng', price: 22000, stockQuantity: 10, lowStockThreshold: 5 },
  ],
}
function showProduct() {
  render(<MemoryRouter initialEntries={['/products/demo']}><Routes><Route path="/products/:productId" element={<ProductDetailPage />} /><Route path="/login" element={<p>Login required</p>} /></Routes></MemoryRouter>)
}
describe('Product detail purchase and reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccountStore.setState({ isAuthenticated: true })
    useCartStore.setState({ addItem, message: null })
    addItem.mockResolvedValue(undefined)
    vi.mocked(productService.getProductDetail).mockResolvedValue(product)
    vi.mocked(reviewService.getReviewsByProduct).mockResolvedValue({ totalCount: 2, averageRating: 4.5, reviews: [
      { id: 'r1', productId: 'demo', productName: 'Demo shoe', accountId: 'a1', reviewerName: 'Minh', rating: 5, comment: 'Nhận xét năm sao', hidden: false, createdAt: '2026-10-01T00:00:00Z' },
      { id: 'r2', productId: 'demo', productName: 'Demo shoe', accountId: 'a2', reviewerName: 'Hà', rating: 4, comment: 'Nhận xét bốn sao', hidden: false, createdAt: '2026-10-02T00:00:00Z' },
    ] })
  })
  it('selects an available variant, bounds quantity and submits selected quantity', async () => {
    showProduct()
    await screen.findByRole('heading', { name: 'Demo shoe' })
    expect(screen.getByRole('button', { name: /Size: 38/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Size: 39/ })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.change(screen.getByLabelText('Số lượng'), { target: { value: '99' } })
    expect(screen.getByLabelText('Số lượng')).toHaveValue(3)
    expect(screen.getByRole('button', { name: 'Tăng số lượng' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }))
    await waitFor(() => expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ variantId: 'available', quantity: 3, unitPrice: 21000 })))
    fireEvent.click(screen.getByRole('button', { name: /Size: 40/ }))
    expect(screen.getByLabelText('Số lượng')).toHaveValue(1)
  })
  it('redirects guests to login without adding anything to the cart', async () => {
    useAccountStore.setState({ isAuthenticated: false })
    showProduct()
    await screen.findByRole('heading', { name: 'Demo shoe' })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }))
    expect(await screen.findByText('Login required')).toBeInTheDocument()
    expect(addItem).not.toHaveBeenCalled()
  })
  it('filters visible reviews locally without requesting the API again', async () => {
    showProduct()
    await screen.findByText('Nhận xét năm sao')
    fireEvent.click(screen.getByRole('button', { name: '4 sao (1)' }))
    expect(screen.queryByText('Nhận xét năm sao')).not.toBeInTheDocument()
    expect(screen.getByText('Nhận xét bốn sao')).toBeInTheDocument()
    expect(reviewService.getReviewsByProduct).toHaveBeenCalledTimes(1)
  })
  it('reports cart failure without a success message', async () => {
    addItem.mockImplementation(async () => { useCartStore.setState({ message: 'Không đủ tồn kho' }) })
    showProduct()
    await screen.findByRole('heading', { name: 'Demo shoe' })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không đủ tồn kho')
    expect(screen.queryByText('Đã thêm sản phẩm vào giỏ hàng.')).not.toBeInTheDocument()
  })
  it('moves through gallery images in both directions and wraps around', async () => {
    vi.mocked(productService.getProductDetail).mockResolvedValue({ ...product, images: [
      { id: 'img1', filePath: 'uploads/first.jpg', displayOrder: 0 },
      { id: 'img2', filePath: 'uploads/second.jpg', displayOrder: 1 },
      { id: 'img3', filePath: 'uploads/third.jpg', displayOrder: 2 },
    ] })
    showProduct()
    await screen.findByRole('heading', { name: 'Demo shoe' })
    expect(screen.getByRole('img', { name: 'Demo shoe' })).toHaveAttribute('src', expect.stringContaining('first.jpg'))
    fireEvent.click(screen.getByRole('button', { name: 'Ảnh trước' }))
    expect(screen.getByRole('img', { name: 'Demo shoe' })).toHaveAttribute('src', expect.stringContaining('third.jpg'))
    fireEvent.click(screen.getByRole('button', { name: 'Ảnh tiếp theo' }))
    expect(screen.getByRole('img', { name: 'Demo shoe' })).toHaveAttribute('src', expect.stringContaining('first.jpg'))
    fireEvent.click(screen.getByRole('button', { name: 'Ảnh tiếp theo' }))
    expect(screen.getByRole('img', { name: 'Demo shoe' })).toHaveAttribute('src', expect.stringContaining('second.jpg'))
  })

})
