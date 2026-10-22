import { useEffect, useState } from 'react'
import { Footer, Header, NavLink, ProductCard } from '../../components/shared'
import categoryService from '../../services/categoryService'
import { getErrorMessage } from '../../services/apiError'
import productService from '../../services/productService'
import type { CategoryResponse, ProductResponse } from '../../services/productService.types'
import './HomePage.css'

/** Featured products shown on the homepage are the first N active
 * Sản_Phẩm returned by GET /api/products (no dedicated "featured" flag
 * exists on the backend), sorted as returned by the API. */
const FEATURED_PRODUCT_LIMIT = 8

type LoadState = 'loading' | 'success' | 'error'

// Trang chủ (Homepage): shows the Danh_Mục list and a set of featured
// Sản_Phẩm (Requirement 2.1). Category links navigate to the Category
// product listing page (Requirement 2.2, wired in App.tsx). The keyword
// search bar lives on the listing pages next to the FilterPanel
// (Requirement 2.3, 2.6), not on the homepage.
function HomePage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<ProductResponse[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadHomePageData() {
      setLoadState('loading')
      try {
        const [categoriesResult, productsResult] = await Promise.all([
          categoryService.getCategories(),
          productService.listProducts(),
        ])
        if (!isMounted) {
          return
        }
        setCategories(categoriesResult)
        setFeaturedProducts(productsResult.products.slice(0, FEATURED_PRODUCT_LIMIT))
        setLoadState('success')
      } catch (error) {
        if (!isMounted) {
          return
        }
        setErrorMessage(getErrorMessage(error, 'Không thể tải dữ liệu trang chủ. Vui lòng thử lại.'))
        setLoadState('error')
      }
    }

    loadHomePageData()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="home-page">
      <Header />

      <main className="home-page-content">
        {loadState === 'loading' ? <p className="home-page-status">Đang tải...</p> : null}

        {loadState === 'error' ? <p className="home-page-status home-page-status-error">{errorMessage}</p> : null}

        {loadState === 'success' ? (
          <>
            <section className="home-section" aria-labelledby="categories-heading">
              <h2 id="categories-heading">Danh mục</h2>
              {categories.length === 0 ? (
                <p className="home-page-empty">Chưa có danh mục nào.</p>
              ) : (
                <nav className="category-nav">
                  {categories.map((category) => (
                    <NavLink key={category.id} to={`/categories/${category.id}`} className="category-nav-link">
                      {category.name}
                    </NavLink>
                  ))}
                </nav>
              )}
            </section>

            <section className="home-section" aria-labelledby="featured-heading">
              <h2 id="featured-heading">Sản phẩm nổi bật</h2>
              {featuredProducts.length === 0 ? (
                <p className="home-page-empty">Chưa có sản phẩm nào.</p>
              ) : (
                <div className="product-grid">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}

export default HomePage