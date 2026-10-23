import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import { Badge, Button, SearchIcon, TablePaginationBar } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import inventoryService from '../../services/inventoryService'
import type {
  InventoryChangeReason,
  InventoryHistoryResponse,
  InventoryItemResponse,
  StockStatus,
} from '../../services/inventoryService.types'
import { notifySuccess } from '../../services/toast'
import AdminLayout from './AdminLayout'
import '../../components/shared/SearchInput.css'
import './AdminForms.css'
import './AdminInventoryPage.css'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('vi-VN')
}

const REASON_LABELS: Record<InventoryChangeReason, string> = {
  ORDER_PLACED: 'Đặt hàng',
  ORDER_CANCELLED: 'Hủy đơn',
  MANUAL_ADJUSTMENT: 'Điều chỉnh thủ công',
}

/**
 * Trang quản lý Tồn_Kho cho Quản_Trị_Viên: liệt kê Biến_Thể_Sản_Phẩm theo
 * trang (phân trang phía server, sắp xếp theo SKU tăng dần) kèm tìm kiếm
 * theo SKU hoặc tên Sản_Phẩm liên quan (Requirement 7.3, 7.4), cho phép
 * điều chỉnh thủ công số lượng Tồn_Kho (Requirement 7.1, 7.2), và xem
 * lịch sử thay đổi Tồn_Kho của từng Biến_Thể_Sản_Phẩm (Requirement 7.5).
 * Không có hành động "Thêm mới" — Biến_Thể_Sản_Phẩm chỉ được tạo thông
 * qua module Sản_Phẩm.
 */
