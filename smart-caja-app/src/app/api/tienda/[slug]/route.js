import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    
    // Create admin/service client to bypass RLS for public storefront
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

    // Get tenant by slug (no auth required — public endpoint)
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, business_type, logo_url, ecommerce_enabled, ecommerce_description, ecommerce_banner, ecommerce_delivery_modes, theme_config, ecommerce_hours, ecommerce_show_out_of_stock')
      .eq('slug', slug)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
    }

    if (!tenant.ecommerce_enabled) {
      return NextResponse.json({ error: 'Esta tienda no está disponible' }, { status: 403 })
    }

    // Get public products
    let query = supabase
      .from('products')
      .select(`
        id, name, description, sale_price, image_url, category_id,
        unit_type, unit_label, stock_quantity, barcode, has_variants,
        categories!products_category_id_fkey(name, icon, color),
        product_variants(id, size, color, color_hex, stock_quantity, extra_price)
      `)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .eq('show_in_store', true)

    if (tenant.ecommerce_show_out_of_stock === false) {
      query = query.gt('stock_quantity', 0)
    }

    const { data: products, error: productsError } = await query.order('name')

    if (productsError) throw productsError

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        business_type: tenant.business_type,
        logo_url: tenant.logo_url,
        ecommerce_description: tenant.ecommerce_description,
        ecommerce_banner: tenant.ecommerce_banner,
        ecommerce_delivery_modes: tenant.ecommerce_delivery_modes || ['pickup'],
        primary_color: tenant.theme_config?.primary_color || '#7C3AED',
        ecommerce_hours: tenant.ecommerce_hours,
        ecommerce_show_out_of_stock: tenant.ecommerce_show_out_of_stock,
      },
      products: products || [],
    })
  } catch (error) {
    console.error('[API tienda slug]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
