import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  checkmarkCircleOutline,
  clipboardOutline,
  documentTextOutline,
  peopleOutline,
  statsChartOutline,
} from 'ionicons/icons'
import { CoordinatorStatGrid } from '../../components/dashboard/CoordinatorStatGrid'
import { DashboardHighlight } from '../../components/dashboard/DashboardHighlight'
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { DashboardWelcome } from '../../components/dashboard/DashboardWelcome'
import { StudentsNeedingAttention } from '../../components/dashboard/StudentsNeedingAttention'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCoordinatorAssignedStudents } from '../../lib/coordinatorStudents'
import './Dashboard.css'

const PLACEHOLDER_ATTENTION = [
  {
    name: 'Maria Santos',
    detail: '3 missing logs',
    status: 'urgent' as const,
  },
  {
    name: 'James Cruz',
    detail: 'Absent for 2 days',
    status: 'follow-up' as const,
  },
  {
    name: 'Ana Reyes',
    detail: 'Late submission',
    status: 'follow-up' as const,
  },
]

export default function CoordinatorDashboard() {
  const history = useHistory()
  const { profile, profileLoading, refreshProfile } = useAuth()
  const [assignedCount, setAssignedCount] = useState<number | null>(null)

  const loadAssignedCount = useCallback(async () => {
    if (!profile?.id) {
      setAssignedCount(0)
      return
    }

    const result = await fetchCoordinatorAssignedStudents(profile.id)
    setAssignedCount(result.error ? 0 : result.students.length)
  }, [profile?.id])

  useEffect(() => {
    if (profileLoading) return
    void loadAssignedCount()
  }, [profileLoading, loadAssignedCount])

  async function handleRefresh() {
    await refreshProfile()
    await loadAssignedCount()
  }

  return (
    <DashboardShell title="Coordinator" onRefresh={handleRefresh}>
      <DashboardWelcome
        profile={profile}
        profileLoading={profileLoading}
        subtitle="Monitor student OJT activity, attendance, and submissions for your area."
      />

      <CoordinatorStatGrid
        stats={[
          {
            label: 'Assigned Students',
            value: assignedCount ?? '—',
            icon: peopleOutline,
            tone: 'blue',
          },
          {
            label: 'Present Today',
            value: 40,
            icon: checkmarkCircleOutline,
            tone: 'green',
          },
          {
            label: 'Logs to Review',
            value: 8,
            icon: clipboardOutline,
            tone: 'purple',
          },
          {
            label: 'Pending Evaluations',
            value: 3,
            icon: documentTextOutline,
            tone: 'orange',
          },
        ]}
      />

      <StudentsNeedingAttention students={PLACEHOLDER_ATTENTION} />

      <DashboardHighlight title="Overview">
        <p>
          Attendance summaries and pending log reviews will appear here once those features
          are connected.
        </p>
      </DashboardHighlight>

      <DashboardQuickActions
        title="Quick actions"
        actions={[
          {
            title: 'Student list',
            description: 'View students assigned to you',
            icon: peopleOutline,
            onClick: () => history.push('/app/students'),
          },
          {
            title: 'Attendance',
            description: 'Review daily time-in and time-out records',
            icon: checkmarkCircleOutline,
            comingSoon: true,
          },
          {
            title: 'Pending reviews',
            description: 'Approve or return student daily logs',
            icon: clipboardOutline,
            comingSoon: true,
          },
          {
            title: 'Reports',
            description: 'Export OJT progress and attendance summaries',
            icon: statsChartOutline,
            comingSoon: true,
          },
        ]}
      />
    </DashboardShell>
  )
}
