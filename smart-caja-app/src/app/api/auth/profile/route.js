import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request) {
  try {
    // 1. Authenticate user from session cookies
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Query the profile and tenant using the admin client to bypass RLS recursion
    const supabaseAdmin = createAdminClient()

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, tenants(*)')
      .eq('id', user.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile not found - returning null but 200 OK (valid state for self-healing/setup)
        return Response.json({ data: null })
      }
      console.error('[API Profile] Error querying profiles table:', profileError)
      return Response.json({ error: profileError.message }, { status: 400 })
    }

    return Response.json({ data: profileData })
  } catch (err) {
    console.error('[API Profile] Exception caught:', err)
    return Response.json({ error: err.message || 'Excepción interna' }, { status: 500 })
  }
}
