import { NextResponse } from 'next/server'

// Unified checkout route — delegates to /api/billing/subscribe for recurring subscriptions.
// Supports: basic ($20.000), professional ($35.000), enterprise ($60.000)

const PLAN_PRICES = {
  test: { name: 'Prueba', price: 50 },
  basic: { name: 'Básico', price: 20000 },
  professional: { name: 'Profesional', price: 35000 },
  enterprise: { name: 'Empresa', price: 60000 },
}

export async function POST(req) {
  try {
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!mpAccessToken) {
      return NextResponse.json(
        { error: 'El sistema de pagos aún no está configurado. Contactá al administrador.' },
        { status: 503 }
      )
    }

    const body = await req.json()

    // Accept both naming conventions for backwards compatibility:
    // Old callers send: { plan, tenant_id }
    // New callers send: { planId, tenantId, email }
    const planId = body.planId || body.plan
    const tenantId = body.tenantId || body.tenant_id
    const email = body.email || null

    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json({ error: 'Plan inválido. Planes disponibles: basic, professional, enterprise.' }, { status: 400 })
    }
    if (!tenantId) {
      return NextResponse.json({ error: 'Datos de cuenta incompletos (tenant_id requerido).' }, { status: 400 })
    }

    const plan = PLAN_PRICES[planId]
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Build the preapproval request (recurring monthly subscription)
    const preapprovalBody = {
      payer_email: email || undefined,
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
      console.error('[checkout] MP API error:', JSON.stringify(data))
      return NextResponse.json(
        { error: 'Error al comunicarse con Mercado Pago. Intentá de nuevo.' },
        { status: 502 }
      )
    }

    console.log(`[checkout] Preapproval created: ${data.id} for tenant ${tenantId} plan ${planId}`)

    return NextResponse.json({
      init_point: data.init_point,
      preapproval_id: data.id,
    })

  } catch (error) {
    console.error('[checkout] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno al procesar el pago' }, { status: 500 })
  }
}
