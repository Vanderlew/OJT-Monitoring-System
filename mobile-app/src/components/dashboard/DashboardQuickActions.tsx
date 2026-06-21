import { IonIcon, IonItem, IonLabel, IonList, IonNote, IonText } from '@ionic/react'
import type { ComponentProps } from 'react'

export type DashboardAction = {
  title: string
  description: string
  icon: ComponentProps<typeof IonIcon>['icon']
  comingSoon?: boolean
  onClick?: () => void
}

type DashboardQuickActionsProps = {
  title: string
  actions: DashboardAction[]
}

export function DashboardQuickActions({ title, actions }: DashboardQuickActionsProps) {
  return (
    <>
      <h2 className="dashboard-section-title">{title}</h2>
      <IonList inset className="dashboard-action-list">
        {actions.map((action) => (
          <IonItem
            key={action.title}
            lines="full"
            button={!action.comingSoon}
            disabled={action.comingSoon}
            onClick={action.comingSoon ? undefined : action.onClick}
          >
            <IonIcon icon={action.icon} slot="start" color="primary" />
            <IonLabel>
              <h3>{action.title}</h3>
              <IonText color="medium">
                <p>{action.description}</p>
              </IonText>
            </IonLabel>
            {action.comingSoon && <IonNote slot="end">Soon</IonNote>}
          </IonItem>
        ))}
      </IonList>
    </>
  )
}
