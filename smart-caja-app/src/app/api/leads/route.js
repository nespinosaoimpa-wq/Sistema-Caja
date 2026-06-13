import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const { name, email, business_type } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Servicio no configurado' }, { status: 503 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        name: name || null,
        email: email.trim().toLowerCase(),
        business_type: business_type || null
      })
      .select()
      .single()

    if (error) {
      // If it is a duplicate email, just return success so the user doesn't get an error
      if (error.message.includes('unique constraint') || error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Lead ya registrado' })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('[leads] POST Error:', error)
    return NextResponse.json({ error: 'Error al registrar el correo' }, { status: 500 })
  }
}
