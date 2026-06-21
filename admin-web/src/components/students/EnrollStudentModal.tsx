import { useEffect, useState, type FormEvent } from 'react'
import {
  assignStudentCoordinator,
  coordinatorOptionLabel,
  fetchCoordinators,
  studentListDisplayName,
  type CoordinatorOption,
  type StudentListItem,
} from '../../lib/students'
import {
  fetchActiveSchoolYear,
  formatSchoolYearLabel,
  type SchoolYear,
} from '../../lib/schoolYears'

type EnrollStudentModalProps = {
  student: StudentListItem | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EnrollStudentModal({ student, open, onClose, onSuccess }: EnrollStudentModalProps) {
  const [coordinators, setCoordinators] = useState<CoordinatorOption[]>([])
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null)
  const [coordinatorId, setCoordinatorId] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !student) return

    setCoordinatorId('')
    setError(null)
    setOptionsError(null)
    setLoadingOptions(true)

    void Promise.all([fetchCoordinators(), fetchActiveSchoolYear()]).then(
      ([coordinatorsResult, schoolYearResult]) => {
        setLoadingOptions(false)

        if (coordinatorsResult.error) {
          setOptionsError(coordinatorsResult.error)
          setCoordinators([])
        } else {
          setCoordinators(coordinatorsResult.coordinators)
          if (coordinatorsResult.coordinators.length > 0) {
            setCoordinatorId(String(coordinatorsResult.coordinators[0].id))
          }
        }

        if (schoolYearResult.error) {
          setOptionsError((prev) => prev ?? schoolYearResult.error)
          setSchoolYear(null)
        } else {
          setSchoolYear(schoolYearResult.schoolYear)
          if (!schoolYearResult.schoolYear) {
            setOptionsError((prev) => prev ?? 'No active school year found. Add one in School Year first.')
          }
        }
      },
    )
  }, [open, student])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, submitting])

  if (!open || !student) return null

  const enrollStudent = student

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const parsedCoordinatorId = Number(coordinatorId)
    if (!parsedCoordinatorId) {
      setError('Please select a coordinator.')
      return
    }

    if (!schoolYear) {
      setError('No active school year is available for enrollment.')
      return
    }

    setSubmitting(true)

    const { error: assignError } = await assignStudentCoordinator({
      studentId: enrollStudent.id,
      coordinatorId: parsedCoordinatorId,
      schoolYearId: schoolYear.id,
    })

    setSubmitting(false)

    if (assignError) {
      setError(assignError)
      return
    }

    onSuccess()
    onClose()
  }

  const schoolYearLabel = schoolYear
    ? formatSchoolYearLabel(schoolYear.start_date, schoolYear.end_date)
    : '—'

  return (
    <div className="modal-overlay modal-overlay--enter enroll-modal-overlay" onClick={() => !submitting && onClose()}>
      <div
        className="modal-dialog modal-dialog--enter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enroll-student-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="enroll-student-title">Enroll student</h3>
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

        <p className="enroll-student-name">
          Assign <strong>{studentListDisplayName(student)}</strong> to a coordinator.
        </p>

        {optionsError && (
          <div className="alert alert-warning" role="alert">
            {optionsError}
          </div>
        )}

        <form className="modal-form" onSubmit={(e) => void handleSubmit(e)}>
          <label htmlFor="enroll-school-year">School year</label>
          <output id="enroll-school-year" className="school-year-end-preview">
            {loadingOptions ? 'Loading…' : schoolYearLabel}
          </output>
          <p className="school-year-end-hint">Uses the current active school year.</p>

          <label htmlFor="enroll-coordinator">Coordinator</label>
          <select
            id="enroll-coordinator"
            value={coordinatorId}
            onChange={(e) => setCoordinatorId(e.target.value)}
            required
            disabled={submitting || loadingOptions || coordinators.length === 0}
          >
            {loadingOptions && <option value="">Loading coordinators…</option>}
            {!loadingOptions && coordinators.length === 0 && (
              <option value="">No coordinators available</option>
            )}
            {!loadingOptions &&
              coordinators.map((coordinator) => (
                <option key={coordinator.id} value={coordinator.id}>
                  {coordinatorOptionLabel(coordinator)}
                </option>
              ))}
          </select>

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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                submitting ||
                loadingOptions ||
                coordinators.length === 0 ||
                !schoolYear
              }
            >
              {submitting ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
