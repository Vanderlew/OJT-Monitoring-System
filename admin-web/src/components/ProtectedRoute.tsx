import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isAdminProfile, profileRoleName } from '../lib/supabase'

export function ProtectedRoute() {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Checking session…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profile && !isAdminProfile(profile)) {
    const role = profileRoleName(profile) ?? 'unknown'
    return (
      <div className="auth-denied">
        <h1>Access denied</h1>
        <p>
          This portal is for administrators only. Your account role is{' '}
          <strong>{role}</strong>.
        </p>
        <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    )
  }

  return <Outlet />
}
