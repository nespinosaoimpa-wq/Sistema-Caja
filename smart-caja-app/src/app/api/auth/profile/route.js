import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request) {
  try {
    // 1. Authenticate user from session cookies
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Query the profile and tenant using the service role key to bypass RLS recursion
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      console.error('[API Profile] SUPABASE_SERVICE_ROLE_KEY is not defined in environment.')
      return Response.json({ error: 'Falta configurar la clave de servicio en el servidor' }, { status: 500 })
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

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
