import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Configurar cliente de MercadoPago
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
const client = new MercadoPagoConfig({ accessToken: mpAccessToken })

export async function POST(req) {
  try {
    const { plan, tenant_id } = await req.json()

    if (!plan || !tenant_id) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    if (!mpAccessToken) {
      return NextResponse.json({ error: 'MercadoPago no configurado' }, { status: 500 })
    }

    let price = 0
    let title = ''

    if (plan === 'professional') {
      price = 35000
      title = 'Smart Caja - Plan Profesional'
    } else if (plan === 'enterprise') {
      price = 60000
      title = 'Smart Caja - Plan Empresa'
    } else {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Crear preferencia en MercadoPago
    const preference = new Preference(client)
    
    // Configurar la URL de retorno a donde volverá el usuario tras pagar
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const response = await preference.create({
      body: {
        items: [
          {
            id: plan,
            title: title,
            quantity: 1,
            unit_price: price,
            currency_id: 'ARS',
          }
        ],
        // Usamos external_reference para guardar el tenant_id y saber a quién asignarle el pago
        external_reference: tenant_id,
        back_urls: {
          success: `${baseUrl}/settings?payment=success`,
          pending: `${baseUrl}/settings?payment=pending`,
          failure: `${baseUrl}/settings?payment=failure`,
        },
        auto_return: 'approved',
      }
    })

    return NextResponse.json({ init_point: response.init_point })

  } catch (error) {
    console.error('Error al crear preferencia MP:', error)
    return NextResponse.json({ error: 'Error interno al procesar el pago' }, { status: 500 })
  }
}
