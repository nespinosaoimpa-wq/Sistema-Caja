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

    // 2. Authorize only the owner email
    const ADMIN_EMAIL = 'nespinosa.oimpa@gmail.com'
    if (user.email !== ADMIN_EMAIL) {
      return Response.json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' }, { status: 403 })
    }

    // 3. Initialize Admin Client to bypass normal tenant RLS restrictions
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      console.error('[API Superadmin] SUPABASE_SERVICE_ROLE_KEY is not defined in environment.')
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

    // 4. Fetch all tenants data and metrics
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (tenantsError) {
      console.error('[API Superadmin] Error fetching tenants:', tenantsError)
      return Response.json({ error: tenantsError.message }, { status: 400 })
    }

    // 5. Fetch metrics in parallel using supabaseAdmin
    const [
      { data: profiles },
      { data: products },
      { data: shifts },
      { data: sales }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('tenant_id'),
      supabaseAdmin.from('products').select('tenant_id'),
      supabaseAdmin.from('shifts').select('tenant_id'),
      supabaseAdmin.from('sales').select('tenant_id, created_at').order('created_at', { ascending: false })
    ])

    // 6. Aggregate metrics in memory
    const profilesMap = {}
    profiles?.forEach(p => {
      profilesMap[p.tenant_id] = (profilesMap[p.tenant_id] || 0) + 1
    })

    const productsMap = {}
    products?.forEach(p => {
      productsMap[p.tenant_id] = (productsMap[p.tenant_id] || 0) + 1
    })

    const shiftsMap = {}
    shifts?.forEach(s => {
      shiftsMap[s.tenant_id] = (shiftsMap[s.tenant_id] || 0) + 1
    })

    const salesMap = {}
    const lastSaleMap = {}
    sales?.forEach(s => {
      salesMap[s.tenant_id] = (salesMap[s.tenant_id] || 0) + 1
      if (!lastSaleMap[s.tenant_id]) {
        lastSaleMap[s.tenant_id] = s.created_at
      }
    })

    // 7. Consolidate results
    const data = tenants.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      business_type: t.business_type,
      email: t.email,
      address: t.address,
      phone: t.phone,
      subscription_plan: t.subscription_plan,
      subscription_status: t.subscription_status,
      trial_ends_at: t.trial_ends_at,
      created_at: t.created_at,
      profiles_count: profilesMap[t.id] || 0,
      products_count: productsMap[t.id] || 0,
      shifts_count: shiftsMap[t.id] || 0,
      sales_count: salesMap[t.id] || 0,
      last_sale_at: lastSaleMap[t.id] || null
    }))

    return Response.json({ data })
  } catch (err) {
    console.error('[API Superadmin] Exception caught:', err)
    return Response.json({ error: err.message || 'Excepción interna' }, { status: 500 })
  }
}
