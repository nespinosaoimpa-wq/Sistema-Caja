import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) return null
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false }
  })
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
