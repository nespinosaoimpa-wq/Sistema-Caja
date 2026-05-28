import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import * as React from 'react'
import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { PaymentFailedEmail } from '@/emails/PaymentFailedEmail'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_for_build')


function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function verifySignature(req, body) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return true // Skip if not configured (log warning)

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  if (!xSignature) return false

  // Parse ts and v1 from x-signature header
  const parts = {}
  xSignature.split(',').forEach(part => {
    const [key, val] = part.split('=')
    if (key && val) parts[key.trim()] = val.trim()
  })

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  // Build the validation string
  const dataId = body.data?.id || ''
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = createHmac('sha256', secret).update(manifest).digest('hex')

  return hmac === v1
}

const STATUS_MAP = {
  authorized: 'active',
  active: 'active',
  paused: 'suspended',
  cancelled: 'cancelled',
  pending: 'trial',
}

export async function POST(req) {
  // Always respond quickly to MP
  try {
    const rawBody = await req.text()
    let body
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    console.log(`[webhook] Received: type=${body.type} action=${body.action}`)

    // Verify HMAC signature
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      const isValid = verifySignature(req, body)
      if (!isValid) {
        console.error('[webhook] Invalid signature — rejecting request')
        return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
      }
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      console.error('[webhook] SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json({ received: true }) // Acknowledge but can't process
    }

    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!mpAccessToken) {
      console.error('[webhook] MERCADOPAGO_ACCESS_TOKEN not configured')
      return NextResponse.json({ received: true })
    }

    // Handle subscription preapproval events
    if (body.type === 'subscription_preapproval' || body.type === 'preapproval') {
      const subscriptionId = body.data?.id
      if (!subscriptionId) {
        return NextResponse.json({ received: true })
      }

      // Fetch subscription details from MP
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` },
      })

      if (!mpResponse.ok) {
        console.error(`[webhook] Failed to fetch preapproval ${subscriptionId}: ${mpResponse.status}`)
        return NextResponse.json({ received: true })
      }

      const subscription = await mpResponse.json()
      const externalRef = subscription.external_reference
      const mpStatus = subscription.status

      if (!externalRef || !externalRef.includes(':')) {
        console.warn(`[webhook] No valid external_reference for subscription ${subscriptionId}`)
        return NextResponse.json({ received: true })
      }

      const [tenantId, planId] = externalRef.split(':')
      const newStatus = STATUS_MAP[mpStatus] || 'trial'

      // Idempotency: check if already processed
      const { data: existingEvents } = await supabaseAdmin
        .from('subscription_events')
        .select('id')
        .eq('mp_subscription_id', subscriptionId)
        .eq('status_after', newStatus)
        .limit(1)

      if (existingEvents && existingEvents.length > 0) {
        console.log(`[webhook] Already processed subscription ${subscriptionId} → ${newStatus}`)
        return NextResponse.json({ received: true })
      }

      // Get current tenant status for audit
      const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('name, subscription_status, subscription_plan')
        .eq('id', tenantId)
        .single()

      const statusBefore = tenant?.subscription_status || 'trial'

      // Update tenant
      const updateData = {
        subscription_status: newStatus,
        mercadopago_subscription_id: subscriptionId,
      }
      // Only change plan if activating
      if (newStatus === 'active' && planId) {
        updateData.subscription_plan = planId
      }

      const { error: updateError } = await supabaseAdmin
        .from('tenants')
        .update(updateData)
        .eq('id', tenantId)

      if (updateError) {
        console.error(`[webhook] Failed to update tenant ${tenantId}:`, updateError)
      } else {
        console.log(`[webhook] Tenant ${tenantId} updated: ${statusBefore} → ${newStatus}`)
        
        // Send welcome email if newly active
        if (statusBefore !== 'active' && newStatus === 'active') {
          const userEmail = subscription.payer_email
          if (userEmail && process.env.RESEND_API_KEY) {
            await resend.emails.send({
              from: 'Smart Caja <onboarding@resend.dev>',
              to: userEmail,
              subject: '¡Suscripción Activada en Smart Caja!',
              react: React.createElement(WelcomeEmail, { userName: tenant?.name || 'Emprendedor', planName: planId })
            }).catch(err => console.error('[webhook] Failed to send welcome email', err))
          }
        }
      }

      // Log audit event
      await supabaseAdmin.from('subscription_events').insert({
        tenant_id: tenantId,
        event_type: `subscription_${mpStatus}`,
        mp_subscription_id: subscriptionId,
        plan_id: planId,
        amount: subscription.auto_recurring?.transaction_amount,
        status_before: statusBefore,
        status_after: newStatus,
        raw_payload: subscription,
      }).catch(err => console.warn('[webhook] Audit log failed:', err.message))
    }

    // Handle authorized payment events (monthly charge confirmations)
    if (body.type === 'subscription_authorized_payment') {
      const paymentId = body.data?.id
      if (paymentId) {
        const mpResponse = await fetch(`https://api.mercadopago.com/authorized_payments/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${mpAccessToken}` },
        })

        if (mpResponse.ok) {
          const payment = await mpResponse.json()
          const subscriptionId = payment.preapproval_id

          if (subscriptionId) {
            // Look up tenant by subscription id
            const { data: tenant } = await supabaseAdmin
              .from('tenants')
              .select('id, name, subscription_plan')
              .eq('mercadopago_subscription_id', subscriptionId)
              .single()

            if (tenant) {
              await supabaseAdmin.from('subscription_events').insert({
                tenant_id: tenant.id,
                event_type: payment.status === 'approved' ? 'payment_approved' : 'payment_rejected',
                mp_subscription_id: subscriptionId,
                mp_payment_id: String(paymentId),
                plan_id: tenant.subscription_plan,
                amount: payment.transaction_amount,
                status_before: 'active',
                status_after: payment.status === 'approved' ? 'active' : 'suspended',
                raw_payload: payment,
              }).catch(err => console.warn('[webhook] Payment audit failed:', err.message))

              // If payment was rejected, suspend the tenant
              if (payment.status !== 'approved') {
                await supabaseAdmin
                  .from('tenants')
                  .update({ subscription_status: 'suspended' })
                  .eq('id', tenant.id)
                console.log(`[webhook] Tenant ${tenant.id} suspended due to failed payment`)
                
                const userEmail = payment.payer?.email
                if (userEmail && process.env.RESEND_API_KEY) {
                  await resend.emails.send({
                    from: 'Smart Caja <onboarding@resend.dev>',
                    to: userEmail,
                    subject: 'Problema con tu pago en Smart Caja',
                    react: React.createElement(PaymentFailedEmail, { userName: tenant?.name || 'Emprendedor' })
                  }).catch(err => console.error('[webhook] Failed to send payment failed email', err))
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('[webhook] Unexpected error:', error)
    // Always return 200 to prevent MP from retrying on our errors
    return NextResponse.json({ received: true })
  }
}
