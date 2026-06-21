import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and add your Supabase credentials.',
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
)

export type RoleName = 'admin' | 'coordinator' | 'student' | 'supervisor'

export type Profile = {
  id: number
  firstname: string | null
  lastname: string | null
  middle_name: string | null
  suffix: string | null
  age: number | null
  gender: string | null
  status: string | null
  birthdate: string | null
  nationality: string | null
  permanent_address: string | null
  place_of_birth: string | null
  personal_email: string | null
  phone_number: string | null
  emergency_contact_name: string | null
  emergency_contact_number: string | null
  role_id: number | null
  auth_user_id: string | null
  course_id: number | null
  created_at: string | null
  updated_at: string | null
  roles: { name: string } | null
}

export function profileFirstLastName(profile: Profile): string {
  const parts = [profile.firstname, profile.lastname].filter(Boolean)
  return parts.join(' ') || '—'
}

export function profileDisplayName(profile: Profile): string {
  const parts = [profile.firstname, profile.middle_name, profile.lastname, profile.suffix].filter(
    Boolean,
  )
  return parts.join(' ') || '—'
}

export function profileRoleName(profile: Profile | null): string | null {
  return profile?.roles?.name?.toLowerCase() ?? null
}

export function formatRoleLabel(role: string | null | undefined): string {
  if (!role?.trim()) return 'User'
  const trimmed = role.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export function isAdminProfile(profile: Profile | null): boolean {
  return profileRoleName(profile) === 'admin'
}

export function formatProfileValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export function formatProfileDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
