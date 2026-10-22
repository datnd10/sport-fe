import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FilterPanel,
  Footer,
  Header,
  NoResults,
  ProductCard,
  SearchBar,
  createEmptyFilterValues,
  toProductListParams,
} from '../../components/shared'
import type { ProductFilterValues } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import categoryService from '../../services/categoryService'
import productService from '../../services/productService'
import type { CategoryResponse, ProductResponse } from '../../services/productService.types'
import './CategoryProductsPage.css'

type LoadState = 'loading' | 'success' | 'error'

// Trang danh sách Sản_Phẩm theo Danh_Mục (Category product listing page).
// Reads categoryId from the route param and fetches matching Sản_Phẩm via
// GET /api/products?categoryId=... (Requirement 2.2), additionally letting
// Khách_Hàng narrow the category's products further with a price/Biến_Thể
// attribute FilterPanel (Requirement 2.6) and showing a "no results" state
// with suggested popular Danh_Mục when the combined filters match nothing
// (Requirement 2.4). The keyword SearchBar sits next to the FilterPanel in
// the sidebar so Khách_Hàng can jump to the full cross-category search page
// (Requirement 2.3).
function CategoryProductsPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()

  const [products, setProducts] = useState<ProductResponse[]>([])
  const [allCategories, setAllCategories] = useState<CategoryResponse[]>([])
  const [filterValues, setFilterValues] = useState<ProductFilterValues>(createEmptyFilterValues())
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    categoryService
      .getCategories()
      .then((result) => {
        if (isMounted) {
          setAllCategories(result)
        }
      })
      .catch(() => {
        // Non-fatal: suggestions on an empty result simply stay empty.
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!categoryId) {
      return
    }

    let isMounted = true

    async function loadCategoryProducts() {
      setLoadState('loading')
      try {
        const params = toProductListParams('', filterValues)
        const result = await productService.listProducts({ ...params, categoryId })
        if (!isMounted) {
          return
        }
        setProducts(result.products)
        setLoadState('success')
      } catch (error) {
        if (!isMounted) {
          return
        }
        setErrorMessage(getErrorMessage(error, 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.'))
        setLoadState('error')
      }
    }

    loadCategoryProducts()

    return () => {
      isMounted = false
    }
  }, [categoryId, filterValues])

  function handleSearch(keyword: string) {
    navigate(keyword ? `/search?keyword=${encodeURIComponent(keyword)}` : '/search')
  }

  return (
    <div className="category-products-page">
      <Header />

      <main className="category-products-content">
        <aside className="category-products-sidebar">
          <SearchBar onSearch={handleSearch} />
          <FilterPanel
            categories={allCategories}
            value={filterValues}
            onChange={setFilterValues}
            showCategoryFilter={false}
          />
        </aside>

        <section className="category-products-results">
          {loadState === 'loading' ? <p className="category-products-status">Đang tải...</p> : null}

          {loadState === 'error' ? (
            <p className="category-products-status category-products-status-error">{errorMessage}</p>
          ) : null}

          {loadState === 'success' && products.length === 0 ? (
            <NoResults
              message="Không có sản phẩm nào trong danh mục này."
              suggestedCategories={allCategories.filter((category) => category.id !== categoryId)}
            />
          ) : null}

          {loadState === 'success' && products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default CategoryProductsPage