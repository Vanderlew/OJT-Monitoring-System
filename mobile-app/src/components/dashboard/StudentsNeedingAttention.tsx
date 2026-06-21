import { IonBadge, IonIcon, IonItem, IonLabel, IonList, IonNote, IonText } from '@ionic/react'
import { warningOutline } from 'ionicons/icons'

export type AttentionStudent = {
  name: string
  detail: string
  status: 'urgent' | 'follow-up'
}

type StudentsNeedingAttentionProps = {
  students: AttentionStudent[]
}

function statusLabel(status: AttentionStudent['status']): string {
  return status === 'urgent' ? 'Urgent' : 'Follow up'
}

export function StudentsNeedingAttention({ students }: StudentsNeedingAttentionProps) {
  return (
    <section className="coordinator-attention">
      <div className="coordinator-attention-header">
        <div className="coordinator-attention-title">
          <IonIcon icon={warningOutline} className="coordinator-attention-icon" aria-hidden="true" />
          <h3>Students Needing Attention</h3>
        </div>
        <IonBadge className="coordinator-attention-count">{students.length}</IonBadge>
      </div>

      <IonList inset className="coordinator-attention-list">
        {students.map((student, index) => (
          <IonItem
            key={student.name}
            lines={index < students.length - 1 ? 'full' : 'none'}
            button={false}
          >
            <IonLabel>
              <h3>{student.name}</h3>
              <IonText color="medium">
                <p>{student.detail}</p>
              </IonText>
            </IonLabel>
            <IonNote slot="end">
              <span className={`coordinator-attention-badge coordinator-attention-badge--${student.status}`}>
                {statusLabel(student.status)}
              </span>
            </IonNote>
          </IonItem>
        ))}
      </IonList>
    </section>
  )
}
