'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'

export default function NewProductPage() {
  const { tenant, profile } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()
  const barcodeInputRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    barcode: '',
    reference_code: '',
    category_id: '',
    cost_price: '',
    sale_price: '',
    stock_quantity: '0',
    min_stock_alert: '5',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (tenant?.id) {
      loadCategories()
    }
  }, [tenant?.id])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('name')
    
    setCategories(data || [])
    if (data?.length > 0) {
      setForm(prev => ({ ...prev, category_id: data[0].id }))
    }
  }

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const calculateMargin = () => {
    const cost = parseFloat(form.cost_price || 0)
    const sale = parseFloat(form.sale_price || 0)
    if (cost === 0) return 100
    return (((sale - cost) / sale) * 100).toFixed(1)
  }

  const handleSave = async () => {
    // Validate
    const errs = {}
    if (!form.name.trim()) errs.name = 'Requerido'
    if (!form.category_id) errs.category_id = 'Requerido'
    if (!form.cost_price || parseFloat(form.cost_price) < 0) errs.cost_price = 'Inválido'
    if (!form.sale_price || parseFloat(form.sale_price) < 0) errs.sale_price = 'Inválido'
    if (parseFloat(form.sale_price) < parseFloat(form.cost_price)) {
      errs.sale_price = 'Menor al costo'
    }
    
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast.warning('Por favor revisá los errores en el formulario')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          tenant_id: tenant.id,
          name: form.name,
          description: form.description,
          barcode: form.barcode || null,
          reference_code: form.reference_code || null,
          category_id: form.category_id,
          cost_price: parseFloat(form.cost_price),
          sale_price: parseFloat(form.sale_price),
          stock_quantity: parseInt(form.stock_quantity || 0),
          min_stock_alert: parseInt(form.min_stock_alert || 5),
          is_active: true
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Ya existe un producto con este código de barras o referencia')
        }
        throw error
      }

      toast.success('Producto guardado con éxito')
      router.push('/inventory')
    } catch (err) {
      toast.error(err.message || 'Error al guardar producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="app-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/inventory')}>
            ← Volver
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>
              Nuevo Producto
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-ghost" onClick={() => router.push('/inventory')}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : '💾 Guardar Producto'}
          </button>
        </div>
      </div>

      <div className="app-content">
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Basic Info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Información Básica</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Nombre del producto</label>
                <input 
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Ej: Coca Cola 1.5L Retornable"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  autoFocus
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Categoría</label>
                <select 
                  className={`form-select ${errors.category_id ? 'error' : ''}`}
                  value={form.category_id}
                  onChange={e => updateForm('category_id', e.target.value)}
                >
                  <option value="" disabled>Seleccioná una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <span className="form-error">{errors.category_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <textarea 
                  className="form-input"
                  placeholder="Detalles adicionales..."
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Precios</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', alignItems: 'start' }}>
              <div className="form-group">
                <label className="form-label required">Precio de Costo</label>
                <div className="form-input-icon">
                  <span className="input-icon" style={{ color: 'var(--text-secondary)' }}>$</span>
                  <input 
                    className={`form-input ${errors.cost_price ? 'error' : ''}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.cost_price}
                    onChange={e => updateForm('cost_price', e.target.value)}
                  />
                </div>
                {errors.cost_price && <span className="form-error">{errors.cost_price}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Precio de Venta</label>
                <div className="form-input-icon">
                  <span className="input-icon" style={{ color: 'var(--color-secondary)' }}>$</span>
                  <input 
                    className={`form-input ${errors.sale_price ? 'error' : ''}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.sale_price}
                    onChange={e => updateForm('sale_price', e.target.value)}
                  />
                </div>
                {errors.sale_price && <span className="form-error">{errors.sale_price}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Margen de Ganancia</label>
                <div style={{ 
                  padding: 'var(--space-3)', 
                  background: 'var(--bg-input)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  <span style={{ 
                    fontFamily: 'var(--font-headline)', 
                    fontWeight: 700, 
                    color: calculateMargin() > 0 ? 'var(--color-secondary)' : 'var(--text-muted)'
                  }}>
                    {calculateMargin()}%
                  </span>
                  {calculateMargin() < 20 && form.sale_price && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>Bajo margen</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stock & Codes */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Inventario y Códigos</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Stock Actual</label>
                  <input 
                    className="form-input"
                    type="number"
                    value={form.stock_quantity}
                    onChange={e => updateForm('stock_quantity', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alerta de Stock Bajo (Mínimo)</label>
                  <input 
                    className="form-input"
                    type="number"
                    value={form.min_stock_alert}
                    onChange={e => updateForm('min_stock_alert', e.target.value)}
                  />
                  <span className="form-hint">Te avisaremos cuando el stock baje de este número.</span>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-color)', margin: 'var(--space-4) 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label flex items-center justify-between">
                    <span>Código de Barras</span>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ padding: '2px 8px', fontSize: '0.6875rem' }}
                      onClick={() => {
                        toast.info('Poné el cursor en el campo y escaneá')
                        barcodeInputRef.current?.focus()
                      }}
                    >
                      📷 Escanear
                    </button>
                  </label>
                  <input 
                    ref={barcodeInputRef}
                    className="form-input"
                    placeholder="Escaneá o ingresá manualmente"
                    value={form.barcode}
                    onChange={e => updateForm('barcode', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código Interno (Referencia)</label>
                  <input 
                    className="form-input"
                    placeholder="Ej: BEB-001"
                    value={form.reference_code}
                    onChange={e => updateForm('reference_code', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
