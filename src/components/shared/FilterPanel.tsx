import type { CategoryResponse } from '../../services/productService.types'
import Button from './Button'
import type { ProductFilterValues } from './FilterPanel.types'
import { createEmptyFilterValues } from './FilterPanel.types'
import './FilterPanel.css'

// Shared filter panel for browsing/searching Sản_Phẩm: price range,
// Danh_Mục, and Biến_Thể_Sản_Phẩm attribute filters (size/color), combined
// together (AND'ed) when the caller passes them to
// productService.listProducts (Requirement 2.6).
const ATTRIBUTE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'size', label: 'Kích thước' },
  { key: 'color', label: 'Màu sắc' },
]

type FilterPanelProps = {
  categories: CategoryResponse[]
  value: ProductFilterValues
  onChange: (value: ProductFilterValues) => void
  /** Hidden when the page already scopes browsing to one Danh_Mục. */
  showCategoryFilter?: boolean
}

function FilterPanel({ categories, value, onChange, showCategoryFilter = true }: FilterPanelProps) {
  function updateAttribute(key: string, attributeValue: string) {
    const nextAttributes = { ...value.attributes }
    if (attributeValue.trim() === '') {
      delete nextAttributes[key]
    } else {
      nextAttributes[key] = attributeValue
    }
    onChange({ ...value, attributes: nextAttributes })
  }

  function handleReset() {
    onChange(createEmptyFilterValues())
  }

  return (
    <div className="filter-panel" aria-label="Bộ lọc sản phẩm">
      {showCategoryFilter ? (
        <div className="filter-panel-group">
          <label htmlFor="filter-category">Danh mục</label>
          <select
            id="filter-category"
            value={value.categoryId}
            onChange={(event) => onChange({ ...value, categoryId: event.target.value })}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <fieldset className="filter-panel-group">
        <legend>Khoảng giá</legend>
        <div className="filter-panel-price-row">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Từ"
            aria-label="Giá tối thiểu"
            value={value.minPrice}
            onChange={(event) => onChange({ ...value, minPrice: event.target.value })}
          />
          <span>-</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Đến"
            aria-label="Giá tối đa"
            value={value.maxPrice}
            onChange={(event) => onChange({ ...value, maxPrice: event.target.value })}
          />
        </div>
      </fieldset>

      <fieldset className="filter-panel-group">
        <legend>Thuộc tính biến thể</legend>
        {ATTRIBUTE_FIELDS.map((field) => (
          <div className="filter-panel-attribute-row" key={field.key}>
            <label htmlFor={`filter-attr-${field.key}`}>{field.label}</label>
            <input
              id={`filter-attr-${field.key}`}
              type="text"
              value={value.attributes[field.key] ?? ''}
              onChange={(event) => updateAttribute(field.key, event.target.value)}
            />
          </div>
        ))}
      </fieldset>

      <div className="filter-panel-actions">
        <Button type="button" variant="ghost" onClick={handleReset}>
          Xóa lọc
        </Button>
      </div>
    </div>
  )
}

export default FilterPanel
