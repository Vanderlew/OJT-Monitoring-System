import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type RegisterUserBody = {
  firstname?: string
  lastname?: string
  email?: string
  password?: string
  role_id?: number
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function roleNameFromJoin(roles: unknown): string | null {
  if (!roles || typeof roles !== 'object') return null
  if (Array.isArray(roles)) {
    const first = roles[0]
    return first && typeof first === 'object' && 'name' in first
      ? String((first as { name: string }).name).toLowerCase()
      : null
  }
  return 'name' in roles ? String((roles as { name: string }).name).toLowerCase() : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Server configuration error' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerProfile, error: callerError } = await adminClient
      .from('profiles')
      .select('role_id, roles ( name )')
      .or(`auth_user_id.eq.${user.id},personal_email.eq.${user.email ?? ''}`)
      .maybeSingle()

    if (callerError) {
      return jsonResponse({ error: callerError.message }, 500)
    }

    if (roleNameFromJoin(callerProfile?.roles) !== 'admin') {
      return jsonResponse({ error: 'Forbidden: administrators only' }, 403)
    }

    const body = (await req.json()) as RegisterUserBody
    const firstname = body.firstname?.trim() ?? ''
    const lastname = body.lastname?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''
    const roleId = body.role_id

    if (!firstname || !lastname || !email || !password) {
      return jsonResponse({ error: 'First name, last name, email, and password are required.' }, 400)
    }

    if (!roleId || Number.isNaN(Number(roleId))) {
      return jsonResponse({ error: 'A valid role is required.' }, 400)
    }

    if (password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters.' }, 400)
    }

    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('personal_email', email)
      .maybeSingle()

    if (existingProfile) {
      return jsonResponse({ error: 'A user with this email already exists.' }, 400)
    }

    const { data: roleRow, error: roleError } = await adminClient
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .maybeSingle()

    if (roleError) {
      return jsonResponse({ error: roleError.message }, 500)
    }

    if (!roleRow) {
      return jsonResponse({ error: 'Selected role does not exist.' }, 400)
    }

    if (roleRow.name.trim().toLowerCase() === 'admin') {
      return jsonResponse({ error: 'The admin role cannot be assigned through registration.' }, 403)
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return jsonResponse({ error: authError.message }, 400)
    }

    const authUserId = authData.user?.id
    if (!authUserId) {
      return jsonResponse({ error: 'Could not create auth account.' }, 500)
    }

    const { data: insertedProfile, error: insertError } = await adminClient
      .from('profiles')
      .insert({
        firstname,
        lastname,
        personal_email: email,
        role_id: roleId,
        auth_user_id: authUserId,
        status: 'active',
      })
      .select('id')
      .single()

    if (insertError) {
      await adminClient.auth.admin.deleteUser(authUserId)
      return jsonResponse({ error: insertError.message }, 400)
    }

    return jsonResponse({
      success: true,
      profile_id: insertedProfile.id,
      auth_user_id: authUserId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error'
    return jsonResponse({ error: message }, 500)
  }
})
