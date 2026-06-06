'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { Package, Upload, Tag, AlertTriangle, DollarSign, FileText } from 'lucide-react'
import dynamic from 'next/dynamic'
import QuickProductModal from '@/components/ui/QuickProductModal'

const BarcodeScanner = dynamic(() => import('@/components/ui/BarcodeScanner'), { ssr: false })

export default function InventoryPage() {
  const { tenant } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '🏷️', color: '#7C3AED' })
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState(null)
  const [importingFile, setImportingFile] = useState(false)

  // Camera scanner state
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [quickProductBarcode, setQuickProductBarcode] = useState('')
  const [showQuickProduct, setShowQuickProduct] = useState(false)

  // Handle camera scan in inventory context
  const handleCameraScan = useCallback((barcode) => {
    setShowCameraScanner(false)
    // Search for the product in current inventory
    const found = products.find(p => p.barcode === barcode || p.reference_code === barcode)
    if (found) {
      // Navigate to product edit page
      router.push(`/inventory/${found.id}`)
      toast.success(`Producto encontrado: "${found.name}"`)
    } else {
      // Not found — open quick create
      setQuickProductBarcode(barcode)
      setShowQuickProduct(true)
    }
  }, [products, router, toast])

  // Handle quick product saved from scan
  const handleQuickProductSaved = useCallback((product) => {
    setShowQuickProduct(false)
    setQuickProductBarcode('')
    // Add to local product list
    setProducts(prev => {
      const exists = prev.find(p => p.id === product.id)
      if (exists) return prev
      return [product, ...prev]
    })
    toast.success(`"${product.name}" agregado al inventario`)
  }, [toast])

  async function loadInventory() {
    const cacheKeyCats = `smartcaja_categories_${tenant.id}`
    const cacheKeyProds = `smartcaja_inventory_products_${tenant.id}`

    // 1. Stale-While-Revalidate: Load from local cache immediately
    if (typeof window !== 'undefined') {
      const cachedCats = localStorage.getItem(cacheKeyCats)
      const cachedProds = localStorage.getItem(cacheKeyProds)

      if (cachedCats || cachedProds) {
        setTimeout(() => {
          if (cachedCats) {
            try {
              setCategories(JSON.parse(cachedCats))
            } catch (e) {}
          }
          if (cachedProds) {
            try {
              setProducts(JSON.parse(cachedProds))
            } catch (e) {}
          }
          setLoading(false)
        }, 0)
      } else {
        setTimeout(() => {
          setLoading(true)
        }, 0)
      }
    } else {
      setTimeout(() => {
        setLoading(true)
      }, 0)
    }

    // 2. Fetch fresh data from Supabase in the background
    try {
      // Load categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('name')
      
      if (cats) {
        setCategories(cats)
        localStorage.setItem(cacheKeyCats, JSON.stringify(cats))
      }

      // Load products
      const { data: prods, error } = await supabase
        .from('products')
        .select('*, categories(name, icon, color)')
        .eq('tenant_id', tenant.id)
        .order('name')
        
      if (error) {
        toast.error('Error al cargar inventario')
      } else if (prods) {
        setProducts(prods)
        localStorage.setItem(cacheKeyProds, JSON.stringify(prods))
      }
    } catch (err) {
      console.error('Error refreshing inventory data in background:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenant?.id) {
      const timer = setTimeout(() => {
        loadInventory()
      }, 0)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id])

  const handleQuickStockChange = async (productId, newStock) => {
    if (newStock < 0) return

    // Optimistic update
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: newStock } : p))

    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', productId)
      .eq('tenant_id', tenant.id)

    if (error) {
      toast.error('Error al actualizar el stock')
      loadInventory()
    } else {
      const cacheKeyProds = `smartcaja_inventory_products_${tenant.id}`
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKeyProds)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            const updated = parsed.map(p => p.id === productId ? { ...p, stock_quantity: newStock } : p)
            localStorage.setItem(cacheKeyProds, JSON.stringify(updated))
          } catch(e) {}
        }
      }
    }
  }

  const toggleProductActive = async (id, currentStatus) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .eq('tenant_id', tenant.id)

    if (error) {
      toast.error('Error al actualizar producto')
    } else {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
      toast.success(currentStatus ? 'Producto desactivado' : 'Producto activado')
    }
  }

  const handleCreateCategory = async () => {
    setCategoryError(null)
    if (!newCategory.name.trim()) {
      setCategoryError('Ingresá un nombre válido')
      return
    }
    if (!tenant?.id) {
      toast.error('Error: Sesión de comercio no encontrada. Volvé a iniciar sesión.')
      return
    }
    setCreatingCategory(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ tenant_id: tenant.id, name: newCategory.name, icon: newCategory.icon, color: newCategory.color })
        .select()
        .single()
      if (error) throw error
      setCategories(prev => [...prev, data])
      setNewCategory({ name: '', icon: '🏷️', color: '#7C3AED' })
      toast.success('Categoría creada')
      setShowCategoryModal(false)
    } catch (err) {
      console.error(err)
      setCategoryError(err.message)
      toast.error('Error: ' + err.message)
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleImportCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportingFile(true)
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target.result
        const rows = text.split('\n').filter(row => row.trim().length > 0)
        // Skip header
        const parsedProducts = []
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',')
          if (cols.length >= 3) {
            parsedProducts.push({
              tenant_id: tenant.id,
              name: cols[0].trim(),
              cost_price: parseFloat(cols[1]) || 0,
              sale_price: parseFloat(cols[2]) || 0,
              stock_quantity: parseInt(cols[3]) || 0,
              barcode: cols[4] ? cols[4].trim() : null
            })
          }
        }
        
        if (parsedProducts.length > 0) {
          const { error } = await supabase.from('products').insert(parsedProducts)
          if (error) throw error
          toast.success(`${parsedProducts.length} productos importados`)
          setShowImportModal(false)
          loadInventory()
        } else {
          toast.warning('No se encontraron productos válidos en el CSV')
        }
      } catch (err) {
        toast.error('Error al importar: Asegurate de usar el formato correcto')
      } finally {
        setImportingFile(false)
      }
    }
    reader.readAsText(file)
  }

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm) ||
      p.reference_code?.includes(searchTerm)
    
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Calculate some quick stats
  const totalItems = products.length
  const lowStockItems = products.filter(p => p.stock_quantity <= p.min_stock_alert).length
  const totalValuation = products.reduce((sum, p) => sum + (p.cost_price * p.stock_quantity), 0)

  return (
    <div>
      {/* Header */}
      <div className="app-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} style={{ color: 'var(--color-primary)' }} /> Inventario
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Gestioná tus productos, precios y stock
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Camera scan button - visible on desktop too */}
          <button
            className="scan-cam-btn"
            onClick={() => setShowCameraScanner(true)}
            title="Escanear código de barras con cámara"
            style={{ height: '40px' }}
          >
            📷 Cámara
          </button>
          <button className="btn btn-ghost" onClick={() => setShowImportModal(true)} style={{ border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={16} /> <span style={{ display: 'none', whiteSpace: 'nowrap' }}>Importar CSV</span><span className="truncate">CSV</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setShowCategoryModal(true)} style={{ border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={16} /> <span style={{ display: 'none', whiteSpace: 'nowrap' }}>Categorías</span><span className="truncate">Cats.</span>
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/inventory/new')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            + <span style={{ whiteSpace: 'nowrap' }}>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <div className="app-content">
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Productos</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800 }}>{totalItems}</div>
            </div>
          </div>
          
          <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderColor: lowStockItems > 0 ? 'var(--color-error)' : 'var(--glass-border)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: lowStockItems > 0 ? 'var(--color-error-light)' : 'var(--color-secondary-light)', color: lowStockItems > 0 ? 'var(--color-error)' : 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Alertas de Stock</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, color: lowStockItems > 0 ? 'var(--color-error)' : 'var(--text-primary)' }}>
                {lowStockItems}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
              <DollarSign size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Valor del Inventario</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                {formatCurrency(totalValuation)}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-body" style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-input-icon" style={{ flex: '1', minWidth: '220px' }}>
              <span className="input-icon">🔍</span>
              <input 
                className="form-input" 
                placeholder="Buscar por nombre, código de barras o ref..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Camera scan shortcut in filter bar */}
            <button
              className="scan-cam-btn btn-sm"
              onClick={() => setShowCameraScanner(true)}
              style={{ height: '48px', paddingLeft: '14px', paddingRight: '14px' }}
            >
              📷
            </button>
            <select 
              className="form-select" 
              style={{ width: 'auto', minWidth: '200px' }}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="card">
          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <div style={{ width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto var(--space-4)' }}></div>
              <p style={{ color: 'var(--text-muted)' }}>Cargando inventario...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📭</div>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No se encontraron productos</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No hay productos que coincidan con tu búsqueda.' 
                  : 'Aún no tenés productos en tu inventario.'}
              </p>
              <button className="btn btn-primary" onClick={() => router.push('/inventory/new')}>
                Agregar producto
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
              {filteredProducts.map(product => {
                const isLowStock = product.stock_quantity <= product.min_stock_alert
                return (
                  <div key={product.id} style={{ 
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    opacity: product.is_active ? 1 : 0.6,
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Background Glow if low stock */}
                    {isLowStock && (
                      <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'var(--color-error)', filter: 'blur(50px)', opacity: 0.1 }}></div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <div style={{ 
                          width: '48px', height: '48px', borderRadius: 'var(--radius-md)', 
                          background: 'var(--glass-bg)', border: '1px solid var(--border-color)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                          overflow: 'hidden', flexShrink: 0
                        }}>
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            product.categories?.icon || '📦'
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '1rem', lineHeight: 1.2 }}>{product.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>
                            {product.barcode || product.reference_code || 'SIN CÓDIGO'}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toggleProductActive(product.id, product.is_active)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                        title={product.is_active ? "Desactivar" : "Activar"}
                      >
                        {product.is_active ? '👁️' : '🙈'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Costo</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(product.cost_price)}</div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Venta</div>
                        <div style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>{formatCurrency(product.sale_price)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Stock:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <button 
                            type="button"
                            onClick={() => handleQuickStockChange(product.id, product.stock_quantity - 1)}
                            style={{
                              width: '24px', height: '24px', borderRadius: '4px',
                              background: 'transparent', border: 'none', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                            }}
                          >
                            -
                          </button>
                          <input 
                            key={product.stock_quantity}
                            type="number"
                            defaultValue={product.stock_quantity}
                            onBlur={e => {
                              const val = parseInt(e.target.value)
                              if (!isNaN(val) && val !== product.stock_quantity) {
                                handleQuickStockChange(product.id, val)
                              }
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const val = parseInt(e.target.value)
                                if (!isNaN(val) && val !== product.stock_quantity) {
                                  handleQuickStockChange(product.id, val)
                                }
                                e.target.blur()
                              }
                            }}
                            style={{
                              width: '38px',
                              background: 'transparent',
                              border: 'none',
                              color: isLowStock ? 'var(--color-error)' : '#fff',
                              fontWeight: 700,
                              textAlign: 'center',
                              fontSize: '0.8125rem',
                              outline: 'none',
                              padding: 0,
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => handleQuickStockChange(product.id, product.stock_quantity + 1)}
                            style={{
                              width: '24px', height: '24px', borderRadius: '4px',
                              background: 'transparent', border: 'none', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => router.push(`/inventory/${product.id}`)}
                        style={{ padding: '4px 12px', fontSize: '0.8125rem', border: '1px solid var(--border-color)' }}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Categories Management Modal */}
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
                <Tag size={18} /> Gestión de Categorías
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCategoryModal(false)}>✕</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="form-input" placeholder="Icono" style={{ width: '60px' }} value={newCategory.icon} onChange={e => setNewCategory(prev => ({...prev, icon: e.target.value}))} />
                <input className="form-input" placeholder="Nombre" style={{ flex: 1 }} value={newCategory.name} onChange={e => setNewCategory(prev => ({...prev, name: e.target.value}))} />
                <input type="color" style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px' }} value={newCategory.color} onChange={e => setNewCategory(prev => ({...prev, color: e.target.value}))} />
                <button className="btn btn-primary" onClick={handleCreateCategory} disabled={creatingCategory}>+</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Icono rápido (clic para seleccionar):</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: 'var(--radius-md)' }}>
                  {['📦', '🏷️', '🍎', '🥤', '🍬', '🍞', '🥩', '👕', '👟', '🔧', '🔨', '💊', '🚗', '🛢️', '✏️', '🧼', '🚬', '🍷', '⭐', '🍕', '🥬', '💡', '🍔', '🛒'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCategory(prev => ({ ...prev, icon: emoji }))}
                      style={{
                        background: newCategory.icon === emoji ? 'var(--color-primary-light)' : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '4px',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {categoryError && (
                <div style={{ background: 'var(--color-error)', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '0.875rem' }}>
                  {categoryError}
                </div>
              )}

              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-4)' }}>
                {categories.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>No hay categorías. Creá una arriba.</div>}
                {categories.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                    <span>{cat.icon}</span>
                    <span style={{ flex: 1, fontWeight: 600 }}>{cat.name}</span>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: cat.color }}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)' }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} /> Importar CSV
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowImportModal(false)}>✕</button>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
                Subí tu archivo CSV. Asegurate de que la primera fila contenga los títulos y sigan este orden exacto:
              </p>
              
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: 'var(--space-6)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                Nombre Producto, Costo, Precio Venta, Stock, Código Barras (Opcional)
              </div>

              <div style={{ border: '2px dashed var(--border-color)', padding: 'var(--space-8)', textAlign: 'center', borderRadius: 'var(--radius-md)', cursor: 'pointer' }} onClick={() => document.getElementById('csv-upload').click()}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: 'var(--color-primary)' }}>
                  <FileText size={32} />
                </div>
                <div style={{ fontWeight: 600 }}>{importingFile ? 'Procesando...' : 'Hacé clic para elegir un archivo'}</div>
                <input type="file" id="csv-upload" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} disabled={importingFile} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ===== FAB - Mobile New Product ===== */}
      <button
        className="fab"
        onClick={() => router.push('/inventory/new')}
        title="Nuevo Producto"
        aria-label="Agregar nuevo producto"
      >
        +
      </button>

      {/* ===== CAMERA BARCODE SCANNER ===== */}
      <BarcodeScanner
        isOpen={showCameraScanner}
        onScan={handleCameraScan}
        onClose={() => setShowCameraScanner(false)}
        title="Buscar Producto"
      />

      {/* ===== QUICK PRODUCT MODAL (barcode not found in inventory) ===== */}
      <QuickProductModal
        isOpen={showQuickProduct}
        barcode={quickProductBarcode}
        onClose={() => { setShowQuickProduct(false); setQuickProductBarcode('') }}
        onSaved={handleQuickProductSaved}
        mode="inventory"
      />
    </div>
  )
}
