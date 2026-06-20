'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { useToast } from '@/lib/hooks/useToast'
import { Trash2, AlertTriangle, Package, Calendar, ArrowRight, RefreshCw } from 'lucide-react'

export default function WastePage() {
  const { tenant, profile } = useAuth()
  const supabase = createClient()
  const toast = useToast()

  const [products, setProducts] = useState([])
  const [history, setHistory] = useState([])
  const [exchangeSales, setExchangeSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('manual') // 'manual' | 'exchanges'

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('Vencido / Podrido')
  const [notes, setNotes] = useState('')
  const [searchProductQuery, setSearchProductQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Filter states
  const [filterDate, setFilterDate] = useState('month') // 'all' | 'month' | 'week'

  const loadData = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    try {
      // 1. Fetch active products catalog
      const { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')

      if (prodsErr) throw prodsErr
      setProducts(prods || [])

      // 2. Fetch waste movements (stock_movements where type = 'adjustment' and notes starts with '[DESPERDICIO]')
      const { data: movs, error: movsErr } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (
            name,
            cost_price,
            unit_label,
            unit_type
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('type', 'adjustment')
        .ilike('notes', '[DESPERDICIO]%')
        .order('created_at', { ascending: false })

      if (movsErr) throw movsErr
      setHistory(movs || [])

      // 3. Fetch sales with exchanges
      const { data: exchSales, error: exchErr } = await supabase
        .from('sales')
        .select('id, ticket_number, created_at, exchange_items, exchange_total')
        .eq('tenant_id', tenant.id)
        .not('exchange_items', 'is', null)
        .order('created_at', { ascending: false })

      if (exchErr) throw exchErr
      setExchangeSales(exchSales || [])
    } catch (err) {
      console.error('[loadData] Error:', err)
      toast.error('Error al cargar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [tenant?.id, supabase, toast])

  useEffect(() => {
    if (tenant?.id) {
      loadData()
    }
  }, [tenant?.id, loadData])

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const selectedVariant = selectedProduct?.product_variants?.find(v => v.id === selectedVariantId)

  const handleSelectProduct = (product) => {
    setSelectedProductId(product.id)
    setSearchProductQuery(product.name)
    setShowDropdown(false)
    // Select first variant if exists
    if (product.product_variants && product.product_variants.length > 0) {
      setSelectedVariantId(product.product_variants[0].id)
    } else {
      setSelectedVariantId('')
    }
  }

  const handleRegisterWaste = async (e) => {
    e.preventDefault()
    if (!selectedProductId) {
      toast.warning('Por favor seleccioná un producto')
      return
    }
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.warning('Ingresá una cantidad válida mayor a 0')
      return
    }

    setSubmitting(true)
    try {
      const currentStock = selectedVariant 
        ? parseFloat(selectedVariant.stock_quantity || 0)
        : parseFloat(selectedProduct.stock_quantity || 0)

      const newStock = Math.max(0, currentStock - qty)
      const formattedNotes = `[DESPERDICIO] ${reason}${notes.trim() ? ` - ${notes.trim()}` : ''}`

      // 1. Insert stock movement
      const { error: movError } = await supabase
        .from('stock_movements')
        .insert({
          tenant_id: tenant.id,
          product_id: selectedProductId,
          quantity_change: -qty,
          type: 'adjustment',
          stock_before: currentStock,
          stock_after: newStock,
          notes: formattedNotes,
          user_id: profile?.id || null,
          reference_type: selectedVariantId ? 'variant' : 'product',
          reference_id: selectedVariantId || null
        })

      if (movError) throw movError

      // 2. Update product or variant stock in database
      if (selectedVariantId) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .update({ stock_quantity: newStock })
          .eq('id', selectedVariantId)
        if (variantError) throw variantError
      } else {
        const { error: prodError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', selectedProductId)
        if (prodError) throw prodError
      }

      toast.success('Desperdicio registrado correctamente')
      
      // Reset form
      setSelectedProductId('')
      setSelectedVariantId('')
      setQuantity('')
      setNotes('')
      setSearchProductQuery('')
      
      // Reload history and stock levels
      loadData()
    } catch (err) {
      console.error('[handleRegisterWaste]', err)
      toast.error('Error al registrar pérdida: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Filter history based on dates
  const filteredHistory = history.filter(item => {
    if (filterDate === 'all') return true
    const itemDate = new Date(item.created_at)
    const now = new Date()
    if (filterDate === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    }
    if (filterDate === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return itemDate >= oneWeekAgo
    }
    return true
  })

  // Filter exchange sales based on dates
  const filteredExchangeSales = exchangeSales.filter(sale => {
    if (filterDate === 'all') return true
    const itemDate = new Date(sale.created_at)
    const now = new Date()
    if (filterDate === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    }
    if (filterDate === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return itemDate >= oneWeekAgo
    }
    return true
  })

  // Flatten exchange items for the filtered table list
  const flatExchangeItems = []
  filteredExchangeSales.forEach(sale => {
    const items = sale.exchange_items || []
    items.forEach(ei => {
      flatExchangeItems.push({
        id: `${sale.id}-${ei.product_id}`,
        ticket_number: sale.ticket_number,
        created_at: sale.created_at,
        product_name: ei.product_name,
        quantity: ei.quantity || ei.qty || 0,
        unit_price: ei.unit_price || 0,
        cost_price: ei.cost_price || 0,
        reason: ei.reason || 'N/A'
      })
    })
  })

  // Calculate monthly stats for manual waste
  const totalMonthlyLossValue = history
    .filter(item => {
      const itemDate = new Date(item.created_at)
      const now = new Date()
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, item) => {
      const cost = parseFloat(item.products?.cost_price || 0)
      const qty = Math.abs(parseFloat(item.quantity_change || 0))
      return sum + (cost * qty)
    }, 0)

  const totalMonthlyLossQty = history
    .filter(item => {
      const itemDate = new Date(item.created_at)
      const now = new Date()
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, item) => sum + Math.abs(parseFloat(item.quantity_change || 0)), 0)

  // Calculate monthly stats for exchanges (valued at cost price)
  const totalMonthlyExchangeLossValue = exchangeSales
    .filter(sale => {
      const itemDate = new Date(sale.created_at)
      const now = new Date()
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, sale) => {
      const items = sale.exchange_items || []
      const saleSum = items.reduce((s, item) => {
        const qty = parseFloat(item.quantity || item.qty || 0)
        const cost = parseFloat(item.cost_price || 0)
        return s + (qty * cost)
      }, 0)
      return sum + saleSum
    }, 0)

  // Filter products for autocomplete autocomplete
  const filteredProductsDropdown = products.filter(p =>
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase())
  )

  return (
    <div style={{ paddingBottom: 'var(--space-8)' }}>
      <style>{`
        .waste-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: var(--space-6);
          align-items: start;
        }
        @media (max-width: 1024px) {
          .waste-grid {
            grid-template-columns: 1fr;
          }
        }
        .autocomplete-container {
          position: relative;
          width: 100%;
        }
        .autocomplete-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          max-height: 200px;
          overflow-y: auto;
          z-index: 100;
          margin-top: 4px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        }
        .autocomplete-option {
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color);
          transition: var(--transition);
        }
        .autocomplete-option:last-child {
          border-bottom: none;
        }
        .autocomplete-option:hover {
          background: var(--bg-card-hover);
        }
        .kpi-card {
          position: relative;
          overflow: hidden;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          transition: var(--transition);
        }
        .kpi-card.loss {
          border-left: 4px solid var(--color-error);
        }
        .kpi-glow {
          position: absolute;
          top: 0;
          right: 0;
          width: 120px;
          height: 120px;
          background: var(--color-error);
          filter: blur(55px);
          opacity: 0.08;
          pointer-events: none;
        }
        .table-wrapper {
          width: 100%;
          overflow-x: auto;
          background: var(--bg-card);
        }
        .table {
          width: 100%;
          min-width: 700px;
          border-collapse: collapse;
          font-size: 0.8125rem;
          text-align: left;
        }
        .table th {
          padding: 12px 14px;
          color: var(--text-secondary);
          font-weight: 700;
          border-bottom: 1px solid var(--border-color);
          text-transform: uppercase;
          font-size: 0.72rem;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
          vertical-align: middle;
        }
        .table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }
      `}</style>

      {/* Header */}
      <div className="app-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={20} style={{ color: 'var(--color-error)' }} /> Desperdicios y Mermas
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Registrá mermas, vencimientos y mercadería rota para descontar stock y ver pérdidas reales.
          </p>
        </div>
      </div>

      {/* KPIs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="kpi-card loss">
          <div className="kpi-glow" />
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Costo Perdido Manual (Mes)</div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-error)' }}>
              {formatCurrency(totalMonthlyLossValue)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Desperdicios a precio de costo.</span>
          </div>
        </div>

        <div className="kpi-card loss" style={{ borderLeftColor: 'var(--color-secondary)' }}>
          <div className="kpi-glow" style={{ background: 'var(--color-secondary)', opacity: 0.05 }} />
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Pérdida por Cambios (Mes)</div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
              {formatCurrency(totalMonthlyExchangeLossValue)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recambios/Devoluciones a costo.</span>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Cantidades Desechadas (Mes)</div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
              {totalMonthlyLossQty.toFixed(2).replace(/\.00$/, '')} unidades/kg
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Desechos manuales registrados.</span>
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="waste-grid">
        
        {/* Left Side: Add Waste Form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Registrar Pérdida</span>
          </div>
          
          <form onSubmit={handleRegisterWaste} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Autocomplete Product Search */}
            <div className="form-group">
              <label className="form-label required">Producto</label>
              <div className="autocomplete-container">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar producto a descartar..."
                  value={searchProductQuery}
                  onChange={(e) => {
                    setSearchProductQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {showDropdown && searchProductQuery.trim() !== '' && filteredProductsDropdown.length > 0 && (
                  <div className="autocomplete-list">
                    {filteredProductsDropdown.map(prod => (
                      <div
                        key={prod.id}
                        className="autocomplete-option"
                        onClick={() => handleSelectProduct(prod)}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Stock actual: {prod.stock_quantity} {prod.unit_label} · Costo: {formatCurrency(prod.cost_price)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Variants (If any) */}
            {selectedProduct && selectedProduct.product_variants && selectedProduct.product_variants.length > 0 && (
              <div className="form-group">
                <label className="form-label required">Variante / Detalle</label>
                <select
                  className="form-select"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  {selectedProduct.product_variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.size ? `Talle: ${v.size}` : ''} {v.color ? `Color: ${v.color}` : ''} (Stock: {v.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Current Stock Indicator */}
            {selectedProduct && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                📈 Stock actual disponible:{' '}
                <strong style={{ color: 'var(--color-secondary)' }}>
                  {selectedVariant ? selectedVariant.stock_quantity : selectedProduct.stock_quantity}{' '}
                  {selectedProduct.unit_label || 'un'}
                </strong>
              </div>
            )}

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label required">Cantidad a Descartar</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  className="form-input"
                  placeholder="Ej: 1.5"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
                {selectedProduct && (
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {selectedProduct.unit_label}
                  </span>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="form-group">
              <label className="form-label required">Motivo del Descarte</label>
              <select
                className="form-select"
                value={reason}
                onChange={e => setReason(e.target.value)}
              >
                <option value="Vencido / Podrido">Vencido / Podrido / Mal estado</option>
                <option value="Roto / Dañado">Roto / Dañado / Paquete Abierto</option>
                <option value="Exceso de stock / Sobrante">Exceso de stock / Sobrante del día</option>
                <option value="Robo / Pérdida">Robo / Pérdida / Faltante</option>
                <option value="Otro">Otro Motivo</option>
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notas Adicionales (opcional)</label>
              <textarea
                className="form-input"
                placeholder="Escribí más detalles si es necesario..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)', fontWeight: 700, padding: '12px', marginTop: '8px' }}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Confirmar Registro de Pérdida'}
            </button>

          </form>
        </div>

        {/* Right Side: Waste History list */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: activeTab === 'manual' ? 700 : 500,
                  background: activeTab === 'manual' ? 'var(--bg-card-hover)' : 'transparent',
                  color: activeTab === 'manual' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                🗑️ Desperdicios Manuales
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('exchanges')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: activeTab === 'exchanges' ? 700 : 500,
                  background: activeTab === 'exchanges' ? 'var(--bg-card-hover)' : 'transparent',
                  color: activeTab === 'exchanges' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                🔄 Cambios en Ventas
              </button>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['month', 'week', 'all'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterDate(t)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: filterDate === t ? 'var(--bg-card-hover)' : 'transparent',
                    border: `1px solid ${filterDate === t ? 'var(--border-color)' : 'transparent'}`,
                    color: filterDate === t ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {t === 'month' ? 'Este Mes' : t === 'week' ? '7 días' : 'Todo'}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando historial...</div>
            ) : activeTab === 'manual' ? (
              filteredHistory.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se registraron desperdicios manuales en este período.
                </div>
              ) : (
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th style={{ textAlign: 'right' }}>Cantidad</th>
                        <th style={{ textAlign: 'right' }}>Costo Unit.</th>
                        <th style={{ textAlign: 'right' }}>Pérdida Total</th>
                        <th>Detalle/Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map(item => {
                        const cost = parseFloat(item.products?.cost_price || 0)
                        const qty = Math.abs(parseFloat(item.quantity_change || 0))
                        const totalLoss = cost * qty
                        const displayNotes = item.notes?.replace('[DESPERDICIO] ', '') || ''
                        return (
                          <tr key={item.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.created_at)}</td>
                            <td style={{ fontWeight: 600, color: '#fff' }}>{item.products?.name || 'Producto Eliminado'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              {qty} {item.products?.unit_label || 'un'}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(cost)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-error)' }}>
                              {formatCurrency(totalLoss)}
                            </td>
                            <td style={{ fontSize: '0.8125rem' }}>{displayNotes}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              flatExchangeItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se registraron cambios/devoluciones en ventas en este período.
                </div>
              ) : (
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Venta</th>
                        <th>Producto</th>
                        <th style={{ textAlign: 'right' }}>Cantidad</th>
                        <th style={{ textAlign: 'right' }}>Costo Unit.</th>
                        <th style={{ textAlign: 'right' }}>Pérdida Total</th>
                        <th>Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flatExchangeItems.map((item, idx) => {
                        const cost = parseFloat(item.cost_price || 0)
                        const qty = parseFloat(item.quantity || 0)
                        const totalLoss = cost * qty
                        return (
                          <tr key={item.id || idx}>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.created_at)}</td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-secondary)' }}>
                              #{item.ticket_number}
                            </td>
                            <td style={{ fontWeight: 600, color: '#fff' }}>{item.product_name}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              {qty}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(cost)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-error)' }}>
                              {formatCurrency(totalLoss)}
                            </td>
                            <td style={{ fontSize: '0.8125rem' }}>{item.reason}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
