import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && session) {
      navigate('/', { replace: true })
    }
  }, [loading, session, navigate])

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await signIn(email.trim(), password)
    setSubmitting(false)

    if (signInError) {
      setError(signInError)
      return
    }

    navigate('/', { replace: true })
  }

  const missingEnv =
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <span className="login-badge">Admin</span>
          <h1>OJT Monitoring</h1>
          <p>Sign in to the administrator portal</p>
        </header>

        {missingEnv && (
          <div className="alert alert-warning" role="alert">
            Supabase is not configured. Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code> (see{' '}
            <code>.env.example</code>).
          </div>
        )}

        <form className="login-form" onSubmit={(e) => void handleSubmit(e)}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@school.edu"
            required
            disabled={submitting}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={submitting}
          />

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting || missingEnv}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
