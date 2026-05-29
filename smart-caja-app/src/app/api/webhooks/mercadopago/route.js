import { NextResponse } from 'next/server'

/**
 * Legacy webhook endpoint kept for backwards compatibility.
 * Mercado Pago may have this URL configured from a previous version.
 * 
 * This endpoint forwards ALL incoming webhook events to the canonical
 * /api/billing/webhook handler, which handles preapproval subscriptions
 * correctly with HMAC verification, audit logging and email notifications.
 */
export async function POST(req) {
  try {
    // Read the raw body once
    const rawBody = await req.text()

    // Build forwarding URL to the canonical webhook handler
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`
    const forwardUrl = `${baseUrl}/api/billing/webhook`

    // Forward all original headers (especially x-signature, x-request-id used by HMAC verification)
    const forwardHeaders = {
      'Content-Type': 'application/json',
    }
    
    // Pass through MercadoPago signature headers for HMAC verification
    const signatureHeader = req.headers.get('x-signature')
    const requestIdHeader = req.headers.get('x-request-id')
    if (signatureHeader) forwardHeaders['x-signature'] = signatureHeader
    if (requestIdHeader) forwardHeaders['x-request-id'] = requestIdHeader

    console.log(`[webhooks/mercadopago] Forwarding to ${forwardUrl}`)

    const response = await fetch(forwardUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body: rawBody,
    })

    const data = await response.json().catch(() => ({ received: true }))

    // Always return 200 to Mercado Pago to prevent retries
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('[webhooks/mercadopago] Error forwarding webhook:', error)
    // Return 200 to prevent Mercado Pago retries even on error
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
