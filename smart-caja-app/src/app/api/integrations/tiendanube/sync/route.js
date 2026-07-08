import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get current tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.tenant_id) {
      return NextResponse.json({ error: 'Comercio no encontrado' }, { status: 404 })
    }

    const tenantId = profile.tenant_id

    // Fetch Tiendanube credentials from tenants table
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('tiendanube_store_id, tiendanube_access_token')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Comercio no encontrado' }, { status: 404 })
    }

    const { tiendanube_store_id: storeId, tiendanube_access_token: accessToken } = tenant

    if (!storeId || !accessToken) {
      return NextResponse.json({ error: 'Debes configurar el Store ID y el Access Token de Tiendanube primero.' }, { status: 400 })
    }

    // Fetch products from Tiendanube API
    const response = await fetch(`https://api.tiendanube.com/v1/${storeId}/products?per_page=100`, {
      headers: {
        'Authentication': `bearer ${accessToken}`,
        'User-Agent': 'SmartCaja (soporte@smartcaja.com)'
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Tiendanube Sync] API Error:', errText)
      return NextResponse.json({ error: 'Error al conectar con la API de Tiendanube. Verifica tus credenciales.' }, { status: response.status })
    }

    const tnProducts = await response.json()
    let importedCount = 0
    let updatedCount = 0

    // Fetch existing categories to avoid redundant DB queries
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('tenant_id', tenantId)

    const categoryMap = new Map(existingCategories?.map(c => [c.name.toLowerCase(), c.id]) || [])

    for (const tnProduct of tnProducts) {
      // 1. Process category
      let categoryId = null
      if (tnProduct.categories && tnProduct.categories.length > 0) {
        const tnCat = tnProduct.categories[0]
        const catName = tnCat.name.es || tnCat.name.en || Object.values(tnCat.name)[0] || 'Tiendanube'
        const normalizedCatName = catName.trim()
        const catKey = normalizedCatName.toLowerCase()

        if (categoryMap.has(catKey)) {
          categoryId = categoryMap.get(catKey)
        } else {
          // Create new category
          const { data: newCat, error: newCatError } = await supabase
            .from('categories')
            .insert({
              tenant_id: tenantId,
              name: normalizedCatName,
              color: '#7C3AED',
              icon: '📦'
            })
            .select()
            .single()

          if (!newCatError && newCat) {
            categoryId = newCat.id
            categoryMap.set(catKey, newCat.id)
          }
        }
      }

      // 2. Check if product already exists in Smart Caja (by tiendanube_id or barcode or SKU)
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id, has_variants')
        .eq('tenant_id', tenantId)
        .eq('tiendanube_id', String(tnProduct.id))
        .maybeSingle()

      const basePrice = parseFloat(tnProduct.variants?.[0]?.price || tnProduct.price || 0)
      const isWeight = false
      const unitType = 'unit'
      const unitLabel = 'u'

      // First image
      const imageUrl = tnProduct.images?.[0]?.src || null

      const productPayload = {
        tenant_id: tenantId,
        category_id: categoryId,
        name: tnProduct.name.es || tnProduct.name.en || Object.values(tnProduct.name)[0] || 'Producto Tiendanube',
        description: tnProduct.description?.es || tnProduct.description?.en || Object.values(tnProduct.description || {})[0] || null,
        sale_price: basePrice,
        image_url: imageUrl,
        tiendanube_id: String(tnProduct.id),
        has_variants: tnProduct.variants?.length > 1,
        show_in_store: true,
        is_active: true
      }

      let productId = null

      if (existingProduct) {
        // Update product
        const { error: updateError } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', existingProduct.id)

        if (updateError) {
          console.error('[Tiendanube Sync] Error updating product:', updateError)
          continue
        }
        productId = existingProduct.id
        updatedCount++
      } else {
        // Insert product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(productPayload)
          .select()
          .single()

        if (insertError) {
          console.error('[Tiendanube Sync] Error inserting product:', insertError)
          continue
        }
        productId = newProduct.id
        importedCount++
      }

      // 3. Process variants if has_variants is true
      if (tnProduct.variants && tnProduct.variants.length > 0) {
        const hasVariants = tnProduct.variants.length > 1

        if (hasVariants) {
          // Get existing variants for this product to avoid duplicates
          const { data: existingVariants } = await supabase
            .from('product_variants')
            .select('id, tiendanube_id')
            .eq('product_id', productId)

          const variantMap = new Map(existingVariants?.map(v => [v.tiendanube_id, v.id]) || [])

          let totalStock = 0

          for (const tnVariant of tnProduct.variants) {
            // Map values to size/color
            let size = null
            let color = null
            
            if (tnVariant.values && tnVariant.values.length > 0) {
              const txts = tnVariant.values.map(val => val.es || val.en || Object.values(val)[0] || '')
              if (txts.length === 1) {
                const val = txts[0]
                if (['s','m','l','xl','xxl','xxxl'].includes(val.toLowerCase()) || !isNaN(val) || val.includes('/')) {
                  size = val
                } else {
                  color = val
                }
              } else if (txts.length >= 2) {
                size = txts[0]
                color = txts[1]
              }
            }

            const variantPrice = parseFloat(tnVariant.price || 0)
            const extraPrice = Math.max(0, variantPrice - basePrice)
            const stockQty = parseFloat(tnVariant.stock !== null ? tnVariant.stock : 0)
            totalStock += stockQty

            const variantPayload = {
              product_id: productId,
              tenant_id: tenantId,
              size,
              color,
              sku: tnVariant.sku || null,
              stock_quantity: stockQty,
              extra_price: extraPrice,
              tiendanube_id: String(tnVariant.id),
              is_active: true
            }

            const vId = variantMap.get(String(tnVariant.id))
            if (vId) {
              // Update variant
              await supabase
                .from('product_variants')
                .update(variantPayload)
                .eq('id', vId)
            } else {
              // Insert variant
              await supabase
                .from('product_variants')
                .insert(variantPayload)
            }
          }

          // Update parent product's stock_quantity with total of variants
          await supabase
            .from('products')
            .update({ stock_quantity: totalStock })
            .eq('id', productId)

        } else {
          // Single variant: just update stock_quantity on the product directly
          const singleVariant = tnProduct.variants[0]
          const stockQty = parseFloat(singleVariant.stock !== null ? singleVariant.stock : 0)
          
          await supabase
            .from('products')
            .update({ stock_quantity: stockQty, barcode: singleVariant.sku || null })
            .eq('id', productId)
        }
      }
    }

    // Update last sync time
    await supabase
      .from('tenants')
      .update({ tiendanube_last_sync: new Date().toISOString() })
      .eq('id', tenantId)

    return NextResponse.json({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      total: tnProducts.length
    })

  } catch (error) {
    console.error('[API Tiendanube Sync Exception]', error)
    return NextResponse.json({ error: 'Error interno del servidor al sincronizar' }, { status: 500 })
  }
}
