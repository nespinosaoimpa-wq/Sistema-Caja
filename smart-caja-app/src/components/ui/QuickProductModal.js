'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'

/**
 * QuickProductModal — Modal para crear un producto rápido cuando el código 
 * de barras escaneado no existe en el inventario.
 *
 * Props:
 *   isOpen: boolean
 *   barcode: string — código de barras pre-llenado
 *   onClose() — callback al cerrar sin guardar
 *   onSaved(product) — callback al guardar el producto (recibe el objeto completo)
 *   mode: 'pos' | 'inventory' — en 'pos' aparece botón "Guardar y agregar al carrito"
 */
export default function QuickProductModal({ isOpen, barcode, onClose, onSaved, mode = 'pos' }) {
  const { tenant } = useAuth()
  const toast = useToast()
  const supabase = createClient()

  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    category_id: '',
    cost_price: '',
    sale_price: '',
    stock_quantity: '0',
    control_stock: true,
  })
  const [errors, setErrors] = useState({})

  // Load categories and pre-fill barcode on open
  useEffect(() => {
    if (!isOpen || !tenant?.id) return
    setForm(prev => ({ ...prev, barcode: barcode || '' }))
    setErrors({})

    const loadCats = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, icon')
        .eq('tenant_id', tenant.id)
        .order('name')
      setCategories(data || [])
      if (data?.length > 0) {
        setForm(prev => ({ ...prev, category_id: data[0].id }))
      }
    }
    loadCats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, barcode, tenant?.id])

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Requerido'
    if (!form.sale_price || parseFloat(form.sale_price) < 0) errs.sale_price = 'Requerido'
    return errs
  }

  const handleSave = async (addToCart = false) => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      const payload = {
        tenant_id: tenant.id,
        name: form.name.trim(),
        barcode: form.barcode || null,
        category_id: form.category_id || null,
        cost_price: parseFloat(form.cost_price) || 0,
        sale_price: parseFloat(form.sale_price),
        stock_quantity: parseFloat(form.stock_quantity) || 0,
        min_stock_alert: 5,
        is_active: true,
        unit_type: 'unit',
        unit_label: 'un',
        control_stock: form.control_stock !== false
      }

      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select('*, categories(name, icon)')
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya existe un producto con este código de barras')
        }
        throw error
      }

      toast.success(`"${data.name}" agregado al inventario`)
      
      // Invalidate cached inventory list
      if (typeof window !== 'undefined' && tenant?.id) {
        localStorage.removeItem(`smartcaja_products_${tenant.id}`)
        localStorage.removeItem(`smartcaja_inventory_products_${tenant.id}`)
      }

      onSaved(data, addToCart)
      
      // Reset form
      setForm({ name: '', barcode: '', category_id: '', cost_price: '', sale_price: '', stock_quantity: '0', control_stock: true })
      setErrors({})
    } catch (err) {
      toast.error(err.message || 'Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const margin = (() => {
    const c = parseFloat(form.cost_price) || 0
    const s = parseFloat(form.sale_price) || 0
    if (!s) return null
    if (!c) return 100
    return (((s - c) / s) * 100).toFixed(0)
  })()

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99990,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#131b2e',
        border: '1px solid #2d3449',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 0',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,178,183,0.1)',
              border: '1px solid rgba(255,178,183,0.2)',
              borderRadius: '20px', padding: '4px 12px',
              marginBottom: '10px',
            }}>
              <span style={{ fontSize: '0.75rem', color: '#ffb4ab', fontWeight: 600 }}>
                🔍 Código no encontrado
              </span>
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>
              Crear Producto Nuevo
            </h2>
            <p style={{ color: '#988d9f', fontSize: '0.8125rem', lineHeight: 1.4 }}>
              Este código no existe en tu inventario. Completá los datos para agregarlo.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#988d9f', fontSize: '1.1rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: '4px',
            }}
          >✕</button>
        </div>

        {/* Barcode pill */}
        {form.barcode && (
          <div style={{ padding: '12px 24px 0' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(221,183,255,0.08)',
              border: '1px solid rgba(221,183,255,0.2)',
              borderRadius: '8px', padding: '8px 14px',
            }}>
              <span style={{ fontSize: '1rem' }}>▌▌▌▌▌</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.9375rem', color: '#ddb7ff', fontWeight: 600, letterSpacing: '1px' }}>
                {form.barcode}
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cfc2d6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Nombre del producto *
            </label>
            <input
              className="form-input"
              placeholder="Ej: Coca Cola 500ml"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              autoFocus
              style={errors.name ? { borderColor: '#ffb4ab' } : {}}
            />
            {errors.name && <span style={{ fontSize: '0.75rem', color: '#ffb4ab', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cfc2d6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Categoría
              </label>
              <select
                className="form-select"
                value={form.category_id}
                onChange={e => update('category_id', e.target.value)}
              >
                <option value="">Sin categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Prices row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cfc2d6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Costo ($)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#988d9f', pointerEvents: 'none' }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={form.cost_price}
                  onChange={e => update('cost_price', e.target.value)}
                  style={{ paddingLeft: '28px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cfc2d6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Precio Venta ($) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4edea3', pointerEvents: 'none' }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={form.sale_price}
                  onChange={e => update('sale_price', e.target.value)}
                  style={{ paddingLeft: '28px', borderColor: errors.sale_price ? '#ffb4ab' : undefined }}
                />
              </div>
              {errors.sale_price && <span style={{ fontSize: '0.75rem', color: '#ffb4ab', marginTop: '4px', display: 'block' }}>{errors.sale_price}</span>}
            </div>
          </div>

          {/* Margin indicator */}
          {margin !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
              padding: '8px 12px', marginTop: '-4px',
            }}>
              <span style={{ fontSize: '0.8125rem', color: '#988d9f' }}>Margen:</span>
              <span style={{
                fontWeight: 700, fontSize: '0.9375rem',
                color: margin >= 20 ? '#4edea3' : margin >= 10 ? '#ffb2b7' : '#ffb4ab',
              }}>{margin}%</span>
              {margin < 10 && <span style={{ fontSize: '0.75rem', color: '#ffb4ab' }}>Margen muy bajo</span>}
            </div>
          )}

          {/* Control Stock Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid #2d3449' }}>
            <input
              type="checkbox"
              checked={form.control_stock !== false}
              onChange={e => update('control_stock', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
            />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>Controlar Stock</div>
              <div style={{ fontSize: '0.6875rem', color: '#988d9f' }}>Permite venta libre sin indicar stock.</div>
            </div>
          </div>

          {/* Stock */}
          {form.control_stock !== false && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cfc2d6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Stock Inicial
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="form-input"
                value={form.stock_quantity}
                onChange={e => update('stock_quantity', e.target.value)}
              />
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1px solid #2d3449', margin: '2px 0' }} />

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mode === 'pos' ? (
              <>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(135deg, #b76dff, #ddb7ff)',
                    border: 'none', borderRadius: '12px',
                    color: '#060e20', fontWeight: 800, fontSize: '0.9375rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {saving ? '⏳ Guardando...' : '🛒 Guardar y Agregar al Carrito'}
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  style={{
                    width: '100%', padding: '12px',
                    background: 'transparent',
                    border: '1px solid #2d3449', borderRadius: '12px',
                    color: '#cfc2d6', fontWeight: 600, fontSize: '0.875rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  Solo guardar en inventario
                </button>
              </>
            ) : (
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #b76dff, #ddb7ff)',
                  border: 'none', borderRadius: '12px',
                  color: '#060e20', fontWeight: 800, fontSize: '0.9375rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? '⏳ Guardando...' : '✅ Guardar Producto'}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'transparent', border: 'none',
                color: '#988d9f', fontSize: '0.875rem', cursor: 'pointer', padding: '4px',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
