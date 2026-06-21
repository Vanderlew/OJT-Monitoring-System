import { useCallback, useEffect, useState } from 'react'
import { fetchUserProfile } from '../../lib/users'
import type { Profile } from '../../lib/supabase'
import {
  fetchStudents,
  studentListDisplayName,
  STUDENTS_PAGE_SIZE,
  type StudentFilter,
  type StudentListItem,
} from '../../lib/students'
import { EnrollStudentModal } from './EnrollStudentModal'
import { StudentDetailsModal } from './StudentDetailsModal'
import '../users/UsersPanel.css'
import './StudentsPanel.css'

const STUDENT_FILTERS: { id: StudentFilter; label: string }[] = [
  { id: 'all', label: 'All Students' },
  { id: 'enrolled', label: 'Enrolled Students' },
  { id: 'pending', label: 'Pending Students' },
]

function EnrollmentBadge({ status }: { status: StudentListItem['enrollmentStatus'] }) {
  return (
    <span className={`status-pill${status === 'enrolled' ? ' status-ok' : ' status-pending'}`}>
      {status === 'enrolled' ? 'Enrolled' : 'Pending'}
    </span>
  )
}

export function StudentsPanel() {
  const [filter, setFilter] = useState<StudentFilter>('all')
  const [page, setPage] = useState(1)
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / STUDENTS_PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : (page - 1) * STUDENTS_PAGE_SIZE + 1
  const rangeEnd = Math.min(page * STUDENTS_PAGE_SIZE, total)

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await fetchStudents(page, filter)

    if (result.error) {
      setError(result.error)
      setStudents([])
      setTotal(0)
    } else {
      setStudents(result.students)
      setTotal(result.total)
    }

    setLoading(false)
  }, [page, filter])

  const loadSelectedProfile = useCallback(async (profileId: number) => {
    setDetailLoading(true)

    const result = await fetchUserProfile(profileId)

    if (result.error) {
      setActionError(result.error)
      setSelectedProfile(null)
    } else {
      setSelectedProfile(result.profile)
    }

    setDetailLoading(false)
  }, [])

  useEffect(() => {
    void loadStudents()
  }, [loadStudents])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (loading || selectedStudentId === null) return

    const updated = students.find((student) => student.id === selectedStudentId) ?? null
    if (updated) {
      setSelectedStudent(updated)
    } else if (!showEnrollModal) {
      setSelectedStudentId(null)
      setSelectedStudent(null)
      setSelectedProfile(null)
      setShowDetails(false)
    }
  }, [loading, students, selectedStudentId, showEnrollModal])

  function handleFilterChange(nextFilter: StudentFilter) {
    setFilter(nextFilter)
    setPage(1)
    setError(null)
    setActionError(null)
    closeDetails()
  }

  function closeDetails() {
    setShowDetails(false)
    setSelectedStudentId(null)
    setSelectedStudent(null)
    setSelectedProfile(null)
    setShowEnrollModal(false)
  }

  function handleViewDetails(student: StudentListItem) {
    setActionError(null)
    setSelectedStudentId(student.id)
    setSelectedStudent(student)
    setShowDetails(true)
    setSelectedProfile(null)
    void loadSelectedProfile(student.id)
  }

  async function handleEnrollSuccess() {
    setActionError(null)
    await loadStudents()
    if (selectedStudentId !== null) {
      void loadSelectedProfile(selectedStudentId)
    }
  }

  return (
    <div className="students-panel users-panel">
      <div className="users-toolbar">
        <nav className="users-filters" aria-label="Filter students">
          {STUDENT_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`users-filter-btn${filter === item.id ? ' is-active' : ''}`}
              onClick={() => handleFilterChange(item.id)}
              aria-current={filter === item.id ? 'true' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {actionError && (
        <div className="alert alert-error" role="alert">
          {actionError}
        </div>
      )}

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Enrollment</th>
              <th>Coordinator</th>
              <th>School year</th>
              <th className="users-table-actions-col">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="users-table-empty">Loading students…</td>
              </tr>
            )}

            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={6} className="users-table-empty">No students found.</td>
              </tr>
            )}

            {!loading &&
              students.map((student) => (
                <tr
                  key={student.id}
                  className={selectedStudentId === student.id && showDetails ? 'is-selected' : undefined}
                >
                  <td>{studentListDisplayName(student)}</td>
                  <td>{student.personal_email ?? '—'}</td>
                  <td>
                    <EnrollmentBadge status={student.enrollmentStatus} />
                  </td>
                  <td>{student.coordinatorName ?? '—'}</td>
                  <td>{student.schoolYearLabel ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="users-view-details-btn"
                      onClick={() => handleViewDetails(student)}
                      aria-expanded={showDetails && selectedStudentId === student.id}
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <footer className="users-pagination">
        <p className="users-pagination-summary">
          {total === 0
            ? 'No students to display'
            : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </p>

        <div className="users-pagination-controls">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            Previous
          </button>
          <span className="users-pagination-page">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || page >= totalPages}
          >
            Next
          </button>
        </div>
      </footer>

      {showDetails && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          profile={selectedProfile}
          loading={detailLoading}
          onClose={closeDetails}
          onEnroll={() => setShowEnrollModal(true)}
        />
      )}

      <EnrollStudentModal
        student={selectedStudent}
        open={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        onSuccess={() => void handleEnrollSuccess()}
      />
    </div>
  )
}
