import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { formatProfileDate } from '../../lib/supabase'
import type { Profile } from '../../lib/supabase'
import {
  deleteUser,
  fetchUserProfile,
  fetchUsers,
  normalizeUserStatus,
  USERS_PAGE_SIZE,
  userListDisplayName,
  type UserListItem,
  type UserStatusFilter,
} from '../../lib/users'
import { AddUserModal } from './AddUserModal'
import { DeleteUserModal } from './DeleteUserModal'
import { EditUserModal } from './EditUserModal'
import { UserDetailsModal } from './UserDetailsModal'
import './UsersPanel.css'

const STATUS_FILTERS: { id: UserStatusFilter; label: string }[] = [
  { id: 'all', label: 'All users' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'disabled', label: 'Disabled' },
]

function StatusBadge({ status }: { status: string | null }) {
  const normalized = normalizeUserStatus(status)
  const label = status?.trim() || (normalized === '' ? 'Active' : '—')

  let className = 'status-pill'
  if (normalized === 'active' || normalized === '') className += ' status-ok'
  else if (normalized === 'pending') className += ' status-pending'
  else if (normalized === 'disabled') className += ' status-disabled'

  return <span className={className}>{label}</span>
}

function isAdminUser(user: UserListItem): boolean {
  return user.roles?.name?.trim().toLowerCase() === 'admin'
}

export function UsersPanel() {
  const { profile } = useAuth()
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('active')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState<UserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : (page - 1) * USERS_PAGE_SIZE + 1
  const rangeEnd = Math.min(page * USERS_PAGE_SIZE, total)
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await fetchUsers(page, statusFilter, profile?.id)

    if (result.error) {
      setError(result.error)
      setUsers([])
      setTotal(0)
    } else {
      setUsers(result.users)
      setTotal(result.total)
    }

    setLoading(false)
  }, [page, statusFilter, profile?.id])

  const loadSelectedProfile = useCallback(async (profileId: number) => {
    setDetailLoading(true)

    const result = await fetchUserProfile(profileId)

    if (result.error) {
      setActionError(result.error)
      setSelectedProfile(null)
    } else {
      setSelectedProfile(result.profile)
    }

    setDetailLoading(false)
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (loading) return

    if (selectedUserId !== null && !users.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(null)
      setSelectedProfile(null)
      setShowDetails(false)
    }
  }, [loading, users, selectedUserId])

  function handleFilterChange(filter: UserStatusFilter) {
    setStatusFilter(filter)
    setPage(1)
    setSelectedUserId(null)
    setSelectedProfile(null)
    setShowDetails(false)
    setActionError(null)
  }

  function handleViewDetails(user: UserListItem) {
    setActionError(null)
    setSelectedUserId(user.id)
    setShowDetails(true)
    setSelectedProfile(null)
    void loadSelectedProfile(user.id)
  }

  function closeDetails() {
    setShowDetails(false)
    setSelectedUserId(null)
    setSelectedProfile(null)
  }

  function handleEditFromDetails() {
    if (!selectedUser) return
    setActionError(null)
    setEditingUser(selectedUser)
    closeDetails()
  }

  function openDeleteModal(user: UserListItem) {
    if (isAdminUser(user)) return
    setActionError(null)
    setDeletingUser(user)
  }

  async function confirmDelete() {
    if (!deletingUser) return

    setDeletingId(deletingUser.id)

    const { error: deleteError } = await deleteUser(deletingUser.id)
    setDeletingId(null)

    if (deleteError) {
      setActionError(deleteError)
      return
    }

    setDeletingUser(null)
    if (deletingUser.id === selectedUserId) {
      closeDetails()
    }
    void loadUsers()
  }

  return (
    <div className="users-panel">
      <div className="users-toolbar">
        <nav className="users-filters" aria-label="Filter users by status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`users-filter-btn${statusFilter === filter.id ? ' is-active' : ''}`}
              onClick={() => handleFilterChange(filter.id)}
              aria-current={statusFilter === filter.id ? 'true' : undefined}
            >
              {filter.label}
            </button>
          ))}
        </nav>

        <button type="button" className="users-add-btn" onClick={() => setAddModalOpen(true)}>
          <span className="users-add-btn-icon" aria-hidden="true">+</span>
          Add user
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {actionError && (
        <div className="alert alert-error" role="alert">
          {actionError}
        </div>
      )}

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th className="users-table-actions-col">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="users-table-empty">Loading users…</td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="users-table-empty">No users found.</td>
              </tr>
            )}

            {!loading &&
              users.map((user) => (
                <tr key={user.id} className={selectedUserId === user.id && showDetails ? 'is-selected' : undefined}>
                  <td>{userListDisplayName(user)}</td>
                  <td>{user.personal_email ?? '—'}</td>
                  <td>{user.roles?.name ?? '—'}</td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td>{formatProfileDate(user.created_at)}</td>
                  <td>
                    <button
                      type="button"
                      className="users-view-details-btn"
                      onClick={() => handleViewDetails(user)}
                      aria-expanded={showDetails && selectedUserId === user.id}
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <footer className="users-pagination">
        <p className="users-pagination-summary">
          {total === 0
            ? 'No users to display'
            : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </p>

        <div className="users-pagination-controls">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            Previous
          </button>
          <span className="users-pagination-page">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || page >= totalPages}
          >
            Next
          </button>
        </div>
      </footer>

      {showDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          profile={selectedProfile}
          loading={detailLoading}
          deleting={deletingId === selectedUser.id}
          onClose={closeDetails}
          onEdit={handleEditFromDetails}
          onDelete={() => openDeleteModal(selectedUser)}
          isAdmin={isAdminUser(selectedUser)}
        />
      )}

      <AddUserModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          if (page === 1) {
            void loadUsers()
          } else {
            setPage(1)
          }
        }}
      />

      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => void loadUsers()}
      />

      <DeleteUserModal
        user={deletingUser}
        submitting={deletingUser !== null && deletingId === deletingUser.id}
        onClose={() => !deletingId && setDeletingUser(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
