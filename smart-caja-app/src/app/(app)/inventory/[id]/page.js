'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { Trash2, Save, Camera, Package, Plus, Minus, Check, AlertTriangle, ImagePlus, X } from 'lucide-react'

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
  const [availableProducts, setAvailableProducts] = useState([])
  const [showRecipeCalculator, setShowRecipeCalculator] = useState(false)
  const [recipeIngredients, setRecipeIngredients] = useState([])
  const [markupPercent, setMarkupPercent] = useState('50')
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
    offer_price: '',
    stock_quantity: '0',
    min_stock_alert: '5',
    unit_type: 'unit',
    unit_label: 'un',
    show_in_store: true,
    has_variants: false,
    control_stock: true,
  })
  const [errors, setErrors] = useState({})

  // Image upload state
  const imageInputRef = useRef(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null) // URL string: existing or local blob
  const [uploadingImage, setUploadingImage] = useState(false)
  const [removeImage, setRemoveImage] = useState(false) // true = user wants to delete existing image

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
        offer_price: data.offer_price?.toString() || '',
        stock_quantity: data.stock_quantity?.toString() || '0',
        min_stock_alert: data.min_stock_alert?.toString() || '5',
        unit_type: data.unit_type || 'unit',
        unit_label: data.unit_label || 'un',
        show_in_store: data.show_in_store !== false,
        has_variants: data.has_variants || false,
        control_stock: data.control_stock !== false,
      })
      // Load existing image
      if (data.image_url) {
        setImagePreview(data.image_url)
      }
      if (data.recipe_config) {
        setRecipeIngredients(data.recipe_config)
        setShowRecipeCalculator(true)
        const cost = parseFloat(data.cost_price || 0)
        const sale = parseFloat(data.sale_price || 0)
        if (cost > 0) {
          const markup = (((sale - cost) / cost) * 100).toFixed(0)
          setMarkupPercent(markup)
        }
      }
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

  async function loadAvailableProducts() {
    if (!tenant?.id) return
    const { data } = await supabase
      .from('products')
      .select('id, name, cost_price, unit_label')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name')
    setAvailableProducts((data || []).filter(p => p.id !== id))
  }

  useEffect(() => {
    if (tenant?.id && id) {
      const timer = setTimeout(() => {
        loadProduct()
        loadCategories()
        loadAvailableProducts()
      }, 0)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, id])

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

  const handleAddIngredient = () => {
    setRecipeIngredients(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        product_id: '',
        custom_name: '',
        quantity: '1',
        cost_price: '0',
        unit_label: 'un'
      }
    ])
  }

  const handleRemoveIngredient = (id) => {
    const updated = recipeIngredients.filter(ing => ing.id !== id)
    setRecipeIngredients(updated)
    recalculateCostFromRecipe(updated)
  }

  const handleUpdateIngredient = (id, key, value) => {
    const updated = recipeIngredients.map(ing => {
      if (ing.id === id) {
        const newIng = { ...ing, [key]: value }
        
        // If they selected an existing product, auto-fill unit details
        if (key === 'product_id' && value) {
          const found = availableProducts.find(p => p.id === value)
          if (found) {
            newIng.cost_price = found.cost_price.toString()
            newIng.unit_label = found.unit_label || 'un'
            newIng.custom_name = found.name
          }
        }
        return newIng
      }
      return ing
    })
    setRecipeIngredients(updated)
    recalculateCostFromRecipe(updated)
  }

  const recalculateCostFromRecipe = (ingredientsList) => {
    const totalCost = ingredientsList.reduce((sum, ing) => {
      const qty = parseFloat(ing.quantity || 0)
      const price = parseFloat(ing.cost_price || 0)
      return sum + (qty * price)
    }, 0)
    
    // Update cost_price in form
    setForm(prev => {
      const newCost = totalCost.toFixed(2)
      // Also calculate sale price automatically if markup is configured
      let newSale = prev.sale_price
      if (markupPercent) {
        const markup = parseFloat(markupPercent || 0)
        newSale = (totalCost * (1 + markup / 100)).toFixed(2)
      }
      return {
        ...prev,
        cost_price: newCost,
        sale_price: newSale
      }
    })
  }

  // Recalculate cost when markup percent changes
  const handleMarkupChange = (newMarkup) => {
    setMarkupPercent(newMarkup)
    const totalCost = parseFloat(form.cost_price || 0)
    if (totalCost > 0) {
      const markup = parseFloat(newMarkup || 0)
      const newSale = (totalCost * (1 + markup / 100)).toFixed(2)
      setForm(prev => ({ ...prev, sale_price: newSale }))
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('La imagen no puede superar los 5 MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const uploadImage = async () => {
    if (!imageFile) return null
    setUploadingImage(true)
    try {
      const ext = imageFile.name.split('.').pop()
      const fileName = `${tenant.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile, { upsert: true, contentType: imageFile.type })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      return urlData.publicUrl
    } catch (err) {
      toast.error('Error al subir imagen: ' + err.message)
      return null
    } finally {
      setUploadingImage(false)
    }
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
      // Handle image
      let newImageUrl = undefined // undefined = don't change
      if (imageFile) {
        newImageUrl = await uploadImage() // new file uploaded
      } else if (removeImage) {
        newImageUrl = null // explicitly remove
      }

      const isDecimalStock = form.unit_type === 'weight' || form.unit_type === 'volume'
      const updatePayload = {
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
        show_in_store: form.show_in_store,
        has_variants: form.has_variants,
        control_stock: form.control_stock,
      }
      updatePayload.recipe_config = recipeIngredients.length > 0 ? recipeIngredients : null
      if (form.offer_price && parseFloat(form.offer_price) > 0) {
        updatePayload.offer_price = parseFloat(form.offer_price)
      }
      if (newImageUrl !== undefined) updatePayload.image_url = newImageUrl

      let { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', id)
        .eq('tenant_id', tenant.id)

      // Fallback: If update failed and offer_price was present, retry without offer_price
      if (error && updatePayload.offer_price !== undefined) {
        delete updatePayload.offer_price
        const retryResult = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', id)
          .eq('tenant_id', tenant.id)
        error = retryResult.error
      }

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
          quantity_change: delta,
          type: 'adjustment',
          stock_before: currentStock,
          stock_after: newStock,
          notes: stockAdjustment.reason,
          user_id: profile?.id || null,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
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
              
              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">Imagen del Producto</label>
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                  <div
                    onClick={() => !imagePreview && imageInputRef.current?.click()}
                    style={{
                      width: '96px', height: '96px', borderRadius: 'var(--radius-lg)',
                      border: imagePreview ? '2px solid var(--color-primary)' : '2px dashed var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, overflow: 'hidden', cursor: imagePreview ? 'default' : 'pointer',
                      background: 'var(--bg-input)', position: 'relative',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {imagePreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage() }}
                          style={{
                            position: 'absolute', top: '4px', right: '4px',
                            background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                            width: '22px', height: '22px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <ImagePlus size={24} style={{ marginBottom: '4px', opacity: 0.5 }} />
                        <div style={{ fontSize: '0.625rem', lineHeight: 1.3 }}>Subir foto</div>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => imageInputRef.current?.click()}
                      style={{ border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}
                    >
                      <ImagePlus size={15} />
                      {imagePreview ? 'Cambiar imagen' : 'Elegir imagen'}
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      JPG, PNG o WebP · Máx. 5 MB<br />
                      Si no subís imagen, se usará el ícono de la categoría.
                    </p>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>
              </div>

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

              {tenant?.ecommerce_enabled && (
                <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <input 
                      type="checkbox" 
                      checked={form.show_in_store}
                      onChange={(e) => updateForm('show_in_store', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Mostrar en Tienda Online</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>El producto será visible para los clientes en el catálogo público.</div>
                    </div>
                  </label>
                </div>
              )}

              {tenant?.features_config?.variants !== false && (
                <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer', background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="checkbox" 
                        checked={form.has_variants}
                        onChange={(e) => updateForm('has_variants', e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>El producto tiene variantes</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Talles, colores, etc.</div>
                      </div>
                    </div>
                    {form.has_variants && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.preventDefault()
                          router.push(`/inventory/${id}/variants`)
                        }}
                      >
                        Administrar Variantes →
                      </button>
                    )}
                  </label>
                </div>
              )}
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
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Precios y Costos</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowRecipeCalculator(!showRecipeCalculator)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: showRecipeCalculator ? 'var(--color-primary)' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}
              >
                <Calculator size={15} />
                {showRecipeCalculator ? 'Ocultar Receta' : 'Calcular por Receta'}
              </button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Main pricing inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
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
                      disabled={showRecipeCalculator}
                      title={showRecipeCalculator ? "El costo se calcula sumando las materias primas" : ""}
                    />
                  </div>
                  {showRecipeCalculator && <span className="form-hint" style={{ color: 'var(--color-secondary)' }}>Calculado de la receta.</span>}
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
                  <label className="form-label">Precio de Oferta (Opcional)</label>
                  <div className="form-input-icon">
                    <span className="input-icon" style={{ color: '#10B981' }}>$</span>
                    <input 
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.offer_price}
                      onChange={e => updateForm('offer_price', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Margen de Ganancia</label>
                  <div style={{ 
                    padding: '10px 12px', 
                    background: 'var(--bg-input)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '42px'
                  }}>
                    <span style={{ 
                      fontFamily: 'var(--font-headline)', 
                      fontWeight: 700, 
                      color: calculateMargin() > 0 ? 'var(--color-secondary)' : 'var(--text-muted)'
                    }}>
                      {calculateMargin()}%
                    </span>
                    {calculateMargin() < 20 && form.sale_price && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)' }}>Bajo</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recipe Calculator panel */}
              {showRecipeCalculator && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      🌾 Ingredientes y Materia Prima de la Receta
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>% Recargo:</span>
                      <div className="form-input-icon" style={{ width: '85px' }}>
                        <span className="input-icon" style={{ right: '8px', left: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '4px 20px 4px 8px', fontSize: '0.75rem', height: '28px' }}
                          value={markupPercent}
                          onChange={e => handleMarkupChange(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {recipeIngredients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--border-color)', borderRadius: '8px', marginBottom: '16px' }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '8px' }}>No hay ingredientes cargados todavía.</p>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ border: '1px solid var(--border-color)' }}
                        onClick={handleAddIngredient}
                      >
                        + Agregar Primer Insumo
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {recipeIngredients.map((ing) => {
                        const subtotal = parseFloat(ing.quantity || 0) * parseFloat(ing.cost_price || 0)
                        return (
                          <div key={ing.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            
                            {/* Ingredient selection */}
                            <select
                              className="form-select"
                              style={{ flex: 2, height: '36px', fontSize: '0.8125rem' }}
                              value={ing.product_id || ''}
                              onChange={e => handleUpdateIngredient(ing.id, 'product_id', e.target.value)}
                            >
                              <option value="">-- Cargar manualmente --</option>
                              {availableProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>

                            {/* Manual custom name (only if product_id is empty) */}
                            {!ing.product_id && (
                              <input
                                type="text"
                                className="form-input"
                                style={{ flex: 2, height: '36px', fontSize: '0.8125rem' }}
                                placeholder="Nombre del insumo"
                                value={ing.custom_name}
                                onChange={e => handleUpdateIngredient(ing.id, 'custom_name', e.target.value)}
                              />
                            )}

                            {/* Quantity */}
                            <input
                              type="number"
                              step="0.001"
                              className="form-input"
                              style={{ width: '80px', height: '36px', fontSize: '0.8125rem', textAlign: 'center' }}
                              placeholder="Cant."
                              value={ing.quantity}
                              onChange={e => handleUpdateIngredient(ing.id, 'quantity', e.target.value)}
                            />

                            {/* Unit label */}
                            <input
                              type="text"
                              className="form-input"
                              style={{ width: '50px', height: '36px', fontSize: '0.8125rem', textAlign: 'center', padding: '0 4px' }}
                              placeholder="un/kg"
                              value={ing.unit_label}
                              onChange={e => handleUpdateIngredient(ing.id, 'unit_label', e.target.value)}
                              disabled={!!ing.product_id}
                            />

                            {/* Cost Price per unit */}
                            <div className="form-input-icon" style={{ width: '90px' }}>
                              <span className="input-icon" style={{ fontSize: '0.75rem' }}>$</span>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                style={{ height: '36px', paddingLeft: '18px', fontSize: '0.8125rem' }}
                                placeholder="Costo"
                                value={ing.cost_price}
                                onChange={e => handleUpdateIngredient(ing.id, 'cost_price', e.target.value)}
                                disabled={!!ing.product_id}
                              />
                            </div>

                            {/* Subtotal */}
                            <div style={{ minWidth: '70px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                              ${subtotal.toFixed(2)}
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0 8px', color: 'var(--color-error)', border: 'none', background: 'transparent' }}
                              onClick={() => handleRemoveIngredient(ing.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )
                      })}

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}
                        onClick={handleAddIngredient}
                      >
                        + Agregar Insumo
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <span>Costo Receta Total:</span>
                    <strong style={{ color: '#fff' }}>${parseFloat(form.cost_price || 0).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <span>Sugerido (+{markupPercent}% Recargo):</span>
                    <strong style={{ color: 'var(--color-secondary)' }}>${parseFloat(form.sale_price || 0).toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stock & Codes */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Inventario y Códigos</span>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <input 
                    type="checkbox" 
                    checked={form.control_stock}
                    onChange={(e) => updateForm('control_stock', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Controlar Stock</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Si se desactiva, el producto no requerirá stock y se podrá vender sin límites.</div>
                  </div>
                </label>
              </div>

              {form.control_stock && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Stock Global</label>
                    <input
                      className="form-input"
                      type="number"
                      step={isDecimalStock ? '0.001' : '1'}
                      value={form.stock_quantity}
                      onChange={e => updateForm('stock_quantity', e.target.value)}
                      disabled={form.has_variants}
                      title={form.has_variants ? "El stock global es calculado automáticamente desde las variantes." : ""}
                    />
                    {form.has_variants && <span className="form-hint" style={{ color: 'var(--color-warning)' }}>El stock se calcula por las variantes.</span>}
                    {isDecimalStock && !form.has_variants && (
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
              )}

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
          {form.control_stock && (
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
          )}

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
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      className="form-input" 
                      style={{ width: '50px', textAlign: 'center', padding: '0 4px' }}
                      value={newCategory.icon}
                      onChange={e => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                    />
                    <div style={{ 
                      flex: 1, 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(5, 1fr)', 
                      gap: '2px', 
                      background: 'rgba(0,0,0,0.15)', 
                      padding: '4px', 
                      borderRadius: 'var(--radius-sm)', 
                      maxHeight: '80px', 
                      overflowY: 'auto' 
                    }}>
                      {['📦', '🏷️', '🍎', '🥤', '🍬', '🍞', '🥩', '👕', '👟', '🔧', '🔨', '💊', '🚗', '🛢️', '✏️', '🧼', '🚬', '🍷', '⭐', '🍕', '🥬', '💡', '🍔', '🛒'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCategory(prev => ({ ...prev, icon: emoji }))}
                          style={{
                            background: newCategory.icon === emoji ? 'var(--color-primary-light)' : 'transparent',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            padding: '2px 0',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
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
