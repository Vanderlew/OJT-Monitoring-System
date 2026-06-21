import { Route } from 'react-router-dom'
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedMainTabs } from './components/ProtectedRoute'
import RootRedirect from './components/RootRedirect'
import LoginPage from './pages/LoginPage'
import AccessDeniedPage from './pages/AccessDeniedPage'

import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'
import '@ionic/react/css/palettes/dark.system.css'

import './theme/variables.css'

setupIonicReact()

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/login" component={LoginPage} exact />
          <Route path="/access-denied" component={AccessDeniedPage} exact />
          <Route path="/app" component={ProtectedMainTabs} />
          <Route exact path="/" component={RootRedirect} />
        </IonRouterOutlet>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
)

export default App
