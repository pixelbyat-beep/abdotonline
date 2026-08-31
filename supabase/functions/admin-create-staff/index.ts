// Creates a new admin/staff login. Only callable by an existing admin (staff cannot
// create more admins). Uses the service-role Auth Admin API, which is not available
// to the browser client under any circumstance.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { name, email, password, role } = await req.json()
    if (!name || !email || !password || !['admin', 'staff'].includes(role)) {
      return jsonResponse({ error: 'Missing or invalid fields' }, 400)
    }

    const admin = supabaseAdmin()

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(token)
    if (!userData.user) return jsonResponse({ error: 'Unauthorized' }, 401)
    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', userData.user.id).single()
    if (callerProfile?.role !== 'admin') return jsonResponse({ error: 'Only admins can add new admin/staff users' }, 403)

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })
    if (createError || !created.user) {
      return jsonResponse({ error: createError?.message ?? 'Could not create user' }, 400)
    }

    const { error: roleError } = await admin.from('profiles').update({ role }).eq('id', created.user.id)
    if (roleError) return jsonResponse({ error: 'User created but role assignment failed' }, 500)

    return jsonResponse({ ok: true, userId: created.user.id })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'Unexpected error creating admin user' }, 500)
  }
})
