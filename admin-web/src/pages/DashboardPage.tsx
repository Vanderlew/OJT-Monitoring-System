import { useState } from 'react'
import { SchoolYearsPanel } from '../components/schoolYears/SchoolYearsPanel'
import { StudentsPanel } from '../components/students/StudentsPanel'
import { UsersPanel } from '../components/users/UsersPanel'
import { useAuth } from '../contexts/AuthContext'
import { formatRoleLabel, profileFirstLastName, profileRoleName } from '../lib/supabase'
import './DashboardPage.css'

type NavSection = 'users' | 'students' | 'colleges' | 'companies' | 'school-years'

const NAV_ITEMS: { id: NavSection; label: string; description: string }[] = [
  { id: 'users', label: 'Users', description: 'Manage user accounts and roles' },
  { id: 'students', label: 'Students', description: 'View student enrollment and coordinator assignments' },
  { id: 'school-years', label: 'School Year', description: 'Manage academic school years' },
  { id: 'colleges', label: 'Colleges', description: 'Manage college records' },
  { id: 'companies', label: 'Companies', description: 'Manage company records' },
]

export function DashboardPage() {
  const { user, profile, profileLoading, signOut } = useAuth()
  const [activeSection, setActiveSection] = useState<NavSection>('users')

  const roleName = profileRoleName(profile)
  const userName = profileLoading
    ? 'Loading…'
    : profile
      ? profileFirstLastName(profile)
      : '—'
  const sidebarName = userName !== '—' ? userName : user?.email ?? 'User'

  const activeNav = NAV_ITEMS.find((item) => item.id === activeSection)!

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
        <div className="sidebar-brand">
          <h1 className="sidebar-title">OJT Admin</h1>
          <div className="sidebar-user-card">
            <p className="sidebar-user-name">{sidebarName}</p>
            <span className="sidebar-badge">{formatRoleLabel(roleName)}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`sidebar-nav-item${activeSection === item.id ? ' is-active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  <span className="sidebar-nav-label">{item.label}</span>
                  <span className="sidebar-nav-desc">{item.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="btn btn-secondary sidebar-signout" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-main-header">
          <div>
            <h2>{activeNav.label}</h2>
            <p className="dashboard-subtitle">{activeNav.description}</p>
          </div>
        </header>

        {activeSection === 'users' && (
          <div className="dashboard-main-content">
            <UsersPanel />
          </div>
        )}

        {activeSection === 'students' && (
          <div className="dashboard-main-content">
            <StudentsPanel />
          </div>
        )}

        {activeSection === 'school-years' && (
          <div className="dashboard-main-content">
            <SchoolYearsPanel />
          </div>
        )}

        {activeSection === 'colleges' && (
          <div className="dashboard-main-content">
            <article className="dashboard-card">
              <h3>Colleges</h3>
              <p className="dashboard-muted">
                View and manage college records and affiliations.
              </p>
            </article>
          </div>
        )}

        {activeSection === 'companies' && (
          <div className="dashboard-main-content">
            <article className="dashboard-card">
              <h3>Companies</h3>
              <p className="dashboard-muted">
                View and manage company records and partnerships.
              </p>
            </article>
          </div>
        )}
      </main>
    </div>
  )
}
