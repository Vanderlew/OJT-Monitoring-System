import {
  IonCard,
  IonCardContent,
  IonCol,
  IonGrid,
  IonIcon,
  IonRow,
} from '@ionic/react'
import type { ComponentProps } from 'react'

export type CoordinatorStat = {
  label: string
  value: string | number
  icon: ComponentProps<typeof IonIcon>['icon']
  tone: 'blue' | 'green' | 'purple' | 'orange'
}

type CoordinatorStatGridProps = {
  stats: CoordinatorStat[]
}

export function CoordinatorStatGrid({ stats }: CoordinatorStatGridProps) {
  return (
    <IonGrid className="coordinator-stat-grid">
      <IonRow>
        {stats.map((stat) => (
          <IonCol key={stat.label} size="6">
            <IonCard className={`coordinator-stat-card coordinator-stat-card--${stat.tone}`}>
              <IonCardContent>
                <IonIcon icon={stat.icon} className="coordinator-stat-icon" aria-hidden="true" />
                <p className="coordinator-stat-value">{stat.value}</p>
                <p className="coordinator-stat-label">{stat.label}</p>
              </IonCardContent>
            </IonCard>
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  )
}
