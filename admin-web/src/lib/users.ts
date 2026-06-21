import { createClient } from '@supabase/supabase-js'
import { supabase, type Profile } from './supabase'

export const USERS_PAGE_SIZE = 20

export type UserStatus = 'active' | 'pending' | 'disabled'

export const USER_STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'disabled', label: 'Disabled' },
]

export type UserStatusFilter = 'all' | UserStatus

export type UserListItem = {
  id: number
  firstname: string | null
  lastname: string | null
  middle_name: string | null
  suffix: string | null
  personal_email: string | null
  status: string | null
  role_id: number | null
  created_at: string | null
  roles: { name: string } | null
}

export type RoleOption = {
  id: number
  name: string
}

type RegisterUserResponse = {
  success?: boolean
  error?: string
  profile_id?: number
  auth_user_id?: string
}

const listSelect = `
  id,
  firstname,
  lastname,
  middle_name,
  suffix,
  personal_email,
  status,
  role_id,
  created_at,
  roles ( name )
`

const profileSelect = `
  id,
  firstname,
  lastname,
  middle_name,
  suffix,
  age,
  gender,
  status,
  birthdate,
  nationality,
  permanent_address,
  place_of_birth,
  personal_email,
  phone_number,
  emergency_contact_name,
  emergency_contact_number,
  role_id,
  auth_user_id,
  course_id,
  created_at,
  updated_at,
  roles ( name )
`

