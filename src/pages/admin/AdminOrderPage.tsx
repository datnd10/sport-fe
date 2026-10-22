import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Badge, Button, SearchIcon, TablePaginationBar } from '../../components/shared'
import type { BadgeVariant } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import orderService from '../../services/orderService'
import type { OrderStatus, OrderSummaryResponse } from '../../services/orderService.types'
import { notifySuccess } from '../../services/toast'
import AdminLayout from './AdminLayout'
import '../../components/shared/SearchInput.css'
import './AdminForms.css'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('vi-VN')
}

function formatCurrency(value: number): string {
  return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
}

const STATUS_BADGE_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  PENDING: 'warning',
  CONFIRMED: 'accent',
  SHIPPING: 'accent',
  DELIVERED: 'brand',
  CANCELLED: 'error',
}

// Mọi Trạng_Thái_Đơn_Hàng khả dụng cho select bộ lọc, theo đúng thứ tự
// trong state machine (Chờ_Xác_Nhận → Đã_Xác_Nhận → Đang_Giao → Đã_Giao,
// cùng với Đã_Hủy).
const FILTERABLE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED']

// Mirrors the order status state machine in OrderStatusService.java /
// design.md: Chờ_Xác_Nhận → Đã_Xác_Nhận → Đang_Giao → Đã_Giao, or →
// Đã_Hủy from Chờ_Xác_Nhận/Đã_Xác_Nhận. Đã_Giao and Đã_Hủy are terminal
// (no outgoing transitions). Requirements: 5.3, 5.5
const ALLOWED_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

const CANCELLABLE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED']

/**
 * Trang quản lý Đơn_Hàng cho Quản_Trị_Viên: hiển thị danh sách Đơn_Hàng
 * theo trang (phân trang phía server) kèm thông tin khách hàng, tổng
 * tiền và Trạng_Thái_Đơn_Hàng hiện tại (Requirement 5.2), hỗ trợ tìm
 * kiếm theo mã đơn hoặc tên/email khách hàng và lọc theo
 * Trạng_Thái_Đơn_Hàng, cho phép cập nhật Trạng_Thái_Đơn_Hàng sang một
 * trạng thái hợp lệ theo trình tự cho phép (Requirement 5.3), hủy
 * Đơn_Hàng đang ở trạng thái Chờ_Xác_Nhận/Đã_Xác_Nhận (Requirement 5.4),
 * và ngăn/ẩn các chuyển đổi trạng thái không hợp lệ trên UI, đồng thời
 * hiển thị lỗi từ backend khi chuyển đổi bị từ chối (Requirement 5.5).
 * Không có hành động "Thêm mới" — Đơn_Hàng chỉ được tạo từ phía khách
 * hàng khi checkout.
 */
