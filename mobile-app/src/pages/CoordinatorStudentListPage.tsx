import { useCallback, useEffect, useState } from 'react'
import { Redirect } from 'react-router-dom'
import { AssignedStudentsList } from '../components/dashboard/AssignedStudentsList'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { useAuth } from '../contexts/AuthContext'
import { profileRoleName } from '../lib/supabase'
import {
  fetchCoordinatorAssignedStudents,
  type AssignedStudent,
} from '../lib/coordinatorStudents'
import './dashboards/Dashboard.css'

export default function CoordinatorStudentListPage() {
  const { profile, profileLoading, refreshProfile } = useAuth()
  const [students, setStudents] = useState<AssignedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const role = profileRoleName(profile)

  const loadStudents = useCallback(async () => {
    if (!profile?.id) {
      setStudents([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const result = await fetchCoordinatorAssignedStudents(profile.id)

    if (result.error) {
      setError(result.error)
      setStudents([])
    } else {
      setStudents(result.students)
    }

    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    if (profileLoading) return
    void loadStudents()
  }, [profileLoading, loadStudents])

  async function handleRefresh() {
    await refreshProfile()
    await loadStudents()
  }

  if (!profileLoading && role !== 'coordinator') {
    return <Redirect to="/app/home" />
  }

  return (
    <DashboardShell title="Student list" backHref="/app/home" onRefresh={handleRefresh}>
      <AssignedStudentsList
        students={students}
        loading={loading || profileLoading}
        error={error}
      />
    </DashboardShell>
  )
}
