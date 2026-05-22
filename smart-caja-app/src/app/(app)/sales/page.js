'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from '@/lib/utils/formatters'

const PAGE_SIZE = 20

export default function SalesPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // all, today, this_week, this_month
  const [paymentFilter, setPaymentFilter] = useState('all')

  useEffect(() => {
    if (tenant?.id) {
      loadSales(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id])

  const loadSales = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true)
      setSales([])
    } else {
      setLoadingMore(true)
    }

    const from = reset ? 0 : sales.length
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        profiles:user_id(full_name),
        sale_items(*)
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error && data) {
      setSales(prev => reset ? data : [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    }

    setLoading(false)
    setLoadingMore(false)
  }, [sales.length, supabase, tenant?.id])

  // Filters
  const filteredSales = sales.filter(sale => {
    // Search by ticket number
    const matchesSearch = !searchTerm || sale.ticket_number?.includes(searchTerm)
    
    // Payment filter
    const matchesPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter
    
    // Date filter — use fresh Date objects to avoid mutation
    let matchesDate = true
    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.created_at)
      const now = new Date()
      if (dateFilter === 'today') {
        matchesDate = saleDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'this_week') {
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        matchesDate = saleDate >= weekAgo
      } else if (dateFilter === 'this_month') {
        matchesDate = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
      }
    }
    
    return matchesSearch && matchesPayment && matchesDate
  })

  const [selectedSale, setSelectedSale] = useState(null)

  const printTicket = (sale) => {
    setSelectedSale(sale)
  }

  const exportCSV = () => {
    if (filteredSales.length === 0) return

    const headers = ['Fecha', 'Ticket', 'Método de Pago', 'Estado', 'Items', 'Total']
    const rows = filteredSales.map(sale => [
      formatDateTime(sale.created_at),
      sale.ticket_number || '',
      PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method || '',
      sale.status === 'completed' ? 'Completado' : 'Anulado',
      sale.sale_items?.length || 0,
      sale.total || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>
            🧾 Historial de Ventas
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Registro completo de transacciones
          </p>
        </div>
        <div className="flex items-center gap-3" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={exportCSV}>
            ⬇️ Exportar CSV
          </button>
        </div>
      </div>

      <div className="app-content">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-body" style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div className="form-input-icon" style={{ flex: '1', minWidth: '200px' }}>
              <span className="input-icon">🔍</span>
              <input 
                className="form-input" 
                placeholder="Buscar por nro de ticket..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-select" 
              style={{ width: 'auto', minWidth: '150px' }}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="this_week">Últimos 7 días</option>
              <option value="this_month">Este mes</option>
            </select>
            <select 
              className="form-select" 
              style={{ width: 'auto', minWidth: '150px' }}
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
            >
              <option value="all">Todos los pagos</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data List */}
        <div className="card">
          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Cargando historial...
            </div>
          ) : filteredSales.length === 0 ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
               <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📭</div>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No se encontraron ventas</h3>
              <p style={{ color: 'var(--text-muted)' }}>No hay resultados para los filtros seleccionados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredSales.map((sale, i) => (
                <div key={sale.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 80px 100px',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  borderBottom: i < filteredSales.length - 1 ? '1px solid var(--border-color)' : 'none',
                  background: 'var(--bg-input)',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                onClick={() => printTicket(sale)}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{formatDateTime(sale.created_at).split(', ')[0]}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(sale.created_at).split(', ')[1]}</div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-primary)' }}>#{sale.ticket_number}</div>
                  <div>
                    <span className="badge badge-neutral" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {PAYMENT_METHOD_LABELS[sale.payment_method]}
                    </span>
                  </div>
                  <div>
                    <span className={`badge ${sale.status === 'completed' ? 'badge-success' : 'badge-error'}`}>
                      {sale.status === 'completed' ? 'Completado' : 'Anulado'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {sale.sale_items?.length || 0} arts.
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-secondary)' }}>
                    {formatCurrency(sale.total)}
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => loadSales(false)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Cargando...' : 'Cargar más ventas'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedSale && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 'var(--space-4)'
        }} onClick={() => setSelectedSale(null)}>
          <div style={{
            background: '#fff', // Tickets are usually white like receipt paper
            color: '#000',
            width: '100%', maxWidth: '350px',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)', borderBottom: '1px dashed #ccc', paddingBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>{tenant?.name || 'Comercio'}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Comprobante de Venta</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Nro: {selectedSale.ticket_number}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>{formatDateTime(selectedSale.created_at)}</div>
            </div>

            <div style={{ marginBottom: 'var(--space-6)', minHeight: '150px' }}>
              {selectedSale.sale_items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <div>{item.quantity}x {item.product_name}</div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed #ccc', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(selectedSale.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '8px', color: '#666' }}>
                <span>Pago con:</span>
                <span>{PAYMENT_METHOD_LABELS[selectedSale.payment_method]}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setSelectedSale(null)} style={{ flex: 1, padding: '10px', background: '#f0f0f0', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                Cerrar
              </button>
              <button onClick={() => window.print()} style={{ flex: 1, padding: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
