import { useCallback, useEffect, useState } from 'react'
import {
  fetchSchoolYears,
  formatSchoolYearLabel,
  formatSchoolYearValue,
  type SchoolYear,
} from '../../lib/schoolYears'
import { AddSchoolYearModal } from './AddSchoolYearModal'
import '../users/UsersPanel.css'
import './SchoolYearsPanel.css'

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`status-pill${isActive ? ' status-ok' : ' status-disabled'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export function SchoolYearsPanel() {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const loadSchoolYears = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await fetchSchoolYears()

    if (result.error) {
      setError(result.error)
      setSchoolYears([])
    } else {
      setSchoolYears(result.schoolYears)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadSchoolYears()
  }, [loadSchoolYears])

  return (
    <div className="school-years-panel users-panel">
      <div className="users-toolbar">
        <p className="school-years-summary">
          {loading
            ? 'Loading school years…'
            : schoolYears.length === 0
              ? 'No school years yet'
              : `${schoolYears.length} school year${schoolYears.length === 1 ? '' : 's'}`}
        </p>

        <button type="button" className="users-add-btn" onClick={() => setAddModalOpen(true)}>
          <span className="users-add-btn-icon" aria-hidden="true">+</span>
          Add school year
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>School year</th>
              <th>Start year</th>
              <th>End year</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="users-table-empty">Loading school years…</td>
              </tr>
            )}

            {!loading && schoolYears.length === 0 && (
              <tr>
                <td colSpan={4} className="users-table-empty">No school years found.</td>
              </tr>
            )}

            {!loading &&
              schoolYears.map((schoolYear) => (
                <tr key={schoolYear.id}>
                  <td>{formatSchoolYearLabel(schoolYear.start_date, schoolYear.end_date)}</td>
                  <td>{formatSchoolYearValue(schoolYear.start_date)}</td>
                  <td>{formatSchoolYearValue(schoolYear.end_date)}</td>
                  <td>
                    <ActiveBadge isActive={schoolYear.is_active} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <AddSchoolYearModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => void loadSchoolYears()}
      />
    </div>
  )
}
