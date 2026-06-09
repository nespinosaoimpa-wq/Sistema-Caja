import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return Response.json({ error: 'Falta email' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      // Fallback safety
      console.warn('[Check Email API] SUPABASE_SERVICE_ROLE_KEY is not defined.')
      return Response.json({ registered: true })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .limit(1)

    if (error) {
      console.error('[Check Email API] Error checking profiles table:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ registered: data && data.length > 0 })
  } catch (err) {
    console.error('[Check Email API] Exception caught:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
