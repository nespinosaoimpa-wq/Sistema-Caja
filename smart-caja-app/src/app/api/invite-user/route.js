import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
  try {
    const { email, full_name, role, branch_id, password } = await request.json()
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

    const supabaseAdmin = createAdminClient()

    // 2. Obtener el perfil del usuario que invita
    const { data: inviterProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !inviterProfile) {
      return Response.json({ error: 'No se encontró el perfil del invitador' }, { status: 403 })
    }

    // Solo dueños o administradores pueden invitar
    if (inviterProfile.role !== 'owner' && inviterProfile.role !== 'admin') {
      return Response.json({ error: 'No tienes permisos para invitar colaboradores' }, { status: 403 })
    }

    const tenantId = inviterProfile.tenant_id
    const emailNormalized = email.trim().toLowerCase()

    // Contraseña asignada: la que ingresó el dueño o una automática fácil
    const assignedPassword = password && password.trim().length >= 6 
      ? password.trim() 
      : `caja${Math.floor(1000 + Math.random() * 9000)}`

    // A. Verificar si el usuario ya existe en la tabla profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, tenant_id, full_name, email, role')
      .eq('email', emailNormalized)
      .maybeSingle()

    if (existingProfile) {
      if (existingProfile.tenant_id === tenantId) {
        // Mismo comercio: actualizar datos y credenciales
        await supabaseAdmin
          .from('profiles')
          .update({
            full_name,
            role,
            is_active: true,
            branch_id: branchId
          })
          .eq('id', existingProfile.id)

        await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
          password: assignedPassword,
          email_confirm: true,
          user_metadata: { full_name, tenant_id: tenantId, role }
        })

        return Response.json({
          success: true,
          method: 'existing_member_updated',
          email: emailNormalized,
          password: assignedPassword,
          message: 'Colaborador actualizado con éxito. Ya puede iniciar sesión con la nueva contraseña.'
        })
      } else {
        // En otro comercio: si es owner, no permitir degradación
        if (existingProfile.role === 'owner') {
          return Response.json({
            error: 'El correo electrónico ya está registrado como dueño de otro comercio y no puede ser invitado como colaborador.'
          }, { status: 400 })
        }

        // Si es cajero o empleado en otro comercio, transferir
        await supabaseAdmin
          .from('profiles')
          .update({
            tenant_id: tenantId,
            full_name,
            role,
            is_active: true,
            branch_id: branchId
          })
          .eq('id', existingProfile.id)

        await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
          password: assignedPassword,
          email_confirm: true,
          user_metadata: { full_name, tenant_id: tenantId, role }
        })

        return Response.json({
          success: true,
          method: 'existing_member_transferred',
          email: emailNormalized,
          password: assignedPassword,
          message: `El colaborador con email ${emailNormalized} ha sido transferido a tu comercio.`
        })
      }
    }

    // B. Crear el usuario directamente con contraseña activa y confirmada
    const { data: createdAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalized,
      password: assignedPassword,
      email_confirm: true,
      user_metadata: { full_name, tenant_id: tenantId, role }
    })

    let userId = createdAuthUser?.user?.id

    if (createAuthError) {
      // Si ya existía en auth.users pero no en profiles:
      if (createAuthError.message?.toLowerCase().includes('already') || createAuthError.message?.toLowerCase().includes('registered')) {
        let page = 1
        let foundUser = null
        while (true) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 })
          if (!users || users.length === 0) break
          foundUser = users.find(u => u.email?.toLowerCase() === emailNormalized)
          if (foundUser) break
          if (users.length < 100) break
          page++
        }

        if (foundUser) {
          userId = foundUser.id
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: assignedPassword,
            email_confirm: true,
            user_metadata: { full_name, tenant_id: tenantId, role }
          })
        } else {
          return Response.json({ error: createAuthError.message }, { status: 400 })
        }
      } else {
        return Response.json({ error: createAuthError.message }, { status: 400 })
      }
    }

    // C. Asegurar que el perfil exista en la tabla profiles
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        tenant_id: tenantId,
        full_name,
        email: emailNormalized,
        role,
        branch_id: branchId,
        is_active: true
      })

    if (profileInsertError) {
      console.error('Error al insertar perfil del colaborador:', profileInsertError)
      return Response.json({ error: 'Usuario creado pero falló creación de perfil: ' + profileInsertError.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      method: 'direct_created',
      email: emailNormalized,
      password: assignedPassword,
      message: `¡Colaborador ${full_name} creado con éxito!`
    })

  } catch (err) {
    console.error('Excepción en invite-user:', err)
    return Response.json({ error: err.message || 'Excepción interna' }, { status: 500 })
  }
}
