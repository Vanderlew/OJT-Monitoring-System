import { useState, type FormEvent } from 'react'
import { Redirect } from 'react-router-dom'
import { IonContent, IonIcon, IonPage } from '@ionic/react'
import { eyeOffOutline, eyeOutline } from 'ionicons/icons'
import { useAuth } from '../contexts/AuthContext'
import { isAdminProfile, isMobileAllowedProfile } from '../lib/supabase'
import { AuthLoading } from '../components/AuthLoading'
import './LoginPage.css'

export default function LoginPage() {
  const { session, profile, loading, profileLoading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const missingEnv =
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  if (loading || (session && profileLoading)) {
    return <AuthLoading />
  }

  if (session && profile) {
    if (isAdminProfile(profile) || !isMobileAllowedProfile(profile)) {
      return <Redirect to="/access-denied" />
    }
    return <Redirect to="/app/home" />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await signIn(email.trim(), password)
    setSubmitting(false)

    if (signInError) {
      setError(signInError)
    }
  }

  return (
    <IonPage className="login-page">
      <IonContent fullscreen className="login-content">
        <div className="login-screen">
          <div className="login-body">
            <div className="login-form-wrap">
              {missingEnv && (
                <p className="login-alert login-alert--warning">
                  Supabase is not configured. Add credentials to <code>.env.local</code>.
                </p>
              )}

              <h1 className="login-title">CMU OJT App</h1>

              <form className="login-form" onSubmit={(e) => void handleSubmit(e)}>
                <label className="login-label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  className="login-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  required
                  disabled={submitting}
                />

                <label className="login-label" htmlFor="login-password">Password</label>
                <div className="login-password-row">
                  <input
                    id="login-password"
                    className="login-input login-input--password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={submitting}
                  >
                    <IonIcon icon={showPassword ? eyeOutline : eyeOffOutline} />
                  </button>
                </div>

                {error && <p className="login-alert login-alert--error">{error}</p>}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={submitting || missingEnv}
                >
                  {submitting ? 'Logging in…' : 'Login'}
                </button>

                <button type="button" className="login-forgot" disabled={submitting}>
                  Forgot Password?
                </button>
              </form>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