function AdminOrderPage() {
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  // "draft" tracks what the user is currently typing/selecting;
  // "applied" tracks what was last submitted and is what loadOrders
  // actually queries with. Search/filtering only takes effect once the
  // user clicks "Tìm kiếm" — not on every keystroke or select change.
  const [keywordDraft, setKeywordDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState<OrderStatus | ''>('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [appliedStatus, setAppliedStatus] = useState<OrderStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Keyed by orderId — tracks which row is currently submitting a status
  // change, and the error message for that row (if any).
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const pageResponse = await orderService.getAllOrders({
        page,
        size: pageSize,
        keyword: appliedKeyword.trim() || undefined,
        status: appliedStatus || undefined,
      })
      setOrders(pageResponse.content)
      setTotalPages(pageResponse.totalPages)
      setTotalElements(pageResponse.totalElements)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, appliedKeyword, appliedStatus])

  // Gọi lại API mỗi khi trang, kích thước trang, hoặc từ khóa/bộ lọc
  // Trạng_Thái_Đơn_Hàng ĐÃ ÁP DỤNG (applied) thay đổi — không phụ thuộc
  // vào draft, nên gõ/chọn trong UI sẽ không tự gọi lại API cho đến khi
  // người dùng bấm "Tìm kiếm".
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  function handleKeywordDraftChange(nextKeyword: string) {
    setKeywordDraft(nextKeyword)
  }

  function handleStatusDraftChange(nextStatus: OrderStatus | '') {
    setStatusDraft(nextStatus)
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedKeyword(keywordDraft)
    setAppliedStatus(statusDraft)
    setPage(0)
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(0)
  }

  async function handleStatusChange(orderId: string, nextStatus: OrderStatus) {
    setUpdatingOrderId(orderId)
    setRowErrors((previous) => {
      const rest = { ...previous }
      delete rest[orderId]
      return rest
    })

    try {
      await orderService.updateOrderStatus(orderId, { status: nextStatus })
      await loadOrders()
      notifySuccess(
        nextStatus === 'CANCELLED'
          ? 'Đã hủy đơn hàng.'
          : `Đã chuyển trạng thái đơn hàng sang "${STATUS_LABELS[nextStatus]}".`,
      )
    } catch (error) {
      setRowErrors((previous) => ({
        ...previous,
        [orderId]: getErrorMessage(error, 'Cập nhật trạng thái đơn hàng không thành công. Vui lòng thử lại.'),
      }))
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <AdminLayout title="Quản lý Đơn hàng">
      <form className="admin-filter-row" onSubmit={handleSearchSubmit}>
        <div className="admin-filter-fields">
          <div className="admin-form-field">
            <label htmlFor="admin-order-search">Mã đơn / Khách hàng</label>
            <input
              type="search"
              id="admin-order-search"
              className="search-input"
              value={keywordDraft}
              onChange={(event) => handleKeywordDraftChange(event.target.value)}
              placeholder="Tìm theo mã đơn hoặc tên/email khách hàng..."
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="admin-order-status-filter">Trạng thái</label>
            <select
              id="admin-order-status-filter"
              className="admin-select"
              value={statusDraft}
              onChange={(event) => handleStatusDraftChange(event.target.value as OrderStatus | '')}
            >
              <option value="">Tất cả trạng thái</option>
              {FILTERABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="admin-search-btn" aria-label="Tìm kiếm" title="Tìm kiếm">
            <SearchIcon />
          </button>
        </div>
      </form>

      <section className="admin-card">
        {isLoading ? <p>Đang tải...</p> : null}
        {!isLoading && loadError ? <p className="admin-form-error">{loadError}</p> : null}

        {!isLoading && !loadError && orders.length === 0 ? <p>Chưa có Đơn_Hàng nào.</p> : null}

        {!isLoading && !loadError && orders.length > 0 ? (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const nextStatuses = ALLOWED_NEXT_STATUSES[order.status]
                  const isUpdating = updatingOrderId === order.id
                  const canCancel = CANCELLABLE_STATUSES.includes(order.status)

                  return (
                    <tr key={order.id}>
                      <td>{order.orderCode}</td>
                      <td>{order.accountFullName ?? order.accountEmail ?? 'Khách vãng lai'}</td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <Badge variant={STATUS_BADGE_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                      </td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>
                        {nextStatuses.length === 0 ? (
                          <span className="admin-order-no-action">Không còn hành động</span>
                        ) : (
                          <div className="admin-table-actions">
                            {nextStatuses
                              .filter((status) => status !== 'CANCELLED')
                              .map((status) => (
                                <Button
                                  key={status}
                                  variant="secondary"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusChange(order.id, status)}
                                >
                                  {isUpdating ? 'Đang xử lý...' : `Chuyển sang ${STATUS_LABELS[status]}`}
                                </Button>
                              ))}
                            {canCancel ? (
                              <Button
                                variant="ghost"
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                              >
                                Hủy đơn
                              </Button>
                            ) : null}
                          </div>
                        )}
                        {rowErrors[order.id] ? <p className="admin-field-error">{rowErrors[order.id]}</p> : null}
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

export default AdminOrderPage
