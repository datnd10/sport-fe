import { type ChangeEvent } from 'react'

// Shared currency input used by Admin Sản_Phẩm forms (ProductCreateModal,
// ProductEditModal) for price fields ("Giá cơ bản", "Giá" của biến thể).
// A plain <input type="number"> can't show thousands separators (e.g.
// "20.000") since HTML's number inputs only accept raw digits, so this
// renders a text input instead: it displays the formatted value but
// strips non-digit characters on every keystroke before handing the raw
// numeric string back to the caller via onChange. Callers keep storing
// the raw digits in state (same as before), so validation/submit code
// that does Number(value) elsewhere doesn't need to change.
export type CurrencyInputProps = {
  id?: string
  /** Raw numeric value as a string, e.g. "20000". */
  value: string
  /** Receives the raw numeric string (no separators), e.g. "20000". */
  onChange: (rawValue: string) => void
  required?: boolean
  placeholder?: string
  min?: number
}

function formatRawValue(rawValue: string): string {
  if (!rawValue) {
    return ''
  }
  const numeric = Number(rawValue)
  if (Number.isNaN(numeric)) {
    return ''
  }
  return numeric.toLocaleString('vi-VN')
}

function CurrencyInput({ id, value, onChange, required, placeholder, min }: CurrencyInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/\D/g, '')
    onChange(digitsOnly)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={formatRawValue(value)}
      onChange={handleChange}
      required={required}
      placeholder={placeholder}
      min={min}
    />
  )
}

export default CurrencyInput
