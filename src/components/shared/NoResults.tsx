import type { CategoryResponse } from '../../services/productService.types'
import NavLink from './NavLink'
import './NoResults.css'

// Shared "no results found" state shown when a search/filter yields an
// empty product list, together with suggested popular Danh_Mục so
// Khách_Hàng can keep browsing (Requirement 2.4).
type NoResultsProps = {
  message?: string
  suggestedCategories: CategoryResponse[]
}

function NoResults({
  message = 'Không tìm thấy sản phẩm nào phù hợp.',
  suggestedCategories,
}: NoResultsProps) {
  return (
    <div className="no-results">
      <p className="no-results-message">{message}</p>

      {suggestedCategories.length > 0 ? (
        <div>
          <p className="no-results-suggestions-heading">Danh mục phổ biến có thể bạn quan tâm:</p>
          <nav className="no-results-suggestions" aria-label="Danh mục phổ biến">
            {suggestedCategories.map((category) => (
              <NavLink key={category.id} to={`/categories/${category.id}`}>
                {category.name}
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  )
}

export default NoResults
