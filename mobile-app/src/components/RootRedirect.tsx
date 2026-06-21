import { Redirect, Route } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isAdminProfile, isMobileAllowedProfile } from '../lib/supabase'
import { AuthLoading } from '../components/AuthLoading'

export default function RootRedirect() {
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

  return <Redirect to="/app/home" />
}
