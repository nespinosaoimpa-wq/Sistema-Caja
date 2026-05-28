import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PLAN_PRICES = {
  basic: { name: 'Básico', price: 20000 },
  professional: { name: 'Profesional', price: 35000 },
  enterprise: { name: 'Empresa', price: 60000 }
}

export async function POST(req) {
  try {
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!mpAccessToken) {
      return NextResponse.json(
        { error: 'El sistema de pagos no está configurado. Contactá al administrador.' },
        { status: 503 }
      )
    }

    const { planId, tenantId, email } = await req.json()

    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }
    if (!tenantId || !email) {
      return NextResponse.json({ error: 'Datos de cuenta incompletos' }, { status: 400 })
    }

    const plan = PLAN_PRICES[planId]
    const origin = new URL(req.url).origin

    // Build the preapproval request
    const preapprovalBody = {
      payer_email: email,
      reason: `Smart Caja — Plan ${plan.name}`,
      external_reference: `${tenantId}:${planId}`,
      back_url: `${origin}/billing/success?plan=${planId}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plan.price,
        currency_id: 'ARS',
      },
      status: 'pending',
    }

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preapprovalBody),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[billing/subscribe] MP API error:', JSON.stringify(data))
      return NextResponse.json(
        { error: 'Error al comunicarse con Mercado Pago. Intentá de nuevo.' },
        { status: 502 }
      )
    }

    // Log the subscription creation
    console.log(`[billing/subscribe] Preapproval created: ${data.id} for tenant ${tenantId} plan ${planId}`)

    // Optionally store the preapproval id immediately
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseServiceKey) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseServiceKey,
        { auth: { persistSession: false } }
      )
      await supabaseAdmin.from('subscription_events').insert({
        tenant_id: tenantId,
        event_type: 'subscription_created',
        mp_subscription_id: data.id,
        plan_id: planId,
        amount: plan.price,
        status_before: 'trial',
        status_after: 'pending',
        raw_payload: data,
      }).catch(err => console.warn('[billing/subscribe] Could not log event:', err.message))
    }

    return NextResponse.json({
      init_point: data.init_point,
      preapproval_id: data.id,
    })

  } catch (error) {
    console.error('[billing/subscribe] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor. Intentá de nuevo.' },
      { status: 500 }
    )
  }
}
