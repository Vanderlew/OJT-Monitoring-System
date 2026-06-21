import {
  businessOutline,
  checkmarkDoneOutline,
  peopleOutline,
  starOutline,
} from 'ionicons/icons'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardHighlight } from '../../components/dashboard/DashboardHighlight'
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { DashboardStatGrid } from '../../components/dashboard/DashboardStatGrid'
import { DashboardWelcome } from '../../components/dashboard/DashboardWelcome'
import './Dashboard.css'

export default function SupervisorDashboard() {
  const { profile, profileLoading, refreshProfile } = useAuth()

  return (
    <DashboardShell title="Supervisor" onRefresh={refreshProfile}>
      <DashboardWelcome
        profile={profile}
        profileLoading={profileLoading}
        subtitle="Oversee trainees on site, verify attendance, and complete evaluations."
      />

      <DashboardStatGrid
        stats={[
          { label: 'On site', value: '—', hint: 'Students' },
          { label: 'Pending', value: '—', hint: 'Evaluations' },
          { label: 'Today', value: '—', hint: 'Attendance' },
        ]}
      />

      <DashboardHighlight title="Site overview">
        <p>
          Trainees assigned to your company and their daily attendance will be shown here once
          supervisor features are connected.
        </p>
      </DashboardHighlight>

      <DashboardQuickActions
        title="Quick actions"
        actions={[
          {
            title: 'Site roster',
            description: 'View trainees currently under your supervision',
            icon: peopleOutline,
            comingSoon: true,
          },
          {
            title: 'Review attendance',
            description: 'Confirm student time-in and time-out records',
            icon: checkmarkDoneOutline,
            comingSoon: true,
          },
          {
            title: 'Evaluate trainee',
            description: 'Submit performance feedback and ratings',
            icon: starOutline,
            comingSoon: true,
          },
          {
            title: 'Company profile',
            description: 'View your organization and partnership details',
            icon: businessOutline,
            comingSoon: true,
          },
        ]}
      />
    </DashboardShell>
  )
}
