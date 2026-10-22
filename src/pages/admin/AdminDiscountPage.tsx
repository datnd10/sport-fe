import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Badge, Button, PlusIcon, SearchIcon, TablePaginationBar, TrashIcon } from '../../components/shared'
import type { BadgeVariant } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import discountService from '../../services/discountService'
import type { DiscountCodeResponse, DiscountType } from '../../services/discountService.types'
import { notifySuccess } from '../../services/toast'
import AdminLayout from './AdminLayout'
import DiscountCreateModal from './DiscountCreateModal'
import '../../components/shared/SearchInput.css'
import './AdminForms.css'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('vi-VN')
}

const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Theo phần trăm (%)',
  FIXED_AMOUNT: 'Số tiền cố định (VNĐ)',
}

function formatDiscountValue(discountType: DiscountType, value: number): string {
  if (discountType === 'PERCENTAGE') {
    return `${value}%`
  }
  return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

function statusBadge(discountCode: DiscountCodeResponse): { label: string; variant: BadgeVariant } {
  if (!discountCode.active) {
    return { label: 'Đã vô hiệu hóa', variant: 'error' }
  }

  const now = Date.now()
  if (now < new Date(discountCode.validFrom).getTime()) {
    return { label: 'Chưa đến hiệu lực', variant: 'warning' }
  }
  if (now > new Date(discountCode.validTo).getTime()) {
    return { label: 'Đã hết hạn', variant: 'warning' }
  }
  if (discountCode.usageCount >= discountCode.maxUsage) {
    return { label: 'Đã đạt giới hạn sử dụng', variant: 'warning' }
  }
  return { label: 'Đang hoạt động', variant: 'brand' }
}

/**
 * Trang quản lý Mã_Giảm_Giá cho Quản_Trị_Viên: liệt kê Mã_Giảm_Giá theo
 * trang (phân trang phía server) kèm tìm kiếm theo mã, trạng thái hiệu
 * lực hiện tại (Requirement 8.1, 8.4). "Tạo Mã_Giảm_Giá mới" mở ngay
 * một modal tạo (DiscountCreateModal) thay vì hiển thị form inline cố
 * định, từ chối mã đã tồn tại thông qua lỗi trả về từ backend
 * (Requirement 8.2), và cho phép vô hiệu hóa một Mã_Giảm_Giá đang hoạt
 * động (Requirement 8.3) — không có hành động xóa cứng hay kích hoạt lại.
 */
function AdminDiscountPage() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCodeResponse[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  // "draft" tracks what the user is currently typing; "applied" tracks
  // what was last submitted and is what loadDiscountCodes actually
  // queries with. Search only takes effect once the user clicks "Tìm
  // kiếm" (or presses Enter in the text input) — not on every keystroke.
  const [keywordDraft, setKeywordDraft] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})

  const loadDiscountCodes = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const pageResponse = await discountService.getAllDiscountCodes({
        page,
        size: pageSize,
        keyword: appliedKeyword.trim() || undefined,
      })
      setDiscountCodes(pageResponse.content)
      setTotalPages(pageResponse.totalPages)
      setTotalElements(pageResponse.totalElements)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách Mã_Giảm_Giá. Vui lòng thử lại.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, appliedKeyword])

  // Gọi lại API mỗi khi trang, kích thước trang, hoặc từ khóa ĐÃ ÁP DỤNG
  // (applied) thay đổi — không phụ thuộc vào draft, nên gõ trong ô tìm
  // kiếm sẽ không tự gọi lại API cho đến khi người dùng bấm "Tìm kiếm".
  useEffect(() => {
    loadDiscountCodes()
  }, [loadDiscountCodes])

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

  function handleDiscountCreated(_created: DiscountCodeResponse) {
    setIsCreateModalOpen(false)
    setPage(0)
    loadDiscountCodes()
    notifySuccess('Đã tạo mã giảm giá mới.')
  }

  async function handleDeactivate(id: string) {
    setUpdatingId(id)
    setRowErrors((previous) => {
      const rest = { ...previous }
      delete rest[id]
      return rest
    })

    try {
      await discountService.deactivateDiscountCode(id)
      setPendingDeactivateId(null)
      await loadDiscountCodes()
      notifySuccess('Đã vô hiệu hóa mã giảm giá.')
    } catch (error) {
      setRowErrors((previous) => ({
        ...previous,
        [id]: getErrorMessage(error, 'Vô hiệu hóa Mã_Giảm_Giá không thành công. Vui lòng thử lại.'),
      }))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AdminLayout title="Quản lý Mã giảm giá">
      <form className="admin-filter-row" onSubmit={handleSearchSubmit}>
        <div className="admin-filter-fields">
          <div className="admin-form-field">
            <label htmlFor="admin-discount-search">Mã giảm giá</label>
            <input
              type="search"
              id="admin-discount-search"
              className="search-input"
              value={keywordDraft}
              onChange={(event) => handleKeywordDraftChange(event.target.value)}
              placeholder="Tìm theo mã giảm giá..."
            />
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
          aria-label="Tạo Mã_Giảm_Giá mới"
          title="Tạo Mã_Giảm_Giá mới"
        >
          <PlusIcon />
        </button>
      </div>

      <section className="admin-card">
        {isLoading ? <p>Đang tải...</p> : null}
        {!isLoading && loadError ? <p className="admin-form-error">{loadError}</p> : null}
        {!isLoading && !loadError && discountCodes.length === 0 ? <p>Chưa có Mã_Giảm_Giá nào.</p> : null}

        {!isLoading && !loadError && discountCodes.length > 0 ? (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Loại</th>
                  <th>Giá trị</th>
                  <th>Hiệu lực</th>
                  <th>Đã dùng / Tối đa</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {discountCodes.map((discountCode) => {
                  const status = statusBadge(discountCode)
                  const isUpdating = updatingId === discountCode.id

                  return (
                    <tr key={discountCode.id}>
                      <td>{discountCode.code}</td>
                      <td>{DISCOUNT_TYPE_LABELS[discountCode.discountType]}</td>
                      <td>{formatDiscountValue(discountCode.discountType, discountCode.discountValue)}</td>
                      <td>
                        {formatDateTime(discountCode.validFrom)} — {formatDateTime(discountCode.validTo)}
                      </td>
                      <td>
                        {discountCode.usageCount} / {discountCode.maxUsage}
                      </td>
                      <td>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          {discountCode.active ? (
                            pendingDeactivateId === discountCode.id ? (
                              <>
                                <Button variant="ghost" disabled={isUpdating} onClick={() => handleDeactivate(discountCode.id)}>
                                  {isUpdating ? 'Đang xử lý...' : 'Xác nhận vô hiệu hóa'}
                                </Button>
                                <Button variant="ghost" disabled={isUpdating} onClick={() => setPendingDeactivateId(null)}>
                                  Hủy
                                </Button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn-danger"
                                onClick={() => setPendingDeactivateId(discountCode.id)}
                                aria-label={`Vô hiệu hóa mã ${discountCode.code}`}
                                title="Vô hiệu hóa"
                              >
                                <TrashIcon />
                              </button>
                            )
                          ) : (
                            <span className="admin-order-no-action">Không còn hành động</span>
                          )}
                        </div>
                        {rowErrors[discountCode.id] ? (
                          <p className="admin-field-error">{rowErrors[discountCode.id]}</p>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
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

      <DiscountCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleDiscountCreated}
      />
    </AdminLayout>
  )
}

export default AdminDiscountPage
