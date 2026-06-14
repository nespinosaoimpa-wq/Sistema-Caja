import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY || ''
const resend = resendApiKey ? new Resend(resendApiKey) : null

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

    let isNew = true
    if (error) {
      // If it is a duplicate email, just return success so the user doesn't get an error
      if (error.message.includes('unique constraint') || error.code === '23505') {
        isNew = false
      } else {
        throw error
      }
    }

    // Send email using Resend
    if (resend) {
      try {
        const origin = req.nextUrl.origin
        const downloadUrl = `${origin}/5-formas-dejar-de-perder-plata.pdf`
        const registerUrl = `${origin}/register?coupon=LANZAMIENTO50`
        const supportWhatsapp = `https://wa.me/543425162372?text=Hola%20Smart%20Caja,%20tengo%20una%20consulta%20sobre%20la%20guia%20de%20fugas`
        
        await resend.emails.send({
          from: 'Smart Caja <hola@cajasmart.com.ar>',
          to: [email.trim().toLowerCase()],
          subject: '🎁 Tu Guía Gratuita: 5 formas de dejar de perder plata en tu comercio',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed; font-size: 24px; margin-bottom: 8px;">¡Hola${name ? ' ' + name : ''}!</h1>
                <p style="font-size: 16px; color: #64748b; margin: 0;">Gracias por interesarte en mejorar el control de tu negocio.</p>
              </div>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px; text-align: center;">
                <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Tu guía gratuita está lista para descargar</h2>
                <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Haz clic en el siguiente botón para descargar el PDF "5 formas de dejar de perder plata en tu comercio":</p>
                <a href="${downloadUrl}" target="_blank" style="display: inline-block; background: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.15);">
                  Descargar Guía PDF 🚀
                </a>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; margin-bottom: 30px;">
                <h3 style="font-size: 16px; color: #0f172a; margin-top: 0;">¿Querés digitalizar tu stock y controlar tu caja hoy mismo?</h3>
                <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">
                  Smart Caja es la plataforma definitiva para kioscos, almacenes y comercios minoristas. Carga tus productos con código de barras, controla turnos de cajeros, elimina los cuadernos de fiados y mira tus estadísticas en tiempo real.
                </p>
                <a href="${registerUrl}" target="_blank" style="display: inline-block; background: #10b981; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
                  Empezar Prueba Gratis de 14 Días →
                </a>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
                <p style="margin: 0 0 8px 0;">Si tenés alguna duda, respondé a este correo o escribinos a nuestro <a href="${supportWhatsapp}" style="color: #25d366; text-decoration: none; font-weight: bold;">WhatsApp de Soporte</a>.</p>
                <p style="margin: 0;">© 2026 Smart Caja. Todos los derechos reservados.</p>
              </div>
            </div>
          `
        })
      } catch (emailErr) {
        console.error('[leads] Error sending email via Resend:', emailErr)
      }
    }

    return NextResponse.json({ success: true, message: isNew ? 'Lead registrado' : 'Lead ya registrado' })

  } catch (error) {
    console.error('[leads] POST Error:', error)
    return NextResponse.json({ error: 'Error al registrar el correo' }, { status: 500 })
  }
}

