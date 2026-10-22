import Pagination from './Pagination'
import './TablePaginationBar.css'

// Shared two-corner pagination bar for server-side paginated Admin
// tables: a page-size selector + "Hiển thị X-Y trên Z" summary in the
// bottom-left corner, and Trước/Sau page navigation in the bottom-right
// corner. Built on top of the existing Pagination component so any
// Admin list page can adopt it without duplicating page-change logic.
export type TablePaginationBarProps = {
  /** Current 0-based page index. */
  page: number
  /** Total number of pages available. */
  totalPages: number
  /** Total number of records across every page. */
  totalElements: number
  /** Current page size (records per page). */
  pageSize: number
  /** Selectable page size options, e.g. [10, 20, 50]. */
  pageSizeOptions?: number[]
  /** Called with the next 0-based page index when Trước/Sau is clicked. */
  onPageChange: (page: number) => void
  /** Called with the newly selected page size when the user changes it. */
  onPageSizeChange: (pageSize: number) => void
}

function TablePaginationBar({
  page,
  totalPages,
  totalElements,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
}: TablePaginationBarProps) {
  const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1
  const rangeEnd = Math.min(totalElements, (page + 1) * pageSize)

  return (
    <div className="table-pagination-bar">
      <div className="table-pagination-info">
        <select
          className="table-pagination-size-select"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Số bản ghi mỗi trang"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option} / trang
            </option>
          ))}
        </select>
        <span>
          {totalElements === 0
            ? 'Không có bản ghi nào'
            : `Hiển thị ${rangeStart}-${rangeEnd} trên ${totalElements} kết quả`}
        </span>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} className="table-pagination-nav" />
    </div>
  )
}

export default TablePaginationBar