function AdminInventoryPage() {
  const [searchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') ?? ''
  const initialStockStatus = (['OUT_OF_STOCK', 'LOW_STOCK', 'IN_STOCK'] as StockStatus[]).find(s => s === searchParams.get('stockStatus')) ?? ''
  const [stockDraft, setStockDraft] = useState<StockStatus | ''>(initialStockStatus)
  const [appliedStock, setAppliedStock] = useState<StockStatus | ''>(initialStockStatus)
  const [items, setItems] = useState<InventoryItemResponse[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  // "draft" tracks what the user is currently typing; "applied" tracks
  // what was last submitted and is what loadInventory actually queries
  // with. Search only takes effect once the user clicks "Tìm kiếm" (or
  // presses Enter in the text input) — not on every keystroke.
  const [keywordDraft, setKeywordDraft] = useState(initialKeyword)
  const [appliedKeyword, setAppliedKeyword] = useState(initialKeyword)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Inline stock adjustment state, keyed by variantId.
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [draftQuantity, setDraftQuantity] = useState('')
  const [adjustError, setAdjustError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // History panel state for the currently expanded variant.
  const [historyVariantId, setHistoryVariantId] = useState<string | null>(null)
  const [history, setHistory] = useState<InventoryHistoryResponse[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const loadInventory = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const pageResponse = await inventoryService.listInventory({
        page,
        size: pageSize,
        keyword: appliedKeyword.trim() || undefined,
        stockStatus: appliedStock || undefined,
      })
      setItems(pageResponse.content)
      setTotalPages(pageResponse.totalPages)
      setTotalElements(pageResponse.totalElements)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách tồn kho. Vui lòng thử lại.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, appliedKeyword, appliedStock])

  // Gọi lại API mỗi khi trang, kích thước trang, hoặc từ khóa ĐÃ ÁP DỤNG
  // (applied) thay đổi — không phụ thuộc vào draft, nên gõ trong ô tìm
  // kiếm sẽ không tự gọi lại API cho đến khi người dùng bấm "Tìm kiếm".
  useEffect(() => {
    async function load() { await loadInventory() }
    void load()
  }, [loadInventory])

  function handleKeywordDraftChange(nextKeyword: string) {
    setKeywordDraft(nextKeyword)
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedKeyword(keywordDraft)
    setAppliedStock(stockDraft)
    setPage(0)
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(0)
  }

  function startEditing(item: InventoryItemResponse) {
    setAdjustError(null)
    setEditingVariantId(item.variantId)
    setDraftQuantity(String(item.stockQuantity))
  }

  function cancelEditing() {
    setEditingVariantId(null)
    setDraftQuantity('')
    setAdjustError(null)
  }

  async function handleSaveAdjustment(variantId: string) {
    setAdjustError(null)

    const parsedQuantity = Number(draftQuantity)
    if (!Number.isInteger(parsedQuantity)) {
      setAdjustError('Số lượng Tồn_Kho phải là một số nguyên.')
      return
    }
    if (parsedQuantity < 0) {
      setAdjustError('Số lượng Tồn_Kho không được âm.')
      return
    }

    setIsSaving(true)
    try {
      await inventoryService.adjustStock(variantId, { newQuantity: parsedQuantity })
      cancelEditing()
      await loadInventory()
      if (historyVariantId === variantId) {
        await loadHistory(variantId)
      }
      notifySuccess('Đã điều chỉnh tồn kho.')
    } catch (error) {
      setAdjustError(getErrorMessage(error, 'Điều chỉnh Tồn_Kho không thành công. Vui lòng thử lại.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function loadHistory(variantId: string) {
    setIsHistoryLoading(true)
    setHistoryError(null)
    try {
      const data = await inventoryService.getHistory(variantId)
      setHistory(data)
    } catch (error) {
      setHistoryError(getErrorMessage(error, 'Không thể tải lịch sử Tồn_Kho. Vui lòng thử lại.'))
    } finally {
      setIsHistoryLoading(false)
    }
  }

  async function handleToggleHistory(variantId: string) {
    if (historyVariantId === variantId) {
      setHistoryVariantId(null)
      setHistory([])
      setHistoryError(null)
      return
    }

    setHistoryVariantId(variantId)
    await loadHistory(variantId)
  }

  function renderStatusBadge(item: InventoryItemResponse) {
    if (item.stockStatus === 'OUT_OF_STOCK') {
      return <Badge variant="error">Hết hàng</Badge>
    }
    if (item.stockStatus === 'LOW_STOCK') {
      return <Badge variant="warning">Sắp hết hàng</Badge>
    }
    return <Badge variant="brand">Còn hàng</Badge>
  }

  return (
    <AdminLayout title="Quản lý Tồn kho">
      <form className="admin-filter-row" onSubmit={handleSearchSubmit}>
        <div className="admin-filter-fields">
          <div className="admin-form-field">
            <label htmlFor="admin-inventory-search">SKU / Tên sản phẩm</label>
            <input
              type="search"
              id="admin-inventory-search"
              className="search-input"
              value={keywordDraft}
              onChange={(event) => handleKeywordDraftChange(event.target.value)}
              placeholder="Tìm theo SKU hoặc tên sản phẩm..."
            />
          </div>
          <div className="admin-form-field"><label htmlFor="admin-inventory-stock-filter">Tình trạng tồn kho</label><select className="admin-select" id="admin-inventory-stock-filter" value={stockDraft} onChange={e => setStockDraft(e.target.value as StockStatus | '')}><option value="">Tất cả</option><option value="OUT_OF_STOCK">Hết hàng (đang hoạt động)</option><option value="LOW_STOCK">Sắp hết hàng (đang hoạt động)</option><option value="IN_STOCK">Còn hàng (đang hoạt động)</option></select></div>
          <button type="submit" className="admin-search-btn" aria-label="Tìm kiếm" title="Tìm kiếm">
            <SearchIcon />
          </button>
        </div>
      </form>

      <section className="admin-card">
        {isLoading ? <p>Đang tải...</p> : null}
        {!isLoading && loadError ? <p className="admin-form-error">{loadError}</p> : null}

        {!isLoading && !loadError && items.length === 0 ? <p>Chưa có Biến_Thể_Sản_Phẩm nào.</p> : null}

        {!isLoading && !loadError && items.length > 0 ? (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>SKU</th>
                  <th>Thuộc tính</th>
                  <th>Tồn kho</th>
                  <th>Ngưỡng cảnh báo</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <>
                    <tr key={item.variantId} className={item.stockStatus !== 'IN_STOCK' ? 'admin-inventory-row-alert' : undefined}>
                      <td>{item.productName}</td>
                      <td>{item.sku}</td>
                      <td>{item.attributes ?? '—'}</td>
                      <td>
                        {editingVariantId === item.variantId ? (
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={draftQuantity}
                            onChange={(event) => setDraftQuantity(event.target.value)}
                            className="admin-inventory-quantity-input"
                            aria-label={`Số lượng Tồn_Kho mới cho ${item.sku}`}
                          />
                        ) : (
                          item.stockQuantity
                        )}
                      </td>
                      <td>{item.lowStockThreshold}</td>
                      <td>{renderStatusBadge(item)}</td>
                      <td>
                        <div className="admin-table-actions">
                          {editingVariantId === item.variantId ? (
                            <>
                              <Button onClick={() => handleSaveAdjustment(item.variantId)} disabled={isSaving}>
                                {isSaving ? 'Đang lưu...' : 'Lưu'}
                              </Button>
                              <Button variant="ghost" onClick={cancelEditing} disabled={isSaving}>
                                Hủy
                              </Button>
                            </>
                          ) : (
                            <Button variant="secondary" onClick={() => startEditing(item)}>
                              Điều chỉnh
                            </Button>
                          )}
                          <Button variant="ghost" onClick={() => handleToggleHistory(item.variantId)}>
                            {historyVariantId === item.variantId ? 'Ẩn lịch sử' : 'Xem lịch sử'}
                          </Button>
                        </div>
                        {editingVariantId === item.variantId && adjustError ? (
                          <p className="admin-field-error">{adjustError}</p>
                        ) : null}
                      </td>
                    </tr>
                    {historyVariantId === item.variantId ? (
                      <tr key={`${item.variantId}-history`}>
                        <td colSpan={7}>
                          <div className="admin-inventory-history">
                            {isHistoryLoading ? <p>Đang tải lịch sử...</p> : null}
                            {!isHistoryLoading && historyError ? (
                              <p className="admin-form-error">{historyError}</p>
                            ) : null}
                            {!isHistoryLoading && !historyError && history.length === 0 ? (
                              <p>Chưa có lịch sử thay đổi Tồn_Kho cho Biến_Thể_Sản_Phẩm này.</p>
                            ) : null}
                            {!isHistoryLoading && !historyError && history.length > 0 ? (
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Thời điểm</th>
                                    <th>Thay đổi</th>
                                    <th>Nguyên nhân</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {history.map((entry) => (
                                    <tr key={entry.id}>
                                      <td>{formatDateTime(entry.changedAt)}</td>
                                      <td className={entry.changeAmount < 0 ? 'admin-inventory-change-negative' : 'admin-inventory-change-positive'}>
                                        {entry.changeAmount > 0 ? `+${entry.changeAmount}` : entry.changeAmount}
                                      </td>
                                      <td>{REASON_LABELS[entry.reason]}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
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
    </AdminLayout>
  )
}

export default AdminInventoryPage
