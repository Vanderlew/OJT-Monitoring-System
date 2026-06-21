import { IonBadge, IonIcon, IonItem, IonLabel, IonList, IonSpinner, IonText } from '@ionic/react'
import { peopleOutline } from 'ionicons/icons'
import type { AssignedStudent } from '../../lib/coordinatorStudents'

type AssignedStudentsListProps = {
  students: AssignedStudent[]
  loading: boolean
  error: string | null
}

export function AssignedStudentsList({ students, loading, error }: AssignedStudentsListProps) {
  return (
    <section className="coordinator-assigned">
      <div className="coordinator-assigned-header">
        <div className="coordinator-assigned-title">
          <IonIcon icon={peopleOutline} className="coordinator-assigned-icon" aria-hidden="true" />
          <h3>Assigned Students</h3>
        </div>
        {!loading && !error && (
          <IonBadge className="coordinator-assigned-count">{students.length}</IonBadge>
        )}
      </div>

      {loading && (
        <div className="coordinator-assigned-state">
          <IonSpinner name="crescent" />
          <p>Loading assigned students…</p>
        </div>
      )}

      {!loading && error && (
        <div className="coordinator-assigned-state coordinator-assigned-state--error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="coordinator-assigned-state">
          <p>No students assigned yet.</p>
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <IonList inset className="coordinator-assigned-list">
          {students.map((student, index) => (
            <IonItem
              key={student.assignmentId}
              lines={index < students.length - 1 ? 'full' : 'none'}
              button={false}
            >
              <IonLabel>
                <h3>{student.name}</h3>
                <IonText color="medium">
                  <p className="coordinator-assigned-email">
                    {student.email ?? '—'}
                  </p>
                </IonText>
              </IonLabel>
              <IonText slot="end" color="medium" className="coordinator-assigned-year">
                {student.schoolYearLabel}
              </IonText>
            </IonItem>
          ))}
        </IonList>
      )}
    </section>
  )
}
