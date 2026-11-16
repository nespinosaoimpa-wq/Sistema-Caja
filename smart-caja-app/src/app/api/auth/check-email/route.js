import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return Response.json({ error: 'Falta email' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

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
