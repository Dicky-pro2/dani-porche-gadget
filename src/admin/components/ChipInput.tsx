import { Plus, X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

export function ChipInput({ label, values, onChange, id }: { label: string; values: string[]; onChange: (values: string[]) => void; id: string }) {
  const [entry, setEntry] = useState('')
  const add = () => {
    const value = entry.trim()
    if (!value || values.includes(value) || value.length > 60 || values.length >= 20) return
    onChange([...values, value])
    setEntry('')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      add()
    }
  }

  return (
    <fieldset className="admin-field admin-chip-field">
      <legend>{label}</legend>
      <div className="admin-chips">
        {values.map((value) => <span className="admin-chip" key={value}>{value}<button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((item) => item !== value))}><X size={13} /></button></span>)}
      </div>
      <div className="admin-chip-add">
        <input id={id} value={entry} maxLength={60} onKeyDown={onKeyDown} onChange={(event) => setEntry(event.target.value)} aria-label={`Add ${label.toLowerCase()}`} />
        <button className="button button-light" type="button" onClick={add}><Plus size={14} /> Add</button>
      </div>
    </fieldset>
  )
}
