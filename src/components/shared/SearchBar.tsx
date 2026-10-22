import { type FormEvent, useState } from 'react'
import Button from './Button'
import './SearchBar.css'

// Shared search bar used by Storefront pages to look up Sản_Phẩm by
// keyword (matches name/description on the backend). Submitting the form
// (Enter key or the "Tìm kiếm" button) calls onSearch with the trimmed
// keyword so the caller can trigger GET /api/products?keyword=...
// Requirements: 2.3
type SearchBarProps = {
  /** Initial keyword value, e.g. restored from the URL's query string. */
  initialKeyword?: string
  /** Called with the trimmed keyword when the search is submitted. */
  onSearch: (keyword: string) => void
  placeholder?: string
}

function SearchBar({ initialKeyword = '', onSearch, placeholder = 'Tìm kiếm sản phẩm...' }: SearchBarProps) {
  const [keyword, setKeyword] = useState(initialKeyword)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(keyword.trim())
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        className="search-bar-input"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder={placeholder}
        aria-label="Từ khóa tìm kiếm"
      />
      <Button type="submit" variant="secondary">
        Tìm kiếm
      </Button>
    </form>
  )
}

export default SearchBar
