import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Badge, Button, LockIcon, SearchIcon, TablePaginationBar, UnlockIcon } from '../../components/shared'
import { getErrorMessage } from '../../services/apiError'
import adminAccountService from '../../services/adminAccountService'
import type { AdminAccountResponse } from '../../services/adminAccountService.types'
import { notifySuccess } from '../../services/toast'
import { useAccountStore } from '../../store/accountStore'
import AdminLayout from './AdminLayout'
import '../../components/shared/SearchInput.css'
import './AdminForms.css'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatCreatedAt(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('vi-VN')
}

/**
 * Trang quản lý Tài_Khoản cho Quản_Trị_Viên: liệt kê mọi Tài_Khoản theo
 * trang (phân trang phía server) kèm tìm kiếm theo email hoặc họ tên,
 * với hành động khóa/mở khóa đăng nhập. Phạm vi trang này CHỈ gồm
 * xem + tìm kiếm + khóa/mở khóa — không xóa Tài_Khoản, không đổi vai
 * trò (role), không sửa thông tin cá nhân của Tài_Khoản khác, vì
 * Tài_Khoản được tạo qua đăng ký, không phải do Admin tạo trực tiếp.
 */
function AdminAccountPage() {
  const currentAccountId = useAccountStore((state) => state.account?.id)

  const [accounts, setAccounts] = useState<AdminAccountResponse[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  // "draft" tracks what the user is currently typing; "applied" tracks
  // what was last submitted and is what loadAccounts actually queries
  // with. Search only takes effect once the user clicks "Tìm kiếm" (or
  // presses Enter) — not on every keystroke.
  const [keywordDraft, setKeywordDraft] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Per-row action error, keyed by account id, so one failed toggle
  // (e.g. trying to lock yourself) doesn't affect other rows.
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [pendingLockId, setPendingLockId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadAccounts = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const pageResponse = await adminAccountService.listAllAccounts({
        page,
        size: pageSize,
        keyword: appliedKeyword.trim() || undefined,
      })
      setAccounts(pageResponse.content)
      setTotalPages(pageResponse.totalPages)
      setTotalElements(pageResponse.totalElements)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách tài khoản. Vui lòng thử lại.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, appliedKeyword])

  // Gọi lại API mỗi khi trang, kích thước trang, hoặc từ khóa ĐÃ ÁP DỤNG
  // (applied) thay đổi — không phụ thuộc vào draft, nên gõ trong UI sẽ
  // không tự gọi lại API cho đến khi người dùng bấm "Tìm kiếm".
  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

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

  function clearRowError(accountId: string) {
    setRowErrors((previous) => {
      if (!(accountId in previous)) {
        return previous
      }
      const next = { ...previous }
      delete next[accountId]
      return next
    })
  }

  async function handleSetEnabled(accountId: string, enabled: boolean) {
    setTogglingId(accountId)
    clearRowError(accountId)
    try {
      const updated = await adminAccountService.setAccountEnabled(accountId, enabled)
      setAccounts((previous) => previous.map((account) => (account.id === accountId ? updated : account)))
      setPendingLockId(null)
      notifySuccess(enabled ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
    } catch (error) {
      setRowErrors((previous) => ({
        ...previous,
        [accountId]: getErrorMessage(
          error,
          enabled ? 'Mở khóa tài khoản không thành công. Vui lòng thử lại.' : 'Khóa tài khoản không thành công. Vui lòng thử lại.',
        ),
      }))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <AdminLayout title="Quản lý Tài khoản">
      <form className="admin-filter-row" onSubmit={handleSearchSubmit}>
        <div className="admin-filter-fields">
          <div className="admin-form-field">
            <label htmlFor="admin-account-search">Email / Họ tên</label>
            <input
              type="search"
              id="admin-account-search"
              className="search-input"
              value={keywordDraft}
              onChange={(event) => handleKeywordDraftChange(event.target.value)}
              placeholder="Tìm theo email hoặc họ tên..."
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

        {!isLoading && !loadError && accounts.length === 0 ? <p>Chưa có tài khoản nào.</p> : null}

        {!isLoading && !loadError && accounts.length > 0 ? (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Họ tên</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const isSelf = account.id === currentAccountId
                  const rowError = rowErrors[account.id]
                  const isToggling = togglingId === account.id

                  return (
                    <tr key={account.id}>
                      <td>{account.email}</td>
                      <td>{account.fullName}</td>
                      <td>
                        {account.role === 'ADMIN' ? (
                          <Badge variant="brand">Quản trị viên</Badge>
                        ) : (
                          <span>Khách hàng</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={account.enabled ? 'brand' : 'error'}>
                          {account.enabled ? 'Đang hoạt động' : 'Đã khóa'}
                        </Badge>
                      </td>
                      <td>{formatCreatedAt(account.createdAt)}</td>
                      <td>
                        <div className="admin-table-actions">
                          {account.enabled ? (
                            pendingLockId === account.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  onClick={() => handleSetEnabled(account.id, false)}
                                  disabled={isToggling}
                                >
                                  Xác nhận khóa
                                </Button>
                                <Button variant="ghost" onClick={() => setPendingLockId(null)} disabled={isToggling}>
                                  Hủy
                                </Button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn-danger"
                                onClick={() => setPendingLockId(account.id)}
                                disabled={isSelf || isToggling}
                                aria-label={`Khóa tài khoản ${account.email}`}
                                title={isSelf ? 'Không thể khóa tài khoản đang đăng nhập' : 'Khóa tài khoản'}
                              >
                                <LockIcon />
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              className="admin-icon-btn"
                              onClick={() => handleSetEnabled(account.id, true)}
                              disabled={isToggling}
                              aria-label={`Mở khóa tài khoản ${account.email}`}
                              title="Mở khóa tài khoản"
                            >
                              <UnlockIcon />
                            </button>
                          )}
                        </div>
                        {rowError ? <p className="admin-form-error">{rowError}</p> : null}
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

export default AdminAccountPage
