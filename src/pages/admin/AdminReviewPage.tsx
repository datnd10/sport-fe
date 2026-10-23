import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Badge, SearchIcon, TablePaginationBar, TrashIcon, Button } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import reviewService from '../../services/reviewService'
import type { ReviewResponse } from '../../services/reviewService.types'
import { notifySuccess } from '../../services/toast'
import AdminLayout from './AdminLayout'
import ReviewImages from '../../components/reviews/ReviewImages'
import '../../components/shared/SearchInput.css'
import './AdminForms.css'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('vi-VN')
}

/**
 * Trang quản lý Đánh_Giá_Sản_Phẩm cho Quản_Trị_Viên: liệt kê theo trang
 * (phân trang phía server) toàn bộ Đánh_Giá_Sản_Phẩm (kể cả đã ẩn) kèm
 * Sản_Phẩm, người đánh giá, điểm và trạng thái hiển thị, với tìm kiếm
 * theo tên Sản_Phẩm hoặc nội dung đánh giá, và cho phép ẩn một
 * Đánh_Giá_Sản_Phẩm vi phạm nội dung (Requirement 9.4). Chỉ có hai hành
 * động: xem (hiển thị đầy đủ trong bảng) và ẩn — không có sửa, thêm mới,
 * hoặc hiện lại đánh giá đã ẩn.
 */
function AdminReviewPage() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  // "draft" tracks what the user is currently typing; "applied" tracks
  // what was last submitted and is what loadReviews actually queries
  // with. Search only takes effect once the user clicks "Tìm kiếm" (or
  // presses Enter in the text input) — not on every keystroke.
  const [keywordDraft, setKeywordDraft] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pendingHideId, setPendingHideId] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})

  const loadReviews = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const pageResponse = await reviewService.getAllReviews({
        page,
        size: pageSize,
        keyword: appliedKeyword.trim() || undefined,
      })
      setReviews(pageResponse.content)
      setTotalPages(pageResponse.totalPages)
      setTotalElements(pageResponse.totalElements)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách Đánh_Giá_Sản_Phẩm. Vui lòng thử lại.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, appliedKeyword])

  // Gọi lại API mỗi khi trang, kích thước trang, hoặc từ khóa tìm kiếm
  // ĐÃ ÁP DỤNG (applied) thay đổi — không phụ thuộc vào draft, nên gõ
  // trong ô tìm kiếm sẽ không tự gọi lại API cho đến khi người dùng bấm
  // "Tìm kiếm".
  useEffect(() => {
    loadReviews()
  }, [loadReviews])

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

  async function handleHide(reviewId: string) {
    setUpdatingId(reviewId)
    setRowErrors((previous) => {
      const rest = { ...previous }
      delete rest[reviewId]
      return rest
    })

    try {
      await reviewService.hideReview(reviewId)
      setPendingHideId(null)
      await loadReviews()
      notifySuccess('Đã ẩn đánh giá.')
    } catch (error) {
      setRowErrors((previous) => ({
        ...previous,
        [reviewId]: getErrorMessage(error, 'Ẩn Đánh_Giá_Sản_Phẩm không thành công. Vui lòng thử lại.'),
      }))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AdminLayout title="Quản lý Đánh giá Sản phẩm">
      <form className="admin-filter-row" onSubmit={handleSearchSubmit}>
        <div className="admin-filter-fields">
          <div className="admin-form-field">
            <label htmlFor="admin-review-search">Tìm kiếm</label>
            <input
              type="search"
              id="admin-review-search"
              className="search-input"
              value={keywordDraft}
              onChange={(event) => handleKeywordDraftChange(event.target.value)}
              placeholder="Tìm theo tên sản phẩm hoặc nội dung đánh giá..."
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
        {!isLoading && !loadError && reviews.length === 0 ? <p>Chưa có Đánh_Giá_Sản_Phẩm nào.</p> : null}

        {!isLoading && !loadError && reviews.length > 0 ? (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Người đánh giá</th>
                  <th>Điểm</th>
                  <th>Nội dung</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => {
                  const isUpdating = updatingId === review.id

                  return (
                    <tr key={review.id}>
                      <td>{review.productName}</td>
                      <td>{review.reviewerName ?? 'Khách hàng'}</td>
                      <td>{review.rating} / 5</td>
                      <td>{review.comment ?? '—'}<ReviewImages images={review.images} /></td>
                      <td>{formatDateTime(review.createdAt)}</td>
                      <td>
                        <Badge variant={review.hidden ? 'error' : 'brand'}>
                          {review.hidden ? 'Đã ẩn' : 'Đang hiển thị'}
                        </Badge>
                      </td>
                      <td>
                        {review.hidden ? (
                          <span className="admin-order-no-action">Không còn hành động</span>
                        ) : (
                          <div className="admin-table-actions">
                            {pendingHideId === review.id ? (
                              <>
                                <Button variant="ghost" disabled={isUpdating} onClick={() => handleHide(review.id)}>
                                  {isUpdating ? 'Đang xử lý...' : 'Xác nhận ẩn'}
                                </Button>
                                <Button variant="ghost" disabled={isUpdating} onClick={() => setPendingHideId(null)}>
                                  Hủy
                                </Button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn-danger"
                                onClick={() => setPendingHideId(review.id)}
                                aria-label={`Ẩn đánh giá của ${review.reviewerName ?? 'khách hàng'}`}
                                title="Ẩn đánh giá"
                              >
                                <TrashIcon />
                              </button>
                            )}
                          </div>
                        )}
                        {rowErrors[review.id] ? <p className="admin-field-error">{rowErrors[review.id]}</p> : null}
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
    </AdminLayout>
  )
}

export default AdminReviewPage
