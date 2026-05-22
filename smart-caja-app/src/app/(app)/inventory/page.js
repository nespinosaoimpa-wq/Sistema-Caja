'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'

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

  useEffect(() => {
    if (tenant?.id) {
      loadInventory()
    }
  }, [tenant?.id])

  async function loadInventory() {
    setLoading(true)
    
    // Load categories
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('name')
    
    if (cats) setCategories(cats)

    // Load products
    const { data: prods, error } = await supabase
      .from('products')
      .select('*, categories(name, icon, color)')
      .eq('tenant_id', tenant.id)
      .order('name')
      
    if (error) {
      toast.error('Error al cargar inventario')
    } else {
      setProducts(prods || [])
    }
    
    setLoading(false)
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
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>
            📦 Inventario
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Gestioná tus productos, precios y stock
          </p>
        </div>
        <div className="flex items-center gap-3" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => router.push('/inventory/new')}>
            + Nuevo Producto
          </button>
        </div>
      </div>

      <div className="app-content">
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              📦
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Productos</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800 }}>{totalItems}</div>
            </div>
          </div>
          
          <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderColor: lowStockItems > 0 ? 'var(--color-error)' : 'var(--glass-border)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: lowStockItems > 0 ? 'var(--color-error-light)' : 'var(--color-secondary-light)', color: lowStockItems > 0 ? 'var(--color-error)' : 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              ⚠️
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Alertas de Stock</div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, color: lowStockItems > 0 ? 'var(--color-error)' : 'var(--text-primary)' }}>
                {lowStockItems}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              💰
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
            <div className="form-input-icon" style={{ flex: '1', minWidth: '250px' }}>
              <span className="input-icon">🔍</span>
              <input 
                className="form-input" 
                placeholder="Buscar por nombre, código de barras o ref..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
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
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Código</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Costo</th>
                    <th style={{ textAlign: 'right' }}>Venta</th>
                    <th style={{ textAlign: 'center' }}>Stock</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    const isLowStock = product.stock_quantity <= product.min_stock_alert
                    return (
                      <tr key={product.id} style={{ opacity: product.is_active ? 1 : 0.5 }}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{product.name}</div>
                          {product.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }} className="truncate" style={{ maxWidth: '200px' }}>{product.description}</div>}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>{product.barcode || product.reference_code || '-'}</div>
                        </td>
                        <td>
                          <span className="badge badge-neutral">
                            {product.categories?.icon} {product.categories?.name || 'Sin categoría'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatCurrency(product.cost_price)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-secondary)' }}>
                          {formatCurrency(product.sale_price)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${isLowStock ? 'badge-error' : 'badge-success'}`}>
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className={`badge ${product.is_active ? 'badge-primary' : 'badge-neutral'}`}
                            onClick={() => toggleProductActive(product.id, product.is_active)}
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            {product.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => router.push(`/inventory/${product.id}`)}
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
