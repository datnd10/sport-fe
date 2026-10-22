import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Badge, Button, ChevronIcon, EditIcon, EyeIcon, PlusIcon, SearchIcon, TablePaginationBar, TrashIcon } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import adminProductService from '../../services/adminProductService'
import categoryService from '../../services/categoryService'
import type { AdminProductSortBy, AdminProductSortDir } from '../../services/adminProductService.types'
import type { CategoryResponse, ProductResponse } from '../../services/productService.types'
import { notifySuccess } from '../../services/toast'
import AdminLayout from './AdminLayout'
import ProductCreateModal from './ProductCreateModal'
import ProductEditModal from './ProductEditModal'
import ProductViewModal from './ProductViewModal'
import '../../components/shared/SearchInput.css'
import './AdminForms.css'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50]

/** Columns the Admin Sản_Phẩm list table can be sorted by (click header). */
const SORTABLE_COLUMNS: { field: AdminProductSortBy; label: string }[] = [
  { field: 'name', label: 'Tên sản phẩm' },
  { field: 'basePrice', label: 'Giá cơ bản' },
]

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ'
}

/**
 * Trang quản lý Sản_Phẩm cho Quản_Trị_Viên: liệt kê Sản_Phẩm theo trang
 * (phân trang phía server) kèm tìm kiếm theo tên và lọc theo Danh_Mục,
 * bao gồm cả Sản_Phẩm đã bị ẩn/soft-deleted, với hành động xóa mềm
 * (Requirement 1.4, 1.5). "Thêm sản phẩm mới" mở ngay một modal tạo
 * sản phẩm (ProductCreateModal) thay vì điều hướng sang trang riêng.
 */
