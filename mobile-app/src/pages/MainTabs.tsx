import { Redirect, Route } from 'react-router-dom'
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react'
import { grid, person } from 'ionicons/icons'
import RoleDashboard from './dashboards/RoleDashboard'
import CoordinatorStudentListPage from './CoordinatorStudentListPage'
import ProfilePage from './ProfilePage'

export default function MainTabs() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/app/home" component={RoleDashboard} exact />
        <Route path="/app/students" component={CoordinatorStudentListPage} exact />
        <Route path="/app/profile" component={ProfilePage} exact />
        <Route exact path="/app">
          <Redirect to="/app/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/app/home">
          <IonIcon icon={grid} />
          <IonLabel>Dashboard</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/app/profile">
          <IonIcon icon={person} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  )
}
