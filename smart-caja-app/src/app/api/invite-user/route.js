import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { email, full_name, role } = await request.json()
    if (!email || !full_name || !role) {
      return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // 1. Autenticar al usuario que invita
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Obtener el perfil del usuario que invita
    const { data: inviterProfile, error: profileError } = await supabase
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
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    // Validar si la clave de servicio está configurada de manera real
    const hasAdminKey = serviceKey && serviceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE' && serviceKey.trim() !== ''

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

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
        data: { full_name, tenant_id: tenantId, role }
      }
    )

    if (inviteError) {
      return Response.json({ error: inviteError.message }, { status: 400 })
    }

    // 4. Crear perfil asociado en la base de datos
    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: inviteData.user.id,
        tenant_id: tenantId,
        full_name,
        email,
        role
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
