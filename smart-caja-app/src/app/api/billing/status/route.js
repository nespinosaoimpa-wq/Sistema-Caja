import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID requerido' }, { status: 400 })
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!supabaseServiceKey || !mpAccessToken) {
      return NextResponse.json({ error: 'Servicio no configurado' }, { status: 503 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('subscription_status, subscription_plan, mercadopago_subscription_id')
      .eq('id', tenantId)
      .single()

    if (error || !tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    if (!tenant.mercadopago_subscription_id || tenant.subscription_status === 'trial') {
      return NextResponse.json({
        status: tenant.subscription_status,
        plan: tenant.subscription_plan,
      })
    }

    // Check with MP
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${tenant.mercadopago_subscription_id}`, {
      headers: { 'Authorization': `Bearer ${mpAccessToken}` }
    })

    if (!mpResponse.ok) {
      return NextResponse.json({
        status: tenant.subscription_status,
        plan: tenant.subscription_plan,
        warning: 'No se pudo verificar con Mercado Pago en este momento'
      })
    }

    const subscription = await mpResponse.json()

    return NextResponse.json({
      status: tenant.subscription_status,
      plan: tenant.subscription_plan,
      mp_status: subscription.status,
      next_payment: subscription.next_payment_date,
      amount: subscription.auto_recurring?.transaction_amount,
    })

  } catch (error) {
    console.error('[billing/status] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
