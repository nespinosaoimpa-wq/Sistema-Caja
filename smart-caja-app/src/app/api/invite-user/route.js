import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { email, full_name, role, branch_id } = await request.json()
    if (!email || !full_name || !role) {
      return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    const branchId = (role !== 'owner' && branch_id) ? branch_id : null

    // 1. Autenticar al usuario que invita
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasAdminKey = serviceKey && serviceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE' && serviceKey.trim() !== ''

    // 2. Obtener el perfil del usuario que invita
    let inviterProfile = null
    let profileError = null

    if (hasAdminKey) {
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
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()
      inviterProfile = data
      profileError = error
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()
      inviterProfile = data
      profileError = error
    }

    if (profileError || !inviterProfile) {
      return Response.json({ error: 'No se encontró el perfil del invitador' }, { status: 403 })
    }

    // Solo dueños o administradores pueden invitar
    if (inviterProfile.role !== 'owner' && inviterProfile.role !== 'admin') {
      return Response.json({ error: 'No tienes permisos para invitar colaboradores' }, { status: 403 })
    }

    const tenantId = inviterProfile.tenant_id

    if (!hasAdminKey) {
      // Retornar enlace manual en modo de fallback
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const inviteLink = `${appUrl}/register?invite_tenant=${tenantId}&invite_role=${role}&invite_email=${encodeURIComponent(email)}&invite_name=${encodeURIComponent(full_name)}`
      return Response.json({
        success: true,
        method: 'fallback_link',
        inviteLink
      })
    }

    // 3. Invitar usando cliente admin de Supabase (esquivando RLS)
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

    // A. Check if the user already exists in the profiles table
    const { data: existingProfile, error: profileFindError } = await supabaseAdmin
      .from('profiles')
      .select('id, tenant_id, full_name, email, role')
      .eq('email', emailNormalized)
      .maybeSingle()

    if (existingProfile) {
      if (existingProfile.tenant_id === tenantId) {
        // Already in the same tenant, update their details
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name,
            role,
            is_active: true,
            branch_id: branchId
          })
          .eq('id', existingProfile.id)

        if (updateError) {
          return Response.json({ error: 'Error al actualizar el colaborador existente: ' + updateError.message }, { status: 500 })
        }

        await supabaseAdmin.auth.admin.updateUserById(
          existingProfile.id,
          {
            user_metadata: { full_name, tenant_id: tenantId, role }
          }
        )

        return Response.json({
          success: true,
          method: 'existing_member_updated',
          message: 'El colaborador ya es parte del equipo. Se actualizó su rol y nombre.'
        })
      } else {
        // In another tenant, check if they are the owner
        if (existingProfile.role === 'owner') {
          return Response.json({
            error: 'El correo electrónico ya está registrado como dueño de otro comercio y no puede ser invitado como colaborador.'
          }, { status: 400 })
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            tenant_id: tenantId,
            full_name,
            role,
            is_active: true,
            branch_id: branchId
          })
          .eq('id', existingProfile.id)

        if (updateError) {
          return Response.json({ error: 'Error al transferir colaborador: ' + updateError.message }, { status: 500 })
        }

        await supabaseAdmin.auth.admin.updateUserById(
          existingProfile.id,
          {
            user_metadata: { full_name, tenant_id: tenantId, role }
          }
        )

        return Response.json({
          success: true,
          method: 'existing_member_transferred',
          message: `El colaborador con email ${email} ha sido transferido a tu comercio.`
        })
      }
    }

    // B. Attempt standard invite by email
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      emailNormalized,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
        data: { full_name, tenant_id: tenantId, role }
      }
    )

    if (inviteError) {
      // C. Handle case where user is already registered in Auth but lacks a profile
      if (inviteError.message?.toLowerCase().includes('already been registered') || inviteError.message?.toLowerCase().includes('already registered')) {
        let existingAuthUser = null
        let page = 1
        const perPage = 100
        
        while (true) {
          const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage
          })
          if (listError || !users || users.length === 0) break
          
          const found = users.find(u => u.email?.toLowerCase() === emailNormalized)
          if (found) {
            existingAuthUser = found
            break
          }
          if (users.length < perPage) break
          page++
        }

        if (existingAuthUser) {
          // Double check profile creation
          const { error: insertProfileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: existingAuthUser.id,
              tenant_id: tenantId,
              full_name,
              email: emailNormalized,
              role,
              is_active: true,
              branch_id: branchId
            })
          
          if (insertProfileError) {
            return Response.json({ error: 'Usuario registrado en Auth pero falló creación de perfil: ' + insertProfileError.message }, { status: 500 })
          }

          await supabaseAdmin.auth.admin.updateUserById(
            existingAuthUser.id,
            {
              user_metadata: { full_name, tenant_id: tenantId, role }
            }
          )

          return Response.json({
            success: true,
            method: 'existing_auth_profile_created',
            message: `El colaborador ya tenía cuenta de usuario. Se le asoció a tu comercio con éxito.`
          })
        }
      }

      return Response.json({ error: inviteError.message }, { status: 400 })
    }

    // D. Invite succeeded, create their profile
    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: inviteData.user.id,
        tenant_id: tenantId,
        full_name,
        email: emailNormalized,
        role,
        branch_id: branchId
      })

    if (insertProfileError) {
      console.error('Error al insertar perfil del colaborador invitado:', insertProfileError)
      return Response.json({ error: 'Usuario creado en Auth pero falló creación de perfil: ' + insertProfileError.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      method: 'admin_invite'
    })

  } catch (err) {
    console.error('Excepción en invite-user:', err)
    return Response.json({ error: err.message || 'Excepción interna' }, { status: 500 })
  }
}
