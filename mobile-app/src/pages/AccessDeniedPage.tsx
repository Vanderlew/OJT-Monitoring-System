import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useAuth } from '../contexts/AuthContext'
import { formatRoleLabel, profileRoleName } from '../lib/supabase'

export default function AccessDeniedPage() {
  const { profile, signOut } = useAuth()
  const role = formatRoleLabel(profileRoleName(profile))

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Access denied</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ion-text-center access-denied">
        <h2>Wrong portal</h2>
        <IonText color="medium">
          <p>
            This app is for students, coordinators, and supervisors. Your role is{' '}
            <strong>{role}</strong>. Please use the admin web portal instead.
          </p>
        </IonText>
        <IonButton expand="block" onClick={() => void signOut()}>
          Sign out
        </IonButton>
      </IonContent>
    </IonPage>
  )
}
