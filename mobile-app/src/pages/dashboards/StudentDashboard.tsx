import {
  calendarOutline,
  documentTextOutline,
  logInOutline,
  statsChartOutline,
  timeOutline,
} from 'ionicons/icons'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardHighlight } from '../../components/dashboard/DashboardHighlight'
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { DashboardStatGrid } from '../../components/dashboard/DashboardStatGrid'
import { DashboardWelcome } from '../../components/dashboard/DashboardWelcome'
import './Dashboard.css'

export default function StudentDashboard() {
  const { profile, profileLoading, refreshProfile } = useAuth()

  return (
    <DashboardShell title="My OJT" onRefresh={refreshProfile}>
      <DashboardWelcome
        profile={profile}
        profileLoading={profileLoading}
        subtitle="Track your attendance, daily logs, and OJT progress from here."
      />

      <DashboardStatGrid
        stats={[
          { label: 'Hours', value: '—', hint: 'This week' },
          { label: 'Present', value: '—', hint: 'This week' },
          { label: 'Logs', value: '—', hint: 'Submitted' },
        ]}
      />

      <DashboardHighlight title="Today">
        <p>No time-in recorded yet. Use Time in when you arrive at your OJT site.</p>
      </DashboardHighlight>

      <DashboardQuickActions
        title="Quick actions"
        actions={[
          {
            title: 'Time in',
            description: 'Record your arrival at the OJT site',
            icon: logInOutline,
            comingSoon: true,
          },
          {
            title: 'Daily log',
            description: 'Submit what you worked on today',
            icon: documentTextOutline,
            comingSoon: true,
          },
          {
            title: 'My progress',
            description: 'View required hours and completion status',
            icon: statsChartOutline,
            comingSoon: true,
          },
          {
            title: 'Schedule',
            description: 'See your OJT calendar and deadlines',
            icon: calendarOutline,
            comingSoon: true,
          },
          {
            title: 'Time out',
            description: 'Record your departure for the day',
            icon: timeOutline,
            comingSoon: true,
          },
        ]}
      />
    </DashboardShell>
  )
}
