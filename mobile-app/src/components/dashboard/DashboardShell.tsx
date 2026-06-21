import type { ReactNode } from 'react'
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/react'

type DashboardShellProps = {
  title: string
  onRefresh?: () => Promise<void>
  backHref?: string
  children: ReactNode
}

export function DashboardShell({ title, onRefresh, backHref, children }: DashboardShellProps) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {backHref && (
            <IonButtons slot="start">
              <IonBackButton defaultHref={backHref} text="" />
            </IonButtons>
          )}
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding dashboard-content">
        {onRefresh && (
          <IonRefresher
            slot="fixed"
            onIonRefresh={(e) => {
              void onRefresh().finally(() => e.detail.complete())
            }}
          >
            <IonRefresherContent />
          </IonRefresher>
        )}

        {children}
      </IonContent>
    </IonPage>
  )
}
