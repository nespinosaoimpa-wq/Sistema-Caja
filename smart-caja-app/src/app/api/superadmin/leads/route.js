import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'nespinosa.oimpa@gmail.com'

async function checkAdminAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.email !== ADMIN_EMAIL) {
    return { authorized: false }
  }
  return { authorized: true }
}

function getSupabaseAdmin() {
  return createAdminClient()
}

export async function GET(req) {
  try {
    const { authorized } = await checkAdminAuth()
    if (!authorized) {
      return Response.json({ error: 'No autorizado' }, { status: 403 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return Response.json({ error: 'Servicio no configurado' }, { status: 500 })
    }

    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ data: leads })
  } catch (err) {
    console.error('[superadmin/leads] GET Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
