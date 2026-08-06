if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {}
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { generateSlug } from '@/lib/utils/formatters'
import { getInitialCategories } from '@/lib/config/rubroConfig'
import { randomUUID } from 'crypto'

export async function POST(request) {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      business_name,
      business_type,
      subscription_plan,
      refCode,
      inviteTenant,
      inviteRole
    } = await request.json()

    if (!email || !password) {
      return Response.json({ error: 'Faltan parámetros obligatorios (email o contraseña)' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !supabaseUrl) {
      console.error('[API Register] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in server environment.')
      return Response.json({ error: 'Falta configurar las claves de servicio en el servidor de producción.' }, { status: 500 })
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const emailNormalized = email.trim().toLowerCase()

    // 1. Create user via Supabase Auth Admin API
    let userId
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalized,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: full_name || '' }
    })

    if (createError) {
      console.log('[API Register] createUser warning/error:', createError.message)
      if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
        // User exists in auth system. Check if they have a completed profile + tenant
        const { data: existingProf } = await supabaseAdmin
          .from('profiles')
          .select('id, tenant_id')
          .eq('email', emailNormalized)
          .maybeSingle()

        if (existingProf?.tenant_id) {
          return Response.json({ error: 'Este correo electrónico ya está registrado. Por favor, iniciá sesión.' }, { status: 400 })
        }

        // Search in users list
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers()
        const found = usersList?.users?.find(u => u.email === emailNormalized)
        if (found) {
          userId = found.id
          // Update password and confirm email
          await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true })
        } else {
          return Response.json({ error: 'Este correo ya está registrado. Por favor, iniciá sesión.' }, { status: 400 })
        }
      } else {
        return Response.json({ error: createError.message || 'Error al crear usuario en autenticación' }, { status: 400 })
      }
    } else {
      userId = userData.user?.id
    }

    if (!userId) {
      return Response.json({ error: 'No se pudo obtener el identificador de usuario.' }, { status: 500 })
    }

    // 2. Perform onboarding
    if (inviteTenant) {
      // Guest Profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          tenant_id: inviteTenant,
          full_name: full_name || 'Colaborador',
          email: emailNormalized,
          role: inviteRole || 'cashier',
          is_active: true
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('[API Register] Guest profile upsert error:', profileError)
        return Response.json({ error: `Error al vincular perfil: ${profileError.message}` }, { status: 400 })
      }
    } else {
      // Owner Profile & Tenant
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, tenant_id, tenants(id)')
        .eq('id', userId)
        .maybeSingle()

      if (!existingProfile?.tenant_id) {
        const tenantId = randomUUID()
        const slug = generateSlug(business_name || 'Mi Comercio') + '-' + Math.random().toString(36).slice(2, 6)

        let referredById = null
        if (refCode) {
          const { data: refTenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .eq('referral_code', refCode.trim().toUpperCase())
            .maybeSingle()
          if (refTenant) referredById = refTenant.id
        }

        const { error: tenantError } = await supabaseAdmin
          .from('tenants')
          .insert({
            id: tenantId,
            name: business_name || 'Mi Comercio',
            slug,
            business_type: business_type || 'general',
            email: emailNormalized,
            phone: phone || '',
            subscription_plan: subscription_plan || 'professional',
            referred_by_id: referredById,
          })

        if (tenantError) {
          console.error('[API Register] Tenant insert error:', tenantError)
          return Response.json({ error: `Error al crear comercio: ${tenantError.message}` }, { status: 400 })
        }

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
          console.error('[API Register] Owner profile insert error:', profileError)
          return Response.json({ error: `Error al crear perfil: ${profileError.message}` }, { status: 400 })
        }

        // Initial Categories
        const initialCategories = getInitialCategories(business_type || 'general')
        const categoriesToInsert = initialCategories.map(cat => ({
          tenant_id: tenantId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color || '#7C3AED',
        }))

        await supabaseAdmin.from('categories').insert(categoriesToInsert)
      }
    }

    console.log(`[API Register] Account registration completed successfully for ${emailNormalized}`)
    return Response.json({ success: true, email: emailNormalized })
  } catch (err) {
    console.error('[API Register] Exception:', err)
    return Response.json({ error: err.message || 'Excepción interna en servidor.' }, { status: 500 })
  }
}
