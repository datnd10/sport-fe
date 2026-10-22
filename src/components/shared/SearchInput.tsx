import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import './SearchInput.css'

// Shared debounced search input for server-side filtered Admin lists
// (e.g. Admin Sản_Phẩm, Requirement 1.4). Unlike the Storefront's
// SearchBar (which only searches on submit), this fires onChange ~400ms
// after the user stops typing, so callers can re-query the backend
// without spamming it on every keystroke.
export type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Debounce delay in milliseconds. Defaults to 400ms. */
  debounceMs?: number
  /** Optional id, so a visible <label htmlFor> can target this input. */
  id?: string
}

function SearchInput({ value, onChange, placeholder = 'Tìm kiếm...', debounceMs = 400, id }: SearchInputProps) {
  const [draft, setDraft] = useState(value)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Keep the input in sync if the caller resets `value` externally
  // (e.g. clearing a filter), without fighting the user's own typing.
  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (draft === value) {
      return
    }
    const timeoutId = window.setTimeout(() => {
      onChangeRef.current(draft)
    }, debounceMs)

    return () => window.clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, debounceMs])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value)
  }

  return (
    <input
      type="search"
      id={id}
      className="search-input"
      value={draft}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  )
}

export default SearchInput
