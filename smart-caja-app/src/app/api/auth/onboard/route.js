import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { generateSlug } from '@/lib/utils/formatters'
import { getInitialCategories } from '@/lib/config/rubroConfig'
import { randomUUID } from 'crypto'

export async function POST(request) {
  try {
    const {
      userId,
      email,
      business_name,
      business_type,
      full_name,
      phone,
      refCode,
      inviteTenant,
      inviteRole
    } = await request.json()

    if (!userId || !email) {
      return Response.json({ error: 'Faltan parámetros obligatorios (userId o email)' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      console.error('[API Onboard] SUPABASE_SERVICE_ROLE_KEY is not defined in environment.')
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

    const emailNormalized = email.trim().toLowerCase()

    if (inviteTenant) {
      // --- REGISTRO DE COLABORADOR INVITADO ---
      console.log(`[API Onboard] Creating guest profile for user: ${userId}, tenant: ${inviteTenant}`)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          tenant_id: inviteTenant,
          full_name: full_name || 'Colaborador',
          email: emailNormalized,
          role: inviteRole || 'cashier',
          is_active: true
        })

      if (profileError) {
        console.error('[API Onboard] Guest profile insert error:', profileError)
        return Response.json({ error: `Error al vincular perfil: ${profileError.message}` }, { status: 400 })
      }
    } else {
      // --- REGISTRO DE NUEVO PROPIETARIO ---
      const tenantId = randomUUID()
      console.log(`[API Onboard] Registering new owner: ${userId}, generating tenant: ${tenantId}`)

      let referredById = null
      let referrerTenantId = null

      if (refCode) {
        const { data: refTenant } = await supabaseAdmin
          .from('tenants')
          .select('id')
          .eq('referral_code', refCode.trim().toUpperCase())
          .maybeSingle()

        if (refTenant) {
          referredById = refTenant.id
          referrerTenantId = refTenant.id
          console.log(`[API Onboard] Referral detected. Referrer Tenant ID: ${referrerTenantId}`)
        }
      }

      // Generate slug and insert tenant
      const slug = generateSlug(business_name) + '-' + Math.random().toString(36).slice(2, 6)

      const { error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert({
          id: tenantId,
          name: business_name,
          slug,
          business_type: business_type || 'general',
          email: emailNormalized,
          phone: phone || '',
          subscription_plan: 'enterprise',
          referred_by_id: referredById,
        })

      if (tenantError) {
        console.error('[API Onboard] Tenant insert error:', tenantError)
        return Response.json({ error: `Error al crear comercio: ${tenantError.message}` }, { status: 400 })
      }

      // 2. Crear perfil de dueño
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          tenant_id: tenantId,
          full_name: full_name || 'Propietario',
          email: emailNormalized,
          role: 'owner',
          is_active: true
        })

      if (profileError) {
        console.error('[API Onboard] Owner profile insert error:', profileError)
        // Rollback tenant to keep database clean
        await supabaseAdmin.from('tenants').delete().eq('id', tenantId).catch(rollbackErr => {
          console.error('[API Onboard] Rollback tenant failed:', rollbackErr)
        })
        return Response.json({ error: `Error al crear perfil: ${profileError.message}` }, { status: 400 })
      }

      // 3. Insertar referral track si aplica
      if (referrerTenantId) {
        const { error: referralError } = await supabaseAdmin
          .from('referrals')
          .insert({
            referrer_tenant_id: referrerTenantId,
            referred_tenant_id: tenantId,
            status: 'registered'
          })
        if (referralError) {
          console.error('[API Onboard] Referral log insert error:', referralError)
        }
      }

      // 4. Crear categorías iniciales
      const initialCategories = getInitialCategories(business_type || 'general')
      const categoriesToInsert = initialCategories.map(cat => ({
        tenant_id: tenantId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color || '#7C3AED',
      }))

      const { error: catError } = await supabaseAdmin
        .from('categories')
        .insert(categoriesToInsert)

      if (catError) {
        console.error('[API Onboard] Default categories insert error:', catError)
      }
    }

    console.log(`[API Onboard] Onboarding completed successfully for user ${userId}`)
    return Response.json({ success: true })
  } catch (err) {
    console.error('[API Onboard] Global exception caught:', err)
    return Response.json({ error: err.message || 'Excepción interna en servidor' }, { status: 500 })
  }
}
