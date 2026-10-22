import { useEffect, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import './Modal.css'

// Minimal shared Modal used by Admin pages that need an in-page dialog
// (e.g. creating a Sản_Phẩm without leaving the list page). No external
// dependency — a plain overlay + panel styled with design tokens.
// Closes on Escape, on backdrop click, or via the close button.
export type ModalProps = {
  /** Controls whether the modal is rendered at all. */
  isOpen: boolean
  /** Called when the user asks to close the modal (Esc, backdrop, X button). */
  onClose: () => void
  /** Dialog title shown in the modal header. */
  title: string
  children: ReactNode
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick} role="presentation">
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handlePanelKeyDown}
      >
        <header className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