function AdminProductListPage() {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  // "draft" tracks what the user is currently typing/selecting; "applied"
  // tracks what was last submitted and is what loadProducts actually
  // queries with. Search/filtering only takes effect once the user
  // clicks "Tìm kiếm" (or presses Enter in the text input) — not on
  // every keystroke or select change.
  const [keywordDraft, setKeywordDraft] = useState('')
  const [categoryIdDraft, setCategoryIdDraft] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [appliedCategoryId, setAppliedCategoryId] = useState('')
  // Column sort state. Unlike keyword/category, sort is NOT a
  // draft/applied pair — clicking a header applies immediately, the
  // same way changing the page or page size does. `sortBy` starts
  // undefined so the backend's own default (createdAt desc) applies
  // until the user picks a column.
  const [sortBy, setSortBy] = useState<AdminProductSortBy | undefined>(undefined)
  const [sortDir, setSortDir] = useState<AdminProductSortDir>('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<ProductResponse | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const pageResponse = await adminProductService.listAllProducts({
        page,
        size: pageSize,
        keyword: appliedKeyword.trim() || undefined,
        categoryId: appliedCategoryId || undefined,
        sortBy,
        sortDir,
      })
      setProducts(pageResponse.content)
      setTotalPages(pageResponse.totalPages)
      setTotalElements(pageResponse.totalElements)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, appliedKeyword, appliedCategoryId, sortBy, sortDir])

  // Tải danh sách Danh_Mục một lần để hiển thị tên và làm bộ lọc.
  useEffect(() => {
    let isMounted = true

    categoryService
      .getCategories()
      .then((categoryList) => {
        if (isMounted) {
          setCategories(categoryList)
        }
      })
      .catch(() => {
        // Lỗi tải Danh_Mục không chặn trang Sản_Phẩm; tên danh mục sẽ hiển thị "—".
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Gọi lại API mỗi khi trang, kích thước trang, hoặc từ khóa/bộ lọc Danh_Mục
  // ĐÃ ÁP DỤNG (applied) thay đổi — không phụ thuộc vào draft, nên gõ/chọn
  // trong UI sẽ không tự gọi lại API cho đến khi người dùng bấm "Tìm kiếm".
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  function categoryName(categoryIdValue: string): string {
    return categories.find((category) => category.id === categoryIdValue)?.name ?? '—'
  }

  function handleKeywordDraftChange(nextKeyword: string) {
    setKeywordDraft(nextKeyword)
  }

  function handleCategoryDraftChange(nextCategoryId: string) {
    setCategoryIdDraft(nextCategoryId)
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedKeyword(keywordDraft)
    setAppliedCategoryId(categoryIdDraft)
    setPage(0)
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(0)
  }

  /**
   * Clicking a sortable column header applies immediately (like a page
   * change), no "Tìm kiếm" step needed. Clicking a column that isn't
   * currently active starts it at "desc" (highest/newest first, matching
   * the backend's own default direction); clicking the already-active
   * column flips its direction instead.
   */
  function handleSortClick(field: AdminProductSortBy) {
    if (sortBy === field) {
      setSortDir((currentDir) => (currentDir === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
    setPage(0)
  }

  async function handleDelete(productId: string) {
    setActionError(null)
    try {
      await adminProductService.deleteProduct(productId)
      setPendingDeleteId(null)
      await loadProducts()
      notifySuccess('Đã ẩn sản phẩm.')
    } catch (error) {
      setActionError(getErrorMessage(error, 'Xóa sản phẩm không thành công. Vui lòng thử lại.'))
    }
  }

  function handleProductCreated(_created: ProductResponse) {
    setIsCreateModalOpen(false)
    loadProducts()
    notifySuccess('Đã tạo sản phẩm mới.')
  }

  function handleProductUpdated(_updated: ProductResponse) {
    setEditingProductId(null)
    loadProducts()
    notifySuccess('Đã cập nhật sản phẩm.')
  }

  return (
    <AdminLayout title="Quản lý Sản phẩm">
      <form className="admin-filter-row" onSubmit={handleSearchSubmit}>
        <div className="admin-filter-fields">
          <div className="admin-form-field">
            <label htmlFor="admin-product-search">Tên sản phẩm</label>
            <input
              type="search"
              id="admin-product-search"
              className="search-input"
              value={keywordDraft}
              onChange={(event) => handleKeywordDraftChange(event.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="admin-product-category-filter">Danh mục</label>
            <select
              id="admin-product-category-filter"
              className="admin-select"
              value={categoryIdDraft}
              onChange={(event) => handleCategoryDraftChange(event.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="admin-search-btn" aria-label="Tìm kiếm" title="Tìm kiếm">
            <SearchIcon />
          </button>
        </div>
      </form>

      <div className="admin-action-row">
        <button
          type="button"
          className="admin-icon-btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Thêm sản phẩm mới"
          title="Thêm sản phẩm mới"
        >
          <PlusIcon />
        </button>
      </div>

      {actionError ? <p className="admin-form-error">{actionError}</p> : null}

      <section className="admin-card">
        {isLoading ? <p>Đang tải...</p> : null}
        {!isLoading && loadError ? <p className="admin-form-error">{loadError}</p> : null}

        {!isLoading && !loadError && products.length === 0 ? <p>Chưa có sản phẩm nào.</p> : null}

        {!isLoading && !loadError && products.length > 0 ? (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  {SORTABLE_COLUMNS.map(({ field, label }) => (
                    <th key={field} className="admin-table-th-sortable" aria-sort={
                      sortBy === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                    }>
                      <button
                        type="button"
                        className="admin-table-sort-btn"
                        onClick={() => handleSortClick(field)}
                        title={`Sắp xếp theo ${label}`}
                      >
                        <span>{label}</span>
                        <ChevronIcon
                          className={
                            'admin-table-sort-icon' +
                            (sortBy === field ? ' admin-table-sort-icon-active' : '') +
                            (sortBy === field && sortDir === 'asc' ? ' admin-table-sort-icon-asc' : '')
                          }
                        />
                      </button>
                    </th>
                  ))}
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{formatPrice(product.basePrice)}</td>
                    <td>{categoryName(product.categoryId)}</td>
                    <td>
                      <Badge variant={product.active ? 'brand' : 'error'}>
                        {product.active ? 'Đang hoạt động' : 'Đã ẩn'}
                      </Badge>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          onClick={() => setViewingProduct(product)}
                          aria-label={`Xem sản phẩm ${product.name}`}
                          title="Xem"
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          onClick={() => setEditingProductId(product.id)}
                          aria-label={`Sửa sản phẩm ${product.name}`}
                          title="Sửa"
                        >
                          <EditIcon />
                        </button>
                        {product.active ? (
                          pendingDeleteId === product.id ? (
                            <>
                              <Button variant="ghost" onClick={() => handleDelete(product.id)}>
                                Xác nhận ẩn
                              </Button>
                              <Button variant="ghost" onClick={() => setPendingDeleteId(null)}>
                                Hủy
                              </Button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn-danger"
                              onClick={() => setPendingDeleteId(product.id)}
                              aria-label={`Ẩn sản phẩm ${product.name}`}
                              title="Ẩn sản phẩm"
                            >
                              <TrashIcon />
                            </button>
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <TablePaginationBar
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        ) : null}
      </section>

      <ProductCreateModal
        isOpen={isCreateModalOpen}
        categories={categories}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleProductCreated}
      />

      <ProductViewModal
        product={viewingProduct}
        categoryName={viewingProduct ? categoryName(viewingProduct.categoryId) : '—'}
        onClose={() => setViewingProduct(null)}
      />

      <ProductEditModal
        productId={editingProductId}
        onClose={() => setEditingProductId(null)}
        onUpdated={handleProductUpdated}
      />
    </AdminLayout>
  )
}

export default AdminProductListPage
