import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../lib/supabase'

type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  profileLoading: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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

async function fetchProfile(user: User): Promise<Profile | null> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile')

  if (!rpcError && rpcData && typeof rpcData === 'object') {
    return normalizeProfile(rpcData as Record<string, unknown>)
  }

  const byAuthId = await supabase
    .from('profiles')
    .select(profileSelect)
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (byAuthId.data) {
    return normalizeProfile(byAuthId.data)
  }

  if (!byAuthId.error && user.email) {
    const byEmail = await supabase
      .from('profiles')
      .select(profileSelect)
      .eq('personal_email', user.email)
      .maybeSingle()

    if (byEmail.error) {
      console.warn('Could not load profile:', byEmail.error.message)
      return null
    }

    return byEmail.data ? normalizeProfile(byEmail.data) : null
  }

  if (byAuthId.error?.code !== '42703' && byAuthId.error) {
    console.warn('Could not load profile:', byAuthId.error.message)
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = useCallback(async (user: User | undefined) => {
    if (!user) {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    const next = await fetchProfile(user)
    setProfile(next)
    setProfileLoading(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user)
  }, [loadProfile, session?.user])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    void loadProfile(session.user)
  }, [session?.user.id, session?.user.email, loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileLoading,
      loading,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, profile, profileLoading, loading, signIn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