function normalizeProfile(row: Record<string, unknown>): Profile {
  const roles = row.roles
  const role =
    roles && typeof roles === 'object'
      ? Array.isArray(roles)
        ? (roles[0] as { name: string } | undefined) ?? null
        : (roles as { name: string })
      : null

  return {
    id: row.id as number,
    firstname: (row.firstname as string | null) ?? null,
    lastname: (row.lastname as string | null) ?? null,
    middle_name: (row.middle_name as string | null) ?? null,
    suffix: (row.suffix as string | null) ?? null,
    age: (row.age as number | null) ?? null,
    gender: (row.gender as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    birthdate: (row.birthdate as string | null) ?? null,
    nationality: (row.nationality as string | null) ?? null,
    permanent_address: (row.permanent_address as string | null) ?? null,
    place_of_birth: (row.place_of_birth as string | null) ?? null,
    personal_email: (row.personal_email as string | null) ?? null,
    phone_number: (row.phone_number as string | null) ?? null,
    emergency_contact_name: (row.emergency_contact_name as string | null) ?? null,
    emergency_contact_number: (row.emergency_contact_number as string | null) ?? null,
    role_id: (row.role_id as number | null) ?? null,
    auth_user_id: (row.auth_user_id as string | null) ?? null,
    course_id: (row.course_id as number | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
    roles: role,
  }
}

function normalizeUserListItem(row: Record<string, unknown>): UserListItem {
  const roles = row.roles
  const role =
    roles && typeof roles === 'object'
      ? Array.isArray(roles)
        ? (roles[0] as { name: string } | undefined) ?? null
        : (roles as { name: string })
      : null

  return {
    id: row.id as number,
    firstname: (row.firstname as string | null) ?? null,
    lastname: (row.lastname as string | null) ?? null,
    middle_name: (row.middle_name as string | null) ?? null,
    suffix: (row.suffix as string | null) ?? null,
    personal_email: (row.personal_email as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    role_id: (row.role_id as number | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    roles: role,
  }
}

function getSignupClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL ?? '',
    import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

export function userListDisplayName(user: UserListItem): string {
  const parts = [user.firstname, user.middle_name, user.lastname, user.suffix].filter(Boolean)
  return parts.join(' ') || '—'
}

export function normalizeUserStatus(status: string | null | undefined): string {
  return status?.trim().toLowerCase() ?? ''
}

export async function fetchUsers(
  page: number,
  statusFilter: UserStatusFilter,
  excludeProfileId?: number | null,
): Promise<{ users: UserListItem[]; total: number; error: string | null }> {
  const from = (page - 1) * USERS_PAGE_SIZE
  const to = from + USERS_PAGE_SIZE - 1

  let query = supabase
    .from('profiles')
    .select(listSelect, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (excludeProfileId != null) {
    query = query.neq('id', excludeProfileId)
  }

  if (statusFilter === 'active') {
    query = query.or('status.ilike.active,and(status.is.null,auth_user_id.not.is.null)')
  } else if (statusFilter !== 'all') {
    query = query.ilike('status', statusFilter)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return { users: [], total: 0, error: error.message }
  }

  return {
    users: (data ?? []).map((row) => normalizeUserListItem(row as Record<string, unknown>)),
    total: count ?? 0,
    error: null,
  }
}

export async function fetchUserProfile(
  profileId: number,
): Promise<{ profile: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select(profileSelect)
    .eq('id', profileId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    return { profile: null, error: error.message }
  }

  if (!data) {
    return { profile: null, error: null }
  }

  return {
    profile: normalizeProfile(data as Record<string, unknown>),
    error: null,
  }
}

export function formatRoleName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '—'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export async function fetchAssignableRoles(): Promise<{ roles: RoleOption[]; error: string | null }> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_assignable_roles')

  if (!rpcError && rpcData?.length) {
    return {
      roles: (rpcData as RoleOption[]).map((role) => ({
        id: Number(role.id),
        name: role.name,
      })),
      error: null,
    }
  }

  const { data, error } = await supabase.from('roles').select('id, name').order('id')

  if (error) {
    const setupHint = 'Run supabase/seed/admin-setup.sql in the Supabase SQL Editor.'
    if (rpcError) {
      return { roles: [], error: `${rpcError.message}. ${setupHint}` }
    }
    return { roles: [], error: `${error.message}. ${setupHint}` }
  }

  const roles = (data ?? [])
    .filter((role) => role.name.trim().toLowerCase() !== 'admin')
    .map((role) => ({ id: Number(role.id), name: role.name }))

  if (roles.length === 0) {
    return {
      roles: [],
      error: `No roles returned. Run supabase/seed/admin-setup.sql in the Supabase SQL Editor, then refresh.`,
    }
  }

  return { roles, error: null }
}

async function parseFunctionError(
  error: { message: string; context?: Response },
): Promise<string> {
  if (error.context) {
    try {
      const body = (await error.context.json()) as RegisterUserResponse
      if (body.error) return body.error
    } catch {
      // ignore JSON parse errors
    }
  }

  return error.message
}

function isEdgeFunctionUnavailable(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('not found') ||
    normalized.includes('failed to send') ||
    normalized.includes('404') ||
    normalized.includes('edge function') ||
    normalized.includes('register-user function deployed')
  )
}

function formatSignUpError(message: string): string {
  if (message.toLowerCase().includes('email rate limit exceeded')) {
    return (
      'Supabase email rate limit reached (too many sign-up attempts). ' +
      'Wait about 1 hour, or in Supabase go to Authentication → Providers → Email and turn off "Confirm email" for development. ' +
      'Then try again with a new email address.'
    )
  }
  return message
}

async function registerUserViaDatabase(params: {
  firstname: string
  lastname: string
  email: string
  password: string
  roleId: number
}): Promise<{ error: string | null }> {
  const email = params.email.trim().toLowerCase()
  const firstname = params.firstname.trim()
  const lastname = params.lastname.trim()

  const signupClient = getSignupClient()
  const { data: signUpData, error: signUpError } = await signupClient.auth.signUp({
    email,
    password: params.password,
  })

  if (signUpError) {
    return { error: formatSignUpError(signUpError.message) }
  }

  const authUserId = signUpData.user?.id
  if (!authUserId) {
    return { error: 'Could not create auth account.' }
  }

  const status = signUpData.user?.email_confirmed_at ? 'active' : 'pending'

  const { error: rpcError } = await supabase.rpc('register_user_profile', {
    p_firstname: firstname,
    p_lastname: lastname,
    p_email: email,
    p_auth_user_id: authUserId,
    p_role_id: params.roleId,
    p_status: status,
  })

  if (!rpcError) {
    return { error: null }
  }

  const rpcMessage = rpcError.message.toLowerCase()

  if (rpcMessage.includes('forbidden') || rpcMessage.includes('administrators only')) {
    return {
      error:
        'Your account is not recognized as admin. Run supabase/seed/register-user-function.sql in Supabase SQL Editor, then sign out and sign in again.',
    }
  }

  if (rpcMessage.includes('could not find the function')) {
    return {
      error:
        'Registration function not found. Run supabase/seed/register-user-function.sql in Supabase SQL Editor, wait 10 seconds, refresh the page, and try again.',
    }
  }

  if (rpcMessage.includes('row-level security')) {
    return {
      error:
        'Profile insert blocked by RLS. Run supabase/seed/register-user-function.sql in Supabase SQL Editor, sign out, sign in, then try again with a new email.',
    }
  }

  return { error: rpcError.message }
}

export async function registerUser(params: {
  firstname: string
  lastname: string
  email: string
  password: string
  roleId: number
}): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke<RegisterUserResponse>('register-user', {
    body: {
      firstname: params.firstname.trim(),
      lastname: params.lastname.trim(),
      email: params.email.trim().toLowerCase(),
      password: params.password,
      role_id: params.roleId,
    },
  })

  if (!error && data?.success) {
    return { error: null }
  }

  const edgeMessage = error
    ? await parseFunctionError(error)
    : (data?.error ?? 'Registration failed.')

  if (!error && data?.error && !isEdgeFunctionUnavailable(data.error)) {
    return { error: data.error }
  }

  if (error && !isEdgeFunctionUnavailable(edgeMessage)) {
    return { error: edgeMessage }
  }

  return registerUserViaDatabase(params)
}

function mapAdminRpcError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('forbidden') || lower.includes('administrators only')) {
    return 'Your account is not recognized as admin. Run supabase/seed/register-user-function.sql in Supabase SQL Editor.'
  }
  if (lower.includes('could not find the function')) {
    return 'Database function not found. Run supabase/seed/register-user-function.sql in Supabase SQL Editor, wait 10 seconds, and refresh.'
  }
  return message
}

export async function updateUser(params: {
  profileId: number
  firstname: string
  lastname: string
  email: string
  roleId: number
  status: UserStatus
}): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('update_user_profile', {
    p_profile_id: params.profileId,
    p_firstname: params.firstname.trim(),
    p_lastname: params.lastname.trim(),
    p_email: params.email.trim().toLowerCase(),
    p_role_id: params.roleId,
    p_status: params.status,
  })

  if (error) {
    return { error: mapAdminRpcError(error.message) }
  }

  return { error: null }
}

export async function deleteUser(profileId: number): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('delete_user_profile', {
    p_profile_id: profileId,
  })

  if (error) {
    return { error: mapAdminRpcError(error.message) }
  }

  return { error: null }
}
