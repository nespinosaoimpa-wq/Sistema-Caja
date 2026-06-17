import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      tenant_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      delivery_mode,
      items, // [{product_id, name, qty, unit_price, variant_label}]
      notes,
    } = body

    if (!tenant_id || !customer_name || !customer_phone || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Create admin/service client to bypass RLS for public orders placement
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let supabase
    if (serviceKey) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Falling back to default server client.')
      const { createClient: createServerClient } = await import('@/lib/supabase/server')
      supabase = await createServerClient()
    }

    // Verify tenant is active and e-commerce enabled
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, ecommerce_enabled, ecommerce_whatsapp, subscription_status')
      .eq('id', tenant_id)
      .single()

    if (!tenant?.ecommerce_enabled) {
      return NextResponse.json({ error: 'E-commerce no habilitado' }, { status: 403 })
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.qty), 0)
    const total = subtotal

    // Generate order number
    const { count } = await supabase
      .from('online_orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)

    const orderNumber = `WEB-${String((count || 0) + 1).padStart(4, '0')}`

    // Insert order
    const { data: order, error } = await supabase
      .from('online_orders')
      .insert({
        tenant_id,
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        delivery_mode: delivery_mode || 'pickup',
        items,
        subtotal,
        total,
        notes,
        status: 'pending',
        payment_status: 'unpaid',
        source: 'online',
      })
      .select()
      .single()

    if (error) throw error

    // Build WhatsApp notification URL for the merchant
    const itemsList = items.map(i => `• ${i.name}${i.variant_label ? ` (${i.variant_label})` : ''} x${i.qty} = $${(i.unit_price * i.qty).toLocaleString('es-AR')}`).join('\n')
    const waMessage = encodeURIComponent(
      `🛒 *Nuevo pedido ${orderNumber}*\n\n` +
      `👤 *Cliente:* ${customer_name}\n` +
      `📞 *Tel:* ${customer_phone}\n` +
      (delivery_mode === 'delivery' ? `📍 *Dirección:* ${customer_address || 'Sin especificar'}\n` : `🏪 *Retira en local*\n`) +
      `\n*Productos:*\n${itemsList}\n\n` +
      `💰 *Total: $${total.toLocaleString('es-AR')}*\n` +
      (notes ? `📝 *Nota:* ${notes}\n` : '') +
      `\n_Pedido recibido desde la tienda online_`
    )

    const waPhone = tenant.ecommerce_whatsapp?.replace(/\D/g, '') || ''
    const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waMessage}` : null

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: orderNumber,
      wa_link: waLink,
    })
  } catch (error) {
    console.error('[API tienda order]', error)
    return NextResponse.json({ error: 'Error al procesar el pedido' }, { status: 500 })
  }
}
