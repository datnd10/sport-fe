import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage'
import productService from '../../services/productService'
import categoryService from '../../services/categoryService'
vi.mock('../../services/productService', () => ({ default: { listProducts: vi.fn() } }))
vi.mock('../../services/categoryService', () => ({ default: { getCategories: vi.fn() } }))
vi.mock('../../components/shared', () => ({
  Header: ({ showSearch }: { showSearch: boolean }) => <header>{showSearch ? 'Header search' : 'Shop'}</header>,
  Footer: () => null, Slideshow: () => null, ProductGridSkeleton: () => <p>Loading</p>,
  ProductCard: ({ product }: { product: { name: string } }) => <p>{product.name}</p>,
}))
describe('Homepage catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(productService.listProducts).mockResolvedValue({ products: [], suggestedCategories: [] })
    vi.mocked(categoryService.getCategories).mockResolvedValue([{ id: 'shoes', name: 'Giày', slug: 'giay' }])
  })
  it('combines sidebar filters and preserves them when sorting, then resets', async () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    await screen.findByRole('option', { name: 'Giày' })
    fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'Nike' } })
    fireEvent.change(screen.getByLabelText('Từ'), { target: { value: '100000' } })
    fireEvent.change(screen.getByLabelText('Đến'), { target: { value: '900000' } })
    fireEvent.change(screen.getByLabelText('Danh mục'), { target: { value: 'shoes' } })
    fireEvent.change(screen.getByLabelText('Đánh giá'), { target: { value: '4' } })
    expect(productService.listProducts).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }))
    await waitFor(() => expect(productService.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'Nike', categoryId: 'shoes', minPrice: 100000, maxPrice: 900000, minRating: 4 })))
    fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'Adidas' } })
    fireEvent.change(screen.getByLabelText('Sắp xếp'), { target: { value: 'rating_desc' } })
    await waitFor(() => expect(productService.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'Nike', categoryId: 'shoes', minRating: 4, sort: 'rating_desc' })))
    expect(screen.getByLabelText('Tên sản phẩm')).toHaveValue('Adidas')
    const callsBeforeReset = vi.mocked(productService.listProducts).mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
    expect(screen.getByLabelText('Tên sản phẩm')).toHaveValue('')
    expect(productService.listProducts).toHaveBeenCalledTimes(callsBeforeReset)
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }))
    await waitFor(() => expect(productService.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: undefined, categoryId: undefined, minRating: undefined, sort: 'rating_desc' })))
  })
  it('restores filters from the URL and shows empty results', async () => {
    render(<MemoryRouter initialEntries={['/?keyword=vot&minRating=4&sort=price_asc']}><HomePage /></MemoryRouter>)
    expect(screen.getByLabelText('Tên sản phẩm')).toHaveValue('vot')
    await screen.findByText(/Không có sản phẩm phù hợp/)
    expect(screen.getByRole('button', { name: 'Trang 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled()
    expect(productService.listProducts).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'vot', minRating: 4, sort: 'price_asc' }))
  })
  it('changes pages using applied filters and preserves draft input, then resets page on search and sort', async () => {
    vi.mocked(productService.listProducts).mockResolvedValue({
      products: [{ id: 'one', name: 'Product one' } as never], suggestedCategories: [],
      totalElements: 25, totalPages: 3, page: 1, size: 12,
    })
    render(<MemoryRouter initialEntries={['/?keyword=Nike&page=2']}><HomePage /></MemoryRouter>)
    await screen.findByText('Product one')
    expect(productService.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'Nike', page: 1, size: 12 }))
    fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'Adidas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Trang 3' }))
    await waitFor(() => expect(productService.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'Nike', page: 2 })))
    expect(screen.getByLabelText('Tên sản phẩm')).toHaveValue('Adidas')
    await screen.findByText('Product one')
    fireEvent.change(screen.getByLabelText('Sắp xếp'), { target: { value: 'price_asc' } })
    await waitFor(() => expect(productService.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'Nike', page: 0, sort: 'price_asc' })))
    expect(screen.getByLabelText('Tên sản phẩm')).toHaveValue('Adidas')
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }))
    await waitFor(() => expect(productService.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'Adidas', page: 0, size: 12 })))
  })

})
