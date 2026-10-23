import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Footer, Header, ProductCard, ProductGridSkeleton, Slideshow } from '../../components/shared'
import Pagination from '../../components/shared/Pagination'
import categoryService from '../../services/categoryService'
import { getErrorMessage } from '../../services/apiError'
import productService from '../../services/productService'
import type { CategoryResponse, ProductResponse } from '../../services/productService.types'
import './HomePage.css'

function HomePage() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [pagination, setPagination] = useState({ totalElements: 0, totalPages: 0, page: 0 })
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const filterParams = new URLSearchParams(params)
  filterParams.delete('sort')
  filterParams.delete('page')
  const filterKey = filterParams.toString()
  const query = params.toString()
  const requestKey = `${query}:${retry}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    let active = true
    categoryService.getCategories().then((result) => {
      if (active) { setCategories(result); setCategoryError(null) }
    }).catch(() => { if (active) setCategoryError('Không thể tải danh mục.') })
    return () => { active = false }
  }, [retry])

  useEffect(() => {
    let active = true
    const filters = new URLSearchParams(query)
    productService.listProducts({
      keyword: filters.get('keyword') || undefined,
      categoryId: filters.get('categoryId') || undefined,
      minPrice: filters.has('minPrice') ? Number(filters.get('minPrice')) : undefined,
      maxPrice: filters.has('maxPrice') ? Number(filters.get('maxPrice')) : undefined,
      minRating: filters.has('minRating') ? Number(filters.get('minRating')) : undefined,
      sort: filters.get('sort') || 'newest',
      page: Math.max(0, (Number(filters.get('page')) || 1) - 1),
      size: 12,
    }).then((result) => {
      if (active) {
        setProducts(result.products)
        setPagination({ totalElements: result.totalElements ?? result.products.length, totalPages: result.totalPages ?? 1, page: result.page ?? 0 })
        setError(null)
      }
    }).catch((reason) => {
      if (active) setError(getErrorMessage(reason, 'Không thể tải sản phẩm. Vui lòng thử lại.'))
    }).finally(() => { if (active) setLoadedKey(requestKey) })
    return () => { active = false }
  }, [query, retry, requestKey])

  function applyFilters(form: HTMLFormElement) {
    const data = new FormData(form)
    const min = String(data.get('minPrice') ?? '')
    const max = String(data.get('maxPrice') ?? '')
    const maxInput = form.elements.namedItem('maxPrice') as HTMLInputElement
    maxInput.setCustomValidity(min && max && Number(min) > Number(max) ? 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.' : '')
    if (!form.reportValidity()) return
    const next = new URLSearchParams()
    for (const [key, value] of data.entries()) {
      if (String(value).trim() && !(key === 'sort' && value === 'newest')) next.set(key, String(value).trim())
    }
    setParams(next)
  }

  return (
    <div className="home-page">
      <Header showSearch={false} />
      <main className="home-page-content">
        <Slideshow />
        <div className="home-catalog">
          <aside className="home-filters" aria-labelledby="home-filter-heading">
            <div className="home-filter-title">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <h2 id="home-filter-heading">Tìm kiếm & bộ lọc</h2>
            </div>
            <p className="home-filter-description">Tìm món đồ phù hợp với bạn.</p>
            <form key={filterKey} onSubmit={(event) => { event.preventDefault(); applyFilters(event.currentTarget) }}>
              <div className="home-filter-group">
                <label htmlFor="home-keyword">Tên sản phẩm</label>
                <input id="home-keyword" name="keyword" type="search" placeholder="Tìm kiếm sản phẩm..." defaultValue={params.get('keyword') ?? ''} />
              </div>
              <div className="home-filter-group">
                <label htmlFor="home-category">Danh mục</label>
                <select id="home-category" name="categoryId" defaultValue={params.get('categoryId') ?? ''}>
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                {categoryError ? <p role="alert">{categoryError}</p> : null}
              </div>
              <fieldset className="home-filter-group home-price-filter">
                <legend>Khoảng giá (đ)</legend>
                <div className="home-price-range">
                <div>
                <label htmlFor="home-min-price">Từ</label>
                <input id="home-min-price" name="minPrice" type="number" min="0" step="1" placeholder="0" defaultValue={params.get('minPrice') ?? ''} onInput={(event) => { const max = event.currentTarget.form?.elements.namedItem('maxPrice') as HTMLInputElement; max?.setCustomValidity('') }} />
                </div>
                <div>
                <label htmlFor="home-max-price">Đến</label>
                <input id="home-max-price" name="maxPrice" type="number" min="0" step="1" placeholder="Tối đa" defaultValue={params.get('maxPrice') ?? ''} onInput={(event) => event.currentTarget.setCustomValidity('')} />
                </div>
                </div>
              </fieldset>
              <div className="home-filter-group">
                <label htmlFor="home-rating">Đánh giá</label>
                <select id="home-rating" name="minRating" defaultValue={params.get('minRating') ?? ''}>
                  <option value="">Tất cả đánh giá</option>
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao trở lên</option>)}
                </select>
              </div>
              <input type="hidden" name="sort" value={params.get('sort') ?? 'newest'} />
              <button className="home-apply" type="submit">Tìm kiếm</button>
              <button className="home-reset" type="button" onClick={(event) => {
                const form = event.currentTarget.form!
                for (const control of Array.from(form.elements)) {
                  if ((control instanceof HTMLInputElement || control instanceof HTMLSelectElement) && control.name !== 'sort') {
                    control.value = ''
                    control.setCustomValidity('')
                  }
                }
              }}>Xóa bộ lọc</button>
            </form>
          </aside>
          <section className="home-results" aria-labelledby="products-heading" aria-busy={loading}>
            <div className="home-results-toolbar">
              <div>
                <span className="home-section-eyebrow">LANANHSPORT</span>
                <h2 id="products-heading">Tất cả sản phẩm</h2>
                {!loading && !error ? <p role="status">{pagination.totalElements === 0 ? '0 sản phẩm' : `${pagination.page * 12 + 1}–${pagination.page * 12 + products.length} / ${pagination.totalElements} sản phẩm`}</p> : null}
              </div>
              <label className="home-sort">Sắp xếp
                <select value={params.get('sort') ?? 'newest'} onChange={(event) => {
                  const next = new URLSearchParams(params)
                  next.delete('page')
                  if (event.target.value === 'newest') next.delete('sort')
                  else next.set('sort', event.target.value)
                  setParams(next)
                }}>
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá: thấp đến cao</option>
                  <option value="price_desc">Giá: cao đến thấp</option>
                  <option value="rating_desc">Đánh giá cao nhất</option>
                </select>
              </label>
            </div>
            {loading ? <ProductGridSkeleton count={6} /> : error ? (
              <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Thử lại</button></div>
            ) : products.length === 0 ? (
              <p className="home-page-empty">Không có sản phẩm phù hợp. Hãy thử thay đổi hoặc xóa bộ lọc.</p>
            ) : <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
            {!loading && !error ? (
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(page) => {
                const next = new URLSearchParams(params)
                if (page === 0) next.delete('page')
                else next.set('page', String(page + 1))
                setParams(next)
              }} />
            ) : null}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default HomePage
