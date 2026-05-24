'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { Trash2, Save, Camera, Package, Plus, Minus, Check, AlertTriangle } from 'lucide-react'

const UNIT_LABELS = {
  unit: [{ value: 'un', label: 'Unidad (un)' }],
  weight: [
    { value: 'kg', label: 'Kilogramo (kg)' },
    { value: 'g', label: 'Gramo (g)' },
    { value: 'lb', label: 'Libra (lb)' },
  ],
  volume: [
    { value: 'l', label: 'Litro (l)' },
    { value: 'ml', label: 'Mililitro (ml)' },
  ],
}

const UNIT_TYPE_DEFAULTS = {
  unit: 'un',
  weight: 'kg',
  volume: 'l',
}

export default function EditProductPage() {
  const { id } = useParams()
  const { tenant, profile } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()
  const barcodeInputRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
    unit_type: 'unit',
    unit_label: 'un',
  })
  const [errors, setErrors] = useState({})

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📦', color: '#10B981' })
  const [creatingCategory, setCreatingCategory] = useState(false)

  // Stock adjustment state
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: '',
    type: 'add', // 'add' or 'subtract'
    reason: '',
  })
  const [adjustingStock, setAdjustingStock] = useState(false)

  useEffect(() => {
    if (tenant?.id && id) {
      loadProduct()
      loadCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, id])

  async function loadProduct() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single()

      if (error || !data) {
        toast.error('Producto no encontrado')
        router.push('/inventory')
        return
      }

      setForm({
        name: data.name || '',
        description: data.description || '',
        barcode: data.barcode || '',
        reference_code: data.reference_code || '',
        category_id: data.category_id || '',
        cost_price: data.cost_price?.toString() || '',
        sale_price: data.sale_price?.toString() || '',
        stock_quantity: data.stock_quantity?.toString() || '0',
        min_stock_alert: data.min_stock_alert?.toString() || '5',
        unit_type: data.unit_type || 'unit',
        unit_label: data.unit_label || 'un',
      })
    } catch (err) {
      toast.error('Error cargando producto')
      router.push('/inventory')
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('name')

    setCategories(data || [])
  }

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const handleUnitTypeChange = (newType) => {
    updateForm('unit_type', newType)
    setForm(prev => ({ ...prev, unit_label: UNIT_TYPE_DEFAULTS[newType] }))
  }

  const calculateMargin = () => {
    const cost = parseFloat(form.cost_price || 0)
    const sale = parseFloat(form.sale_price || 0)
    if (cost === 0) return 100
    return (((sale - cost) / sale) * 100).toFixed(1)
  }

  const handleSave = async () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Requerido'
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

    setSaving(true)

    try {
      const isDecimalStock = form.unit_type === 'weight' || form.unit_type === 'volume'
      const { error } = await supabase
        .from('products')
        .update({
          name: form.name,
          description: form.description,
          barcode: form.barcode || null,
          reference_code: form.reference_code || null,
          category_id: form.category_id || null,
          cost_price: parseFloat(form.cost_price),
          sale_price: parseFloat(form.sale_price),
          stock_quantity: isDecimalStock ? parseFloat(form.stock_quantity || 0) : parseInt(form.stock_quantity || 0),
          min_stock_alert: isDecimalStock ? parseFloat(form.min_stock_alert || 5) : parseInt(form.min_stock_alert || 5),
          unit_type: form.unit_type,
          unit_label: form.unit_label,
        })
        .eq('id', id)
        .eq('tenant_id', tenant.id)

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya existe un producto con este código de barras o referencia')
        }
        throw error
      }

      toast.success('Producto actualizado con éxito')
      router.push('/inventory')
    } catch (err) {
      toast.error(err.message || 'Error al actualizar producto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id)

      if (error) throw error

      toast.success('Producto eliminado')
      router.push('/inventory')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar producto')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleStockAdjustment = async () => {
    const qty = parseFloat(stockAdjustment.quantity)
    if (!qty || qty <= 0) {
      toast.warning('Ingresá una cantidad válida')
      return
    }
    if (!stockAdjustment.reason.trim()) {
      toast.warning('Ingresá un motivo para el ajuste')
      return
    }

    setAdjustingStock(true)
    try {
      const currentStock = parseFloat(form.stock_quantity || 0)
      const delta = stockAdjustment.type === 'add' ? qty : -qty
      const newStock = currentStock + delta

      if (newStock < 0) {
        toast.warning('El stock no puede quedar negativo')
        setAdjustingStock(false)
        return
      }

      // Insert stock movement
      const { error: movError } = await supabase
        .from('stock_movements')
        .insert({
          tenant_id: tenant.id,
          product_id: id,
          quantity: delta,
          type: stockAdjustment.type === 'add' ? 'entry' : 'exit',
          reason: stockAdjustment.reason,
          performed_by: profile?.id || null,
        })

      if (movError) throw movError

      // Update product stock
      const { error: updError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', id)
        .eq('tenant_id', tenant.id)

      if (updError) throw updError

      // Update local state
      setForm(prev => ({ ...prev, stock_quantity: newStock.toString() }))
      setStockAdjustment({ quantity: '', type: 'add', reason: '' })
      toast.success(`Stock ${stockAdjustment.type === 'add' ? 'agregado' : 'descontado'} exitosamente`)
    } catch (err) {
      toast.error(err.message || 'Error al ajustar stock')
    } finally {
      setAdjustingStock(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.warning('Ingresá un nombre para la categoría')
      return
    }
    setCreatingCategory(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          tenant_id: tenant.id,
          name: newCategory.name,
          icon: newCategory.icon,
          color: newCategory.color
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Categoría creada exitosamente')
      setCategories(prev => [...prev, data])
      setForm(prev => ({ ...prev, category_id: data.id }))
      setShowCategoryModal(false)
      setNewCategory({ name: '', icon: '📦', color: '#10B981' })
    } catch (err) {
      console.error(err)
      toast.error('Error: ' + err.message)
    } finally {
      setCreatingCategory(false)
    }
  }

  if (loading) {
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
                Editar Producto
              </h1>
            </div>
          </div>
        </div>
        <div className="app-content">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '300px', color: 'var(--text-muted)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)', color: 'var(--color-primary)' }}>
                <Package size={36} style={{ animation: 'pulse 1.5s infinite' }} />
              </div>
              <p>Cargando producto...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isDecimalStock = form.unit_type === 'weight' || form.unit_type === 'volume'

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
              Editar Producto
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{form.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3" style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ color: 'var(--color-danger, #ef4444)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={16} /> Eliminar
          </button>
          <button className="btn btn-ghost" onClick={() => router.push('/inventory')}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
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
                <label className="form-label">Categoría</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <select
                    className={`form-select ${errors.category_id ? 'error' : ''}`}
                    value={form.category_id}
                    onChange={e => updateForm('category_id', e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowCategoryModal(true)}
                    style={{ padding: '0 16px' }}
                    title="Crear nueva categoría"
                  >
                    +
                  </button>
                </div>
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

          {/* Unit Type */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Tipo de Unidad</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Tipo de medida</label>
                <select
                  className="form-select"
                  value={form.unit_type}
                  onChange={e => handleUnitTypeChange(e.target.value)}
                >
                  <option value="unit">Unidad</option>
                  <option value="weight">Peso</option>
                  <option value="volume">Volumen</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unidad de medida</label>
                <select
                  className="form-select"
                  value={form.unit_label}
                  onChange={e => updateForm('unit_label', e.target.value)}
                >
                  {UNIT_LABELS[form.unit_type]?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
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
                <span className="form-hint" style={{ marginTop: '6px', fontSize: '0.75rem', display: 'block', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  Margen sobre venta: representa qué % del precio final es ganancia neta. Fórmula: ((Venta - Costo) / Venta) * 100
                </span>
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
                    step={isDecimalStock ? '0.001' : '1'}
                    value={form.stock_quantity}
                    onChange={e => updateForm('stock_quantity', e.target.value)}
                  />
                  {isDecimalStock && (
                    <span className="form-hint">Permite decimales para {form.unit_type === 'weight' ? 'peso' : 'volumen'}.</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Alerta de Stock Bajo (Mínimo)</label>
                  <input
                    className="form-input"
                    type="number"
                    step={isDecimalStock ? '0.001' : '1'}
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
                      style={{ padding: '2px 8px', fontSize: '0.6875rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => {
                        toast.info('Poné el cursor en el campo y escaneá')
                        barcodeInputRef.current?.focus()
                      }}
                    >
                      <Camera size={12} /> Escanear
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

          {/* Stock Adjustment */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} /> Ajuste de Stock
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Stock actual: <strong style={{ color: 'var(--color-secondary)' }}>
                  {form.stock_quantity} {form.unit_label}
                </strong>
              </span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de ajuste</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      className={`btn ${stockAdjustment.type === 'add' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => setStockAdjustment(prev => ({ ...prev, type: 'add' }))}
                    >
                      <Plus size={14} /> Entrada
                    </button>
                    <button
                      className={`btn ${stockAdjustment.type === 'subtract' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', ...(stockAdjustment.type === 'subtract' ? { background: 'var(--color-danger, #ef4444)' } : {}) }}
                      onClick={() => setStockAdjustment(prev => ({ ...prev, type: 'subtract' }))}
                    >
                      <Minus size={14} /> Salida
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad ({form.unit_label})</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step={isDecimalStock ? '0.001' : '1'}
                    placeholder="0"
                    value={stockAdjustment.quantity}
                    onChange={e => setStockAdjustment(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Motivo del ajuste</label>
                <input
                  className="form-input"
                  placeholder="Ej: Compra proveedor, Rotura, Corrección inventario..."
                  value={stockAdjustment.reason}
                  onChange={e => setStockAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleStockAdjustment}
                disabled={adjustingStock}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={16} /> {adjustingStock ? 'Ajustando...' : 'Aplicar Ajuste'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-card)' }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--color-error)' }} /> Confirmar Eliminación
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                ¿Estás seguro de que querés eliminar <strong style={{ color: 'var(--text-primary)' }}>{form.name}</strong>?
                Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: 'var(--color-danger, #ef4444)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 size={16} /> {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Category Modal */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)' }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} style={{ color: 'var(--color-primary)' }} /> Nueva Categoría
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCategoryModal(false)}>✕</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

              <div className="form-group">
                <label className="form-label required">Nombre de la categoría</label>
                <input
                  className="form-input"
                  placeholder="Ej: Bebidas, Snacks..."
                  value={newCategory.name}
                  onChange={e => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Icono (Emoji)</label>
                  <input
                    className="form-input"
                    value={newCategory.icon}
                    onChange={e => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color del Etiqueta</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={e => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px' }}
                    />
                    <input
                      className="form-input"
                      value={newCategory.color}
                      onChange={e => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-2)' }} onClick={handleCreateCategory} disabled={creatingCategory}>
                {creatingCategory ? 'Guardando...' : 'Crear Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
