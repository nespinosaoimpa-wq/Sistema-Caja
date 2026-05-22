import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
const client = new MercadoPagoConfig({ accessToken: mpAccessToken })

// Usamos el Service Role para saltarnos RLS y actualizar el tenant
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
    
    // MercadoPago envía notificaciones de distintos temas
    if (body.type === 'payment') {
      const paymentId = body.data.id
      
      const payment = new Payment(client)
      const paymentInfo = await payment.get({ id: paymentId })
      
      if (paymentInfo.status === 'approved') {
        const tenant_id = paymentInfo.external_reference
        
        // Determinar qué plan se pagó en base a la descripción o monto
        let newPlan = 'professional'
        if (paymentInfo.transaction_amount >= 60000) {
          newPlan = 'enterprise'
        }

        if (tenant_id) {
          // Actualizamos la base de datos
          const { error } = await supabase
            .from('tenants')
            .update({ 
              subscription_plan: newPlan,
              subscription_status: 'active'
            })
            .eq('id', tenant_id)
            
          if (error) {
            console.error('Error actualizando tenant en DB:', error)
          } else {
            console.log(`✅ Tenant ${tenant_id} actualizado a plan ${newPlan}`)
          }
        }
      }
    }
    
    // MP espera un 200 rápido
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Error procesando webhook MP:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
