import { useEffect } from 'react'
import type { Profile } from '../../lib/supabase'
import { userListDisplayName, type UserListItem } from '../../lib/users'
import { ProfileDetails } from '../ProfileDetails'

type UserDetailsModalProps = {
  user: UserListItem | null
  profile: Profile | null
  loading: boolean
  deleting: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  isAdmin: boolean
}

export function UserDetailsModal({
  user,
  profile,
  loading,
  deleting,
  onClose,
  onEdit,
  onDelete,
  isAdmin,
}: UserDetailsModalProps) {
  const open = user !== null

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, deleting])

  if (!open || !user) return null

  return (
    <div
      className="modal-overlay modal-overlay--enter"
      onClick={() => !deleting && onClose()}
    >
      <div
        className="modal-dialog modal-dialog-lg users-details-modal modal-dialog--enter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="users-detail-header users-details-modal-header">
          <div>
            <h3 id="user-details-title">{userListDisplayName(user)}</h3>
            <p className="users-detail-subtitle">{user.personal_email ?? '—'}</p>
          </div>

          <div className="users-row-actions">
            <button
              type="button"
              className="users-action-btn users-action-edit"
              onClick={onEdit}
              disabled={deleting}
            >
              Edit
            </button>
            <button
              type="button"
              className="users-action-btn users-action-delete"
              onClick={onDelete}
              disabled={deleting || isAdmin}
              title={isAdmin ? 'Admin accounts cannot be deleted' : undefined}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              disabled={deleting}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>

        <div className="users-details-modal-body">
          {loading && <p className="users-detail-empty">Loading user details…</p>}

          {!loading && profile && (
            <div className="users-detail-content users-detail-content--enter">
              <ProfileDetails profile={profile} />
            </div>
          )}

          {!loading && !profile && (
            <p className="users-detail-empty">Could not load profile details.</p>
          )}
        </div>
      </div>
    </div>
  )
}
