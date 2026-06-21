import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText } from '@ionic/react'
import type { ReactNode } from 'react'

type DashboardHighlightProps = {
  title: string
  children: ReactNode
}

export function DashboardHighlight({ title, children }: DashboardHighlightProps) {
  return (
    <IonCard className="dashboard-highlight-card">
      <IonCardHeader>
        <IonCardTitle>{title}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonText color="medium">{children}</IonText>
      </IonCardContent>
    </IonCard>
  )
}
