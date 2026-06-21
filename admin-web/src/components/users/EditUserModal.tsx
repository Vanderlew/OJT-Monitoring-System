import { useEffect, useState, type FormEvent } from 'react'
import {
  fetchAssignableRoles,
  formatRoleName,
  updateUser,
  USER_STATUS_OPTIONS,
  type RoleOption,
  type UserListItem,
  type UserStatus,
} from '../../lib/users'

type EditUserModalProps = {
  user: UserListItem | null
  onClose: () => void
  onSuccess: () => void
}

function isAdminUser(user: UserListItem): boolean {
  return user.roles?.name?.trim().toLowerCase() === 'admin'
}

export function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const open = user !== null
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState<UserStatus>('active')
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const adminUser = user ? isAdminUser(user) : false

  useEffect(() => {
    if (!user) return

    setFirstname(user.firstname ?? '')
    setLastname(user.lastname ?? '')
    setEmail(user.personal_email ?? '')
    setRoleId(user.role_id ? String(user.role_id) : '')
    const normalized = user.status?.trim().toLowerCase()
    setStatus(
      normalized === 'active' || normalized === 'pending' || normalized === 'disabled'
        ? normalized
        : 'pending',
    )
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

      const merged = [...nextRoles]
      if (user.role_id && user.roles?.name && !merged.some((r) => r.id === user.role_id)) {
        merged.unshift({ id: user.role_id, name: user.roles.name })
      }

      setRoles(merged)
      if (user.role_id) {
        setRoleId(String(user.role_id))
      } else if (merged.length > 0) {
        setRoleId(String(merged[0].id))
      }
    })
  }, [user])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, submitting])

  if (!open || !user) return null

  const profileId = user.id

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

    const { error: updateError } = await updateUser({
      profileId,
      firstname,
      lastname,
      email,
      roleId: parsedRoleId,
      status,
    })

    setSubmitting(false)

    if (updateError) {
      setError(updateError)
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
        aria-labelledby="edit-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="edit-user-title">Edit user</h3>
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
          <label htmlFor="edit-user-firstname">First name</label>
          <input
            id="edit-user-firstname"
            type="text"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
            disabled={submitting}
            autoComplete="off"
          />

          <label htmlFor="edit-user-lastname">Last name</label>
          <input
            id="edit-user-lastname"
            type="text"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
            disabled={submitting}
            autoComplete="off"
          />

          <label htmlFor="edit-user-email">Email</label>
          <input
            id="edit-user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            autoComplete="off"
          />

          <label htmlFor="edit-user-role">Role</label>
          {adminUser ? (
            <input
              id="edit-user-role"
              type="text"
              value={formatRoleName(user.roles?.name ?? 'Admin')}
              disabled
            />
          ) : (
            <select
              id="edit-user-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
              disabled={submitting || rolesLoading || roles.length === 0}
            >
              {rolesLoading && <option value="">Loading roles…</option>}
              {!rolesLoading &&
                roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {formatRoleName(role.name)}
                  </option>
                ))}
            </select>
          )}

          <label htmlFor="edit-user-status">Status</label>
          <select
            id="edit-user-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            required
            disabled={submitting}
          >
            {USER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
