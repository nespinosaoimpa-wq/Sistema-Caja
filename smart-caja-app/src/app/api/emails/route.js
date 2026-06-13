import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY || ''
const resend = resendApiKey ? new Resend(resendApiKey) : null

const AUTH_TOKEN = 'sc_secure_mail_trigger_token_2026_9b8a7c'

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, html } = await req.json()

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    if (!resend) {
      // Si no hay API key, solo lo logueamos en la consola para no romper el flujo
      console.log('--- MOCK EMAIL ---')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('--- END EMAIL ---')
      return NextResponse.json({ success: true, mocked: true })
    }

    const data = await resend.emails.send({
      from: 'Smart Caja <hola@cajasmart.com.ar>', // Cambiar a tu dominio verificado
      to: [to],
      subject: subject,
      html: html,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error al enviar email:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
