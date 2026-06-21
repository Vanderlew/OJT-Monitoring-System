import { useEffect, useState, type FormEvent } from 'react'
import { fetchAssignableRoles, formatRoleName, registerUser, type RoleOption } from '../../lib/users'

type AddUserModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    setFirstname('')
    setLastname('')
    setEmail('')
    setPassword('')
    setRoleId('')
    setError(null)
    setRolesError(null)
    setRolesLoading(true)

    void fetchAssignableRoles().then(({ roles: nextRoles, error: fetchError }) => {
      setRolesLoading(false)

      if (fetchError) {
        setRolesError(fetchError)
        setRoles([])
        return
      }

      if (nextRoles.length === 0) {
        setRolesError(
          'No roles available. Run supabase/seed/admin-setup.sql in the Supabase SQL Editor.',
        )
        setRoles([])
        return
      }

      setRoles(nextRoles)
      if (nextRoles.length > 0) {
        setRoleId(String(nextRoles[0].id))
      }
    })
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, submitting])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const parsedRoleId = Number(roleId)
    if (!parsedRoleId) {
      setError('Please select a role.')
      setSubmitting(false)
      return
    }

    const { error: registerError } = await registerUser({
      firstname,
      lastname,
      email,
      password,
      roleId: parsedRoleId,
    })

    setSubmitting(false)

    if (registerError) {
      setError(registerError)
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="add-user-title">Register user</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {rolesError && (
          <div className="alert alert-warning" role="alert">
            Could not load roles: {rolesError}
          </div>
        )}

        <form className="modal-form" onSubmit={(e) => void handleSubmit(e)}>
          <label htmlFor="add-user-firstname">First name</label>
          <input
            id="add-user-firstname"
            type="text"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
            disabled={submitting}
            autoComplete="off"
          />

          <label htmlFor="add-user-lastname">Last name</label>
          <input
            id="add-user-lastname"
            type="text"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
            disabled={submitting}
            autoComplete="off"
          />

          <label htmlFor="add-user-email">Email</label>
          <input
            id="add-user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            autoComplete="off"
          />

          <label htmlFor="add-user-password">Password</label>
          <input
            id="add-user-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={submitting}
            autoComplete="new-password"
          />

          <label htmlFor="add-user-role">Role</label>
          <select
            id="add-user-role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            required
            disabled={submitting || rolesLoading || roles.length === 0}
          >
            {rolesLoading && <option value="">Loading roles…</option>}
            {!rolesLoading && roles.length === 0 && (
              <option value="">No roles available</option>
            )}
            {!rolesLoading &&
              roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {formatRoleName(role.name)}
                </option>
              ))}
          </select>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || rolesLoading || roles.length === 0}
            >
              {submitting ? 'Registering…' : 'Register user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
