import { useEffect } from 'react'
import { userListDisplayName, type UserListItem } from '../../lib/users'

type DeleteUserModalProps = {
  user: UserListItem | null
  submitting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteUserModal({ user, submitting, onClose, onConfirm }: DeleteUserModalProps) {
  const open = user !== null

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, submitting])

  if (!open || !user) return null

  const name = userListDisplayName(user)
  const email = user.personal_email ?? '—'

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div
        className="modal-dialog modal-dialog-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        aria-describedby="delete-user-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="delete-user-title">Delete user</h3>
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

        <p id="delete-user-desc" className="modal-message">
          Are you sure you want to delete <strong>{name}</strong> ({email})? This is a soft
          delete — the user will be hidden from the list but kept in the database.
        </p>

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
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? 'Deleting…' : 'Delete user'}
          </button>
        </div>
      </div>
    </div>
  )
}
