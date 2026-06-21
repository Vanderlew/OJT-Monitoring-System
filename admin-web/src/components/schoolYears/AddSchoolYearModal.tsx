import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createSchoolYear, getSchoolYearEndYear } from '../../lib/schoolYears'

type AddSchoolYearModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddSchoolYearModal({ open, onClose, onSuccess }: AddSchoolYearModalProps) {
  const [startYear, setStartYear] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const trimmedStartYear = startYear.trim()
  const showEndYear = /^\d{4}$/.test(trimmedStartYear)
  const endYear = useMemo(() => {
    if (!showEndYear) return null
    const parsed = Number(trimmedStartYear)
    if (!Number.isInteger(parsed)) return null
    return getSchoolYearEndYear(parsed)
  }, [showEndYear, trimmedStartYear])

  useEffect(() => {
    if (!open) return

    setStartYear('')
    setIsActive(true)
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, submitting])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: createError } = await createSchoolYear({
      startYear: Number(startYear),
      isActive,
    })

    setSubmitting(false)

    if (createError) {
      setError(createError)
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-school-year-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="add-school-year-title">Add school year</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form className="modal-form" onSubmit={(e) => void handleSubmit(e)}>
          <label htmlFor="add-school-year-start">Start year</label>
          <input
            id="add-school-year-start"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            step={1}
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="e.g. 2026"
            required
            disabled={submitting}
            autoComplete="off"
          />

          {showEndYear && (
            <>
              <label htmlFor="add-school-year-end">End year</label>
              <output id="add-school-year-end" className="school-year-end-preview" htmlFor="add-school-year-start">
                {endYear}
              </output>
              <p className="school-year-end-hint">Automatically set to the next year.</p>
            </>
          )}

          <label className="modal-checkbox-label" htmlFor="add-school-year-active">
            <input
              id="add-school-year-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={submitting}
            />
            Set as active school year
          </label>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add school year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
