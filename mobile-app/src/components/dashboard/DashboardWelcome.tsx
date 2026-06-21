import { IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/react'
import type { Profile } from '../../lib/supabase'
import { formatRoleLabel, profileFirstLastName, profileRoleName } from '../../lib/supabase'

type DashboardWelcomeProps = {
  profile: Profile | null
  profileLoading: boolean
  subtitle: string
}

export function DashboardWelcome({ profile, profileLoading, subtitle }: DashboardWelcomeProps) {
  const displayName = profileLoading
    ? 'Loading…'
    : profile
      ? profileFirstLastName(profile)
      : 'User'

  const roleName = profileRoleName(profile)

  return (
    <IonCard className="dashboard-welcome-card">
      <IonCardHeader>
        <IonCardSubtitle>Welcome back</IonCardSubtitle>
        <IonCardTitle>{displayName}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {roleName && (
          <IonBadge color="primary" className="dashboard-role-badge">
            {formatRoleLabel(roleName)}
          </IonBadge>
        )}
        <p className="dashboard-message">{subtitle}</p>
      </IonCardContent>
    </IonCard>
  )
}
