import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FilterPanel,
  Footer,
  Header,
  NoResults,
  ProductCard,
  ProductGridSkeleton,
  toProductListParams,
} from '../../components/shared'
import type { ProductFilterValues } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import categoryService from '../../services/categoryService'
import productService from '../../services/productService'
import type { CategoryResponse, ProductResponse } from '../../services/productService.types'
import './ProductSearchPage.css'

type LoadState = 'loading' | 'success' | 'error'

const ATTRIBUTE_KEYS = ['size', 'color']

function readFilterValuesFromParams(params: URLSearchParams): ProductFilterValues {
  const attributes: Record<string, string> = {}
  for (const key of ATTRIBUTE_KEYS) {
    const attributeValue = params.get(key)
    if (attributeValue) {
      attributes[key] = attributeValue
    }
  }

  return {
    categoryId: params.get('categoryId') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    attributes,
  }
}

// Trang tìm kiếm Sản_Phẩm (Product search page): the keyword search itself
// is entered via the shared Header's SearchBar (Shopee-style, Requirement
// 2.3), which navigates here with ?keyword=... This page renders the
// FilterPanel for price/Danh_Mục/Biến_Thể attribute filters (Requirement
// 2.6), calling GET /api/products with every condition AND'ed together.
// When the result set is empty, shows a "no results" message with
// suggested popular Danh_Mục (Requirement 2.4). Search/filter state is
// kept in the URL so results are shareable/bookmarkable.
function ProductSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const keyword = searchParams.get('keyword') ?? ''
  const filterValues = useMemo(() => readFilterValuesFromParams(searchParams), [searchParams])

  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [suggestedCategories, setSuggestedCategories] = useState<CategoryResponse[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    categoryService
      .getCategories()
      .then((result) => {
        if (isMounted) {
          setCategories(result)
        }
      })
      .catch(() => {
        // Non-fatal: the category select/suggestions simply stay empty.
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function runSearch() {
      setLoadState('loading')
      try {
        const params = toProductListParams(keyword, filterValues)
        const result = await productService.listProducts(params)
        if (!isMounted) {
          return
        }
        setProducts(result.products)

        if (result.products.length === 0) {
          // The backend only returns suggestions for an empty keyword
          // search (Requirement 2.4); fall back to fetching the known
          // Danh_Mục list so a filter-only empty result still shows
          // suggestions for the Khách_Hàng to keep browsing.
          setSuggestedCategories(result.suggestedCategories.length > 0 ? result.suggestedCategories : categories)
        } else {
          setSuggestedCategories([])
        }

        setLoadState('success')
      } catch (error) {
        if (!isMounted) {
          return
        }
        setErrorMessage(getErrorMessage(error, 'Không thể tải kết quả tìm kiếm. Vui lòng thử lại.'))
        setLoadState('error')
      }
    }

    runSearch()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterValues is derived from searchParams
  }, [keyword, searchParams, categories])

  function updateParams(nextKeyword: string, nextFilters: ProductFilterValues) {
    const params = toProductListParams(nextKeyword, nextFilters)
    const nextSearchParams: Record<string, string> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        nextSearchParams[key] = String(value)
      }
    }
    setSearchParams(nextSearchParams)
  }

  function handleFilterChange(nextFilters: ProductFilterValues) {
    updateParams(keyword, nextFilters)
  }

  return (
    <div className="product-search-page">
      <Header />

      <main className="product-search-content">
        <aside className="product-search-sidebar">
          <FilterPanel categories={categories} value={filterValues} onChange={handleFilterChange} />
        </aside>

        <section className="product-search-results">
          <h2 className="product-search-heading">
            {keyword ? `Kết quả tìm kiếm cho "${keyword}"` : 'Tất cả sản phẩm'}
          </h2>

          {loadState === 'loading' ? <ProductGridSkeleton /> : null}

          {loadState === 'error' ? (
            <p className="product-search-status product-search-status-error">{errorMessage}</p>
          ) : null}

          {loadState === 'success' && products.length === 0 ? (
            <NoResults suggestedCategories={suggestedCategories} />
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

export default ProductSearchPage