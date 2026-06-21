import { useEffect } from 'react'
import type { Profile } from '../../lib/supabase'
import { studentListDisplayName, type StudentListItem } from '../../lib/students'
import { ProfileDetails } from '../ProfileDetails'

type StudentDetailsModalProps = {
  student: StudentListItem | null
  profile: Profile | null
  loading: boolean
  onClose: () => void
  onEnroll: () => void
}

export function StudentDetailsModal({
  student,
  profile,
  loading,
  onClose,
  onEnroll,
}: StudentDetailsModalProps) {
  const open = student !== null

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !student) return null

  const isPending = student.enrollmentStatus === 'pending'

  return (
    <div className="modal-overlay modal-overlay--enter" onClick={onClose}>
      <div
        className="modal-dialog modal-dialog-lg users-details-modal modal-dialog--enter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="users-detail-header users-details-modal-header">
          <div>
            <h3 id="student-details-title">{studentListDisplayName(student)}</h3>
            <p className="users-detail-subtitle">{student.personal_email ?? '—'}</p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="users-details-modal-body">
          <section className="detail-section students-enrollment-section">
            <h3>Enrollment</h3>
            <dl className="detail-grid">
              <div className="detail-row">
                <dt>Status</dt>
                <dd>
                  <span className={`status-pill${isPending ? ' status-pending' : ' status-ok'}`}>
                    {isPending ? 'Pending' : 'Enrolled'}
                  </span>
                </dd>
              </div>
              <div className="detail-row">
                <dt>Coordinator</dt>
                <dd>{student.coordinatorName ?? '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>School year</dt>
                <dd>{student.schoolYearLabel ?? '—'}</dd>
              </div>
            </dl>
          </section>

          {loading && <p className="users-detail-empty">Loading student details…</p>}

          {!loading && profile && (
            <div className="users-detail-content users-detail-content--enter">
              <ProfileDetails profile={profile} />
            </div>
          )}

          {!loading && !profile && (
            <p className="users-detail-empty">Could not load student details.</p>
          )}
        </div>

        {isPending && (
          <footer className="students-details-footer">
            <button type="button" className="btn btn-primary" onClick={onEnroll}>
              Enroll
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}
