import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useAuth } from '../contexts/AuthContext'
import {
  formatProfileDate,
  formatProfileValue,
  formatRoleLabel,
  profileDisplayName,
  profileRoleName,
} from '../lib/supabase'
import './dashboards/Dashboard.css'

function ProfileRow({ label, value }: { label: string; value: string }) {
  const empty = value === '—'
  return (
    <IonItem lines="full">
      <IonLabel>
        <p>{label}</p>
        <IonText color={empty ? 'medium' : undefined}>
          <h2 className={empty ? 'profile-value-empty' : undefined}>{value}</h2>
        </IonText>
      </IonLabel>
    </IonItem>
  )
}

export default function ProfilePage() {
  const { profile, profileLoading, refreshProfile, signOut } = useAuth()

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher
          slot="fixed"
          onIonRefresh={(e) => {
            void refreshProfile().finally(() => e.detail.complete())
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        {profileLoading && !profile && (
          <div className="ion-padding ion-text-center">
            <IonText color="medium">Loading profile…</IonText>
          </div>
        )}

        {!profileLoading && !profile && (
          <div className="ion-padding ion-text-center">
            <IonText color="medium">Could not load your profile.</IonText>
          </div>
        )}

        {profile && (
          <>
            <IonListHeader>
              <IonLabel>{profileDisplayName(profile)}</IonLabel>
            </IonListHeader>
            <IonList inset>
              <ProfileRow label="Role" value={formatRoleLabel(profileRoleName(profile))} />
              <ProfileRow label="Status" value={formatProfileValue(profile.status) || 'Active'} />
              <ProfileRow label="Email" value={formatProfileValue(profile.personal_email)} />
            </IonList>

            <div className="profile-section-title">Personal</div>
            <IonList inset>
              <ProfileRow label="Suffix" value={formatProfileValue(profile.suffix)} />
              <ProfileRow label="Age" value={formatProfileValue(profile.age)} />
              <ProfileRow label="Gender" value={formatProfileValue(profile.gender)} />
              <ProfileRow label="Birthdate" value={formatProfileDate(profile.birthdate)} />
              <ProfileRow label="Nationality" value={formatProfileValue(profile.nationality)} />
              <ProfileRow
                label="Place of birth"
                value={formatProfileValue(profile.place_of_birth)}
              />
              <ProfileRow
                label="Permanent address"
                value={formatProfileValue(profile.permanent_address)}
              />
            </IonList>

            <div className="profile-section-title">Contact</div>
            <IonList inset>
              <ProfileRow label="Phone" value={formatProfileValue(profile.phone_number)} />
              <ProfileRow
                label="Emergency contact"
                value={formatProfileValue(profile.emergency_contact_name)}
              />
              <ProfileRow
                label="Emergency number"
                value={formatProfileValue(profile.emergency_contact_number)}
              />
            </IonList>

            <div className="ion-padding">
              <IonButton expand="block" color="medium" onClick={() => void signOut()}>
                Sign out
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
