import { Redirect, Route, type RouteProps } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isAdminProfile, isMobileAllowedProfile } from '../lib/supabase'
import MainTabs from '../pages/MainTabs'
import { AuthLoading } from './AuthLoading'

export function ProtectedMainTabs() {
  const { session, profile, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return <AuthLoading />
  }

  if (!session) {
    return <Redirect to="/login" />
  }

  if (profile && (isAdminProfile(profile) || !isMobileAllowedProfile(profile))) {
    return <Redirect to="/access-denied" />
  }

  return <MainTabs />
}

export function ProtectedRoute({ component: Component, ...rest }: RouteProps) {
  const { session, profile, loading, profileLoading } = useAuth()

  return (
    <Route
      {...rest}
      render={(props) => {
        if (loading || profileLoading) {
          return <AuthLoading />
        }

        if (!session) {
          return <Redirect to="/login" />
        }

        if (profile && (isAdminProfile(profile) || !isMobileAllowedProfile(profile))) {
          return <Redirect to="/access-denied" />
        }

        return Component ? <Component {...props} /> : null
      }}
    />
  )
}
