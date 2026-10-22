import { toast } from 'sonner'

// Thin re-export so the rest of the app imports toast helpers from one
// place (easier to swap the underlying toast library later without
// touching every call site).
export { toast }

/** Shows a success toast. Use after an action that mutates data and that
 * the user should get explicit positive feedback for (login, add to
 * cart, place order, admin CRUD, etc). Not used for plain GET/list
 * fetches. */
export function notifySuccess(message: string): void {
  toast.success(message)
}

/** Shows an error toast with a human-readable message. Prefer this over
 * inline-only error state when the action doesn't have a fixed place on
 * screen to render an inline message (e.g. list actions, modals that
 * may close). Forms that already render field-level inline errors can
 * still call this for a prominent, transient signal. */
export function notifyError(message: string): void {
  toast.error(message)
}
