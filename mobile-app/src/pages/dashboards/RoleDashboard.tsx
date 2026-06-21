import { IonContent, IonPage, IonSpinner, IonText } from '@ionic/react'
import { useAuth } from '../../contexts/AuthContext'
import { profileRoleName } from '../../lib/supabase'
import CoordinatorDashboard from './CoordinatorDashboard'
import StudentDashboard from './StudentDashboard'
import SupervisorDashboard from './SupervisorDashboard'
import './Dashboard.css'

function DashboardLoadingState({ message }: { message: string }) {
  return (
    <IonPage>
      <IonContent className="ion-padding dashboard-loading">
        <IonSpinner name="crescent" />
        <IonText color="medium">
          <p>{message}</p>
        </IonText>
      </IonContent>
    </IonPage>
  )
}

export default function RoleDashboard() {
  const { profile, profileLoading } = useAuth()
  const role = profileRoleName(profile)

  if (profileLoading && !profile) {
    return <DashboardLoadingState message="Loading your dashboard…" />
  }

  if (role === 'student') {
    return <StudentDashboard />
  }

  if (role === 'coordinator') {
    return <CoordinatorDashboard />
  }

  if (role === 'supervisor') {
    return <SupervisorDashboard />
  }

  return <DashboardLoadingState message="Could not determine your role. Please sign out and try again." />
}
