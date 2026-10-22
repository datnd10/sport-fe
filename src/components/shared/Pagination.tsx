import { ChevronIcon } from './icons'
import './Pagination.css'

// Shared pagination control for server-side paginated Admin lists (e.g.
// Admin Sản_Phẩm, Requirement 1.4). `page` is 0-based to match the
// backend's PageResponse. Page numbers are displayed to the user as
// 1-based and clicking one calls `onPageChange` with the corresponding
// 0-based index. Prev/Next are rendered as chevron icon buttons
// (reusing the sidebar's ChevronIcon, flipped for "next" the same way
// AdminLayout flips it for the expand/collapse toggle).
export type PaginationProps = {
  /** Current 0-based page index. */
  page: number
  /** Total number of pages available. */
  totalPages: number
  /** Called with the next 0-based page index when a page control is clicked. */
  onPageChange: (page: number) => void
  /** Optional extra class name, e.g. to drop the default centering when embedded in TablePaginationBar. */
  className?: string
}

/** Marker for a collapsed run of page numbers, rendered as "...". */
const ELLIPSIS = '...' as const

type PageItem = number | typeof ELLIPSIS

// Below this many total pages, show every page number — no need to
// collapse anything.
const MAX_PAGES_WITHOUT_COLLAPSE = 7

/**
 * Builds the 1-based list of page numbers (and "..." markers) to render
 * for a given current page. Always includes the first and last page,
 * the current page and its immediate neighbours, collapsing any gap
 * into a single "..." entry, e.g. `1 ... 4 5 [6] 7 8 ... 20`.
 */
function buildPageItems(currentPage1Based: number, totalPages: number): PageItem[] {
  if (totalPages <= MAX_PAGES_WITHOUT_COLLAPSE) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: PageItem[] = []
  const pushNumber = (pageNumber: number) => {
    items.push(pageNumber)
  }
  const pushEllipsisOrNumber = (pageNumber: number, previous: number) => {
    if (pageNumber === previous + 1) {
      pushNumber(pageNumber)
    } else if (pageNumber > previous + 1) {
      items.push(ELLIPSIS)
      pushNumber(pageNumber)
    }
  }

  pushNumber(1)

  const rangeStart = Math.max(2, currentPage1Based - 1)
  const rangeEnd = Math.min(totalPages - 1, currentPage1Based + 1)

  pushEllipsisOrNumber(rangeStart, items[items.length - 1] as number)
  for (let pageNumber = rangeStart + 1; pageNumber <= rangeEnd; pageNumber += 1) {
    pushNumber(pageNumber)
  }

  pushEllipsisOrNumber(totalPages, items[items.length - 1] as number)

  return items
}

function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1)
  const isFirstPage = page <= 0
  const isLastPage = page >= safeTotalPages - 1
  const currentPage1Based = page + 1

  function handlePrevious() {
    if (!isFirstPage) {
      onPageChange(page - 1)
    }
  }

  function handleNext() {
    if (!isLastPage) {
      onPageChange(page + 1)
    }
  }

  function handlePageClick(pageNumber1Based: number) {
    const targetPage = pageNumber1Based - 1
    if (targetPage !== page) {
      onPageChange(targetPage)
    }
  }

  const pageItems = buildPageItems(currentPage1Based, safeTotalPages)
  const classes = ['pagination', className].filter(Boolean).join(' ')

  return (
    <nav className={classes} aria-label="Điều hướng phân trang">
      <button
        type="button"
        className="pagination-arrow-btn"
        onClick={handlePrevious}
        disabled={isFirstPage}
        aria-label="Trang trước"
      >
        <ChevronIcon />
      </button>

      <ul className="pagination-pages">
        {pageItems.map((item, index) =>
          item === ELLIPSIS ? (
            <li key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden="true">
              {ELLIPSIS}
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={['pagination-page-btn', item === currentPage1Based ? 'pagination-page-btn-active' : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handlePageClick(item)}
                aria-label={`Trang ${item}`}
                aria-current={item === currentPage1Based ? 'page' : undefined}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className="pagination-arrow-btn"
        onClick={handleNext}
        disabled={isLastPage}
        aria-label="Trang sau"
      >
        <ChevronIcon className="pagination-arrow-icon-next" />
      </button>
    </nav>
  )
}

export default Pagination
