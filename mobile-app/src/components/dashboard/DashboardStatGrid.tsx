import { IonCard, IonCardContent, IonCol, IonGrid, IonRow, IonText } from '@ionic/react'

export type DashboardStat = {
  label: string
  value: string
  hint?: string
}

type DashboardStatGridProps = {
  stats: DashboardStat[]
}

export function DashboardStatGrid({ stats }: DashboardStatGridProps) {
  return (
    <IonGrid className="dashboard-stat-grid">
      <IonRow>
        {stats.map((stat) => (
          <IonCol key={stat.label} size="4">
            <IonCard className="dashboard-stat-card">
              <IonCardContent>
                <IonText color="medium">
                  <p className="dashboard-stat-label">{stat.label}</p>
                </IonText>
                <p className="dashboard-stat-value">{stat.value}</p>
                {stat.hint && (
                  <IonText color="medium">
                    <p className="dashboard-stat-hint">{stat.hint}</p>
                  </IonText>
                )}
              </IonCardContent>
            </IonCard>
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  )
}
