'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from '@/lib/utils/formatters'

export default function SalesPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // all, today, this_week, this_month
  const [paymentFilter, setPaymentFilter] = useState('all')

  useEffect(() => {
    if (tenant?.id) {
      loadSales()
    }
  }, [tenant?.id])

  const loadSales = async () => {
    setLoading(true)
    
    // In a real app we'd paginate, but for now we fetch top 100
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        profiles:user_id(full_name),
        sale_items(*)
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setSales(data)
    }
    setLoading(false)
  }

  // Filters
  const filteredSales = sales.filter(sale => {
    // Search by ticket number
    const matchesSearch = !searchTerm || sale.ticket_number?.includes(searchTerm)
    
    // Payment filter
    const matchesPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter
    
    // Date filter
    let matchesDate = true
    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.created_at)
      const now = new Date()
      if (dateFilter === 'today') {
        matchesDate = saleDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'this_week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        matchesDate = saleDate >= weekAgo
      } else if (dateFilter === 'this_month') {
        matchesDate = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
      }
    }
    
    return matchesSearch && matchesPayment && matchesDate
  })

  const printTicket = (sale) => {
    // In a real implementation we'd open a printable view or send to thermal printer
    alert(`Imprimiendo ticket #${sale.ticket_number}`)
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
          <button className="btn btn-primary" onClick={() => window.print()}>
            ⬇️ Exportar Reporte
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

        {/* Data Table */}
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
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Ticket #</th>
                    <th>Cajero</th>
                    <th>Método de Pago</th>
                    <th style={{ textAlign: 'center' }}>Artículos</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => (
                    <tr key={sale.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{formatDateTime(sale.created_at).split(', ')[0]}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(sale.created_at).split(', ')[1]}</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{sale.ticket_number}</div>
                      </td>
                      <td>{sale.profiles?.full_name || 'Sistema'}</td>
                      <td>
                        <span className="badge badge-neutral">
                          {PAYMENT_METHOD_LABELS[sale.payment_method]}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {sale.sale_items?.length || 0}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-secondary)' }}>
                        {formatCurrency(sale.total)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${sale.status === 'completed' ? 'badge-success' : 'badge-error'}`}>
                          {sale.status === 'completed' ? 'Completado' : 'Anulado'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="btn btn-ghost btn-sm"
                            title="Ver detalles"
                          >
                            👁️
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm"
                            title="Imprimir Ticket"
                            onClick={() => printTicket(sale)}
                          >
                            🖨️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
