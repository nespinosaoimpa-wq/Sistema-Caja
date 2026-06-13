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

    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ data: coupons })
  } catch (err) {
    console.error('[superadmin/coupons] GET Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { authorized } = await checkAdminAuth()
    if (!authorized) {
      return Response.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { code, discount_type, discount_value, duration_months, max_uses, expires_at } = body

    if (!code || !discount_type || discount_value === undefined) {
      return Response.json({ error: 'Datos obligatorios incompletos' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return Response.json({ error: 'Servicio no configurado' }, { status: 500 })
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: code.trim().toUpperCase(),
        discount_type,
        discount_value,
        duration_months: duration_months || null,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
        uses_count: 0
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique constraint')) {
        return Response.json({ error: 'Ya existe un cupón con ese código' }, { status: 400 })
      }
      throw error
    }

    return Response.json({ data: coupon })
  } catch (err) {
    console.error('[superadmin/coupons] POST Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { authorized } = await checkAdminAuth()
    if (!authorized) {
      return Response.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'ID requerido' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return Response.json({ error: 'Servicio no configurado' }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    console.error('[superadmin/coupons] DELETE Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
