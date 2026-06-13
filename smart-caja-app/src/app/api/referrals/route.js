import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get current tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.tenant_id) {
      return Response.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    const tenantId = profile.tenant_id

    // Fetch tenant referral code
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('referral_code')
      .eq('id', tenantId)
      .single()

    if (tenantError) throw tenantError

    // Fetch referrals from referrals table
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        id,
        status,
        created_at,
        referred_tenant_id,
        tenants!referrals_referred_tenant_id_fkey (
          name,
          created_at
        )
      `)
      .eq('referrer_tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (referralsError) throw referralsError

    const formattedReferrals = referrals.map(r => ({
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      name: r.tenants?.name || 'Comercio Registrado'
    }))

    return Response.json({
      referral_code: tenant.referral_code,
      referrals: formattedReferrals
    })

  } catch (err) {
    console.error('[API Referrals] Error:', err)
    return Response.json({ error: err.message || 'Excepción interna' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { referrer_tenant_id, referred_tenant_id } = await request.json()
    if (!referrer_tenant_id || !referred_tenant_id) {
      return Response.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      console.warn('[API Referrals POST] SUPABASE_SERVICE_ROLE_KEY not configured, bypassing.')
      return Response.json({ success: true, message: 'Bypassed tracking (missing key)' })
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

    const { error } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_tenant_id,
        referred_tenant_id,
        status: 'registered'
      })

    if (error) {
      console.error('[API Referrals POST] Error inserting referral:', error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('[API Referrals POST] Exception:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

