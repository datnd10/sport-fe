import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Button, EditIcon, SearchIcon, TablePaginationBar } from '../../components/shared'
import { getErrorMessage, getFieldErrors } from '../../services/apiError'
import adminCategoryService from '../../services/adminCategoryService'
import type { CategoryResponse } from '../../services/productService.types'
import { notifySuccess } from '../../services/toast'
import AdminLayout from './AdminLayout'
import CategoryEditModal from './CategoryEditModal'
import '../../components/shared/SearchInput.css'
import './AdminForms.css'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50]

/**
 * Trang quản lý Danh_Mục cho Quản_Trị_Viên: liệt kê Danh_Mục theo trang
 * (phân trang phía server, sắp xếp theo tên) kèm tìm kiếm theo tên, và
 * biểu mẫu tạo Danh_Mục mới (Requirement 1.1). Sửa tên Danh_Mục mở
 * trong một modal riêng (CategoryEditModal); không có hành động xóa vì
 * Sản_Phẩm có thể tham chiếu đến Danh_Mục.
 */
function AdminCategoryPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  // "draft" theo dõi những gì người dùng đang gõ; "applied" theo dõi
  // những gì đã được gửi lần cuối và là giá trị loadCategories thực sự
  // dùng để truy vấn. Tìm kiếm chỉ có hiệu lực khi người dùng bấm
  // "Tìm kiếm" (hoặc nhấn Enter trong ô nhập) — không phải mỗi lần gõ.
  const [keywordDraft, setKeywordDraft] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null)

  const [name, setName] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const pageResponse = await adminCategoryService.listAllCategories({
        page,
        size: pageSize,
        keyword: appliedKeyword.trim() || undefined,
      })
      setCategories(pageResponse.content)
      setTotalPages(pageResponse.totalPages)
      setTotalElements(pageResponse.totalElements)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách danh mục. Vui lòng thử lại.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, appliedKeyword])

  // Gọi lại API mỗi khi trang, kích thước trang, hoặc từ khóa ĐÃ ÁP DỤNG
  // (applied) thay đổi — không phụ thuộc vào draft, nên gõ trong UI sẽ
  // không tự gọi lại API cho đến khi người dùng bấm "Tìm kiếm".
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  function handleKeywordDraftChange(nextKeyword: string) {
    setKeywordDraft(nextKeyword)
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedKeyword(keywordDraft)
    setPage(0)
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(0)
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    const trimmedName = name.trim()
    if (!trimmedName) {
      setFieldErrors({ name: 'Tên Danh_Mục không được để trống' })
      return
    }

    setIsSubmitting(true)
    try {
      await adminCategoryService.createCategory({ name: trimmedName })
      setName('')
      setPage(0)
      await loadCategories()
      notifySuccess('Đã tạo danh mục mới.')
    } catch (error) {
      const backendFieldErrors = getFieldErrors(error)
      if (backendFieldErrors.length > 0) {
        setFieldErrors(Object.fromEntries(backendFieldErrors.map((fieldError) => [fieldError.field, fieldError.message])))
      }
      setFormError(getErrorMessage(error, 'Tạo danh mục không thành công. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCategoryUpdated(_updated: CategoryResponse) {
    setEditingCategory(null)
    loadCategories()
  }

  return (
    <AdminLayout title="Quản lý Danh mục">
      <section className="admin-card">
        <h3>Tạo danh mục mới</h3>
        <form className="admin-form" onSubmit={handleCreateSubmit}>
          <div className="admin-form-field">
            <label htmlFor="category-name">Tên danh mục</label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            {fieldErrors.name ? <span className="admin-field-error">{fieldErrors.name}</span> : null}
          </div>

          {formError ? <p className="admin-form-error">{formError}</p> : null}

          <div className="admin-form-actions">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Tạo danh mục'}
            </Button>
          </div>
        </form>
      </section>

      <form className="admin-filter-row" onSubmit={handleSearchSubmit}>
        <div className="admin-filter-fields">
          <div className="admin-form-field">
            <label htmlFor="admin-category-search">Tên danh mục</label>
            <input
              type="search"
              id="admin-category-search"
              className="search-input"
              value={keywordDraft}
              onChange={(event) => handleKeywordDraftChange(event.target.value)}
              placeholder="Tìm theo tên danh mục..."
            />
          </div>
          <button type="submit" className="admin-search-btn" aria-label="Tìm kiếm" title="Tìm kiếm">
            <SearchIcon />
          </button>
        </div>
      </form>

      <section className="admin-card">
        {isLoading ? <p>Đang tải...</p> : null}
        {!isLoading && loadError ? <p className="admin-form-error">{loadError}</p> : null}

        {!isLoading && !loadError && categories.length === 0 ? <p>Chưa có danh mục nào.</p> : null}

        {!isLoading && !loadError && categories.length > 0 ? (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên danh mục</th>
                  <th>Slug</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.slug}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          onClick={() => setEditingCategory(category)}
                          aria-label={`Sửa danh mục ${category.name}`}
                          title="Sửa"
                        >
                          <EditIcon />
                        </button>
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

      <CategoryEditModal
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onUpdated={handleCategoryUpdated}
      />
    </AdminLayout>
  )
}

export default AdminCategoryPage
