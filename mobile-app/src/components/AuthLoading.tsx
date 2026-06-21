import { IonContent, IonPage, IonSpinner } from '@ionic/react'

export function AuthLoading() {
  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center auth-loading">
        <IonSpinner name="crescent" />
        <p>Loading…</p>
      </IonContent>
    </IonPage>
  )
}
