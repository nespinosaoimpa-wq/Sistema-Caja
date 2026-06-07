'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { Trash2, Save, Plus, ArrowLeft, Tag } from 'lucide-react'

export default function ProductVariantsPage() {
  const { id } = useParams()
  const { tenant } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // State for new variant
  const [newSize, setNewSize] = useState('')
  const [newColor, setNewColor] = useState('')
  const [newColorHex, setNewColorHex] = useState('#000000')
  const [newSku, setNewSku] = useState('')
  const [newStock, setNewStock] = useState('0')
  const [newExtraPrice, setNewExtraPrice] = useState('0')

  async function loadData() {
    setLoading(true)
    try {
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single()

      if (prodErr || !prodData) throw new Error('Producto no encontrado')
      setProduct(prodData)

      const { data: varsData, error: varsErr } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id)
        .order('size')
        .order('color')
      
      if (varsErr) throw varsErr
      setVariants(varsData || [])
    } catch (err) {
      toast.error(err.message)
      router.push(`/inventory/${id}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenant?.id && id) {
      loadData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, id])

  const handleAddVariant = async () => {
    if (!newSize.trim() && !newColor.trim()) {
      toast.warning('Ingresá al menos un talle o un color')
      return
    }

    const payload = {
      product_id: id,
      tenant_id: tenant.id,
      sku: newSku.trim() || null,
      size: newSize.trim() || null,
      color: newColor.trim() || null,
      color_hex: newColor.trim() ? newColorHex : null,
      stock_quantity: parseInt(newStock) || 0,
      extra_price: parseFloat(newExtraPrice) || 0,
      is_active: true
    }

    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      setVariants(prev => [...prev, data])
      toast.success('Variante agregada')
      
      // Clear form
      setNewSize('')
      setNewColor('')
      setNewSku('')
      setNewStock('0')
      setNewExtraPrice('0')
      
      // Update parent product stock
      updateParentProductStock([...variants, data])
    } catch (err) {
      toast.error('Error al agregar variante: ' + err.message)
    }
  }

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('¿Eliminar esta variante?')) return
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId)

      if (error) throw error

      const newVariants = variants.filter(v => v.id !== variantId)
      setVariants(newVariants)
      toast.success('Variante eliminada')
      
      updateParentProductStock(newVariants)
    } catch (err) {
      toast.error('Error al eliminar variante: ' + err.message)
    }
  }

  const handleUpdateVariant = (index, field, value) => {
    const updated = [...variants]
    updated[index][field] = value
    setVariants(updated)
  }

  const saveAllVariants = async () => {
    setSaving(true)
    try {
      for (const variant of variants) {
        await supabase
          .from('product_variants')
          .update({
            sku: variant.sku || null,
            size: variant.size || null,
            color: variant.color || null,
            stock_quantity: parseInt(variant.stock_quantity) || 0,
            extra_price: parseFloat(variant.extra_price) || 0,
            is_active: variant.is_active
          })
          .eq('id', variant.id)
      }
      
      toast.success('Variantes guardadas')
      updateParentProductStock(variants)
    } catch (err) {
      toast.error('Error al guardar variantes: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateParentProductStock = async (currentVariants) => {
    const totalStock = currentVariants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0)
    await supabase
      .from('products')
      .update({ stock_quantity: totalStock })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Cargando variantes...
      </div>
    )
  }

  return (
    <div>
      <div className="app-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/inventory/${id}`)}>
            <ArrowLeft size={16} /> Volver
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>
              Variantes del Producto
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product?.name}</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={saveAllVariants} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Variantes'}
          </button>
        </div>
      </div>

      <div className="app-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Add Variant Form */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> Agregar Variante
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-4)', alignItems: 'end' }}>
                <div className="form-group">
                  <label className="form-label">Talle / Tamaño</label>
                  <input 
                    className="form-input" placeholder="Ej: XL, 42..." 
                    value={newSize} onChange={e => setNewSize(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color (Nombre)</label>
                  <input 
                    className="form-input" placeholder="Ej: Rojo" 
                    value={newColor} onChange={e => setNewColor(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color (Hex)</label>
                  <input 
                    type="color" 
                    className="form-input" 
                    style={{ padding: '0', height: '38px', cursor: 'pointer' }}
                    value={newColorHex} onChange={e => setNewColorHex(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input 
                    className="form-input" placeholder="Opcional" 
                    value={newSku} onChange={e => setNewSku(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input 
                    className="form-input" type="number" min="0" 
                    value={newStock} onChange={e => setNewStock(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Extra Precio ($)</label>
                  <input 
                    className="form-input" type="number" min="0" step="0.01" 
                    value={newExtraPrice} onChange={e => setNewExtraPrice(e.target.value)} 
                  />
                </div>
                <button className="btn btn-secondary" onClick={handleAddVariant} style={{ height: '38px' }}>
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Variants List */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={18} /> Variantes Actuales
              </span>
            </div>
            
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Talle</th>
                    <th>Color</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Costo Adicional</th>
                    <th>Activa</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No hay variantes creadas para este producto.
                      </td>
                    </tr>
                  ) : variants.map((variant, idx) => (
                    <tr key={variant.id}>
                      <td>
                        <input 
                          className="form-input" style={{ padding: '4px 8px', height: '30px' }}
                          value={variant.size || ''} 
                          onChange={e => handleUpdateVariant(idx, 'size', e.target.value)}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {variant.color_hex && (
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: variant.color_hex, border: '1px solid var(--border-color)' }}></div>
                          )}
                          <input 
                            className="form-input" style={{ padding: '4px 8px', height: '30px', flex: 1 }}
                            value={variant.color || ''} 
                            onChange={e => handleUpdateVariant(idx, 'color', e.target.value)}
                          />
                        </div>
                      </td>
                      <td>
                        <input 
                          className="form-input" style={{ padding: '4px 8px', height: '30px' }}
                          value={variant.sku || ''} 
                          onChange={e => handleUpdateVariant(idx, 'sku', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" className="form-input" style={{ padding: '4px 8px', height: '30px', width: '80px' }}
                          value={variant.stock_quantity || 0} 
                          onChange={e => handleUpdateVariant(idx, 'stock_quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="form-input-icon">
                          <span className="input-icon" style={{ padding: '0 6px', fontSize: '12px' }}>$</span>
                          <input 
                            type="number" className="form-input" style={{ padding: '4px 8px 4px 20px', height: '30px', width: '90px' }}
                            value={variant.extra_price || 0} 
                            onChange={e => handleUpdateVariant(idx, 'extra_price', e.target.value)}
                          />
                        </div>
                      </td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={variant.is_active} 
                          onChange={e => handleUpdateVariant(idx, 'is_active', e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                        />
                      </td>
                      <td>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => handleDeleteVariant(variant.id)}
                          style={{ color: 'var(--color-danger, #ef4444)' }}
                          title="Eliminar variante"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
