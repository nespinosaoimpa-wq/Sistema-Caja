'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS, getPaymentMethodLabel } from '@/lib/utils/formatters'

const PAGE_SIZE = 20

export default function SalesPage() {
  const { tenant, profile } = useAuth()
  const supabase = createClient()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // all, today, this_week, this_month
  const [paymentFilter, setPaymentFilter] = useState('all')

  // Branch states
  const [branches, setBranches] = useState([])
  const [branchFilter, setBranchFilter] = useState('all')

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
        sale_items(*),
        online_orders:online_order_id(order_number, source),
        branches:branch_id(name)
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
  }, [sales.length, supabase, tenant])

  useEffect(() => {
    if (tenant?.id) {
      const timer = setTimeout(() => {
        loadSales(true)
      }, 0)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id])

  useEffect(() => {
    if (tenant?.id && tenant.subscription_plan === 'enterprise') {
      supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')
        .then(({ data }) => {
          if (data) setBranches(data)
        })
    }
  }, [tenant, supabase])

  // Lock branch filter for cashiers with fixed branch
  useEffect(() => {
    if (profile?.branch_id) {
      setBranchFilter(profile.branch_id)
    }
  }, [profile])

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

    // Branch filter
    let matchesBranch = true
    if (profile?.branch_id) {
      matchesBranch = sale.branch_id === profile.branch_id
    } else if (tenant?.subscription_plan === 'enterprise' && branchFilter !== 'all') {
      if (branchFilter === 'central') {
        matchesBranch = !sale.branch_id
      } else {
        matchesBranch = sale.branch_id === branchFilter
      }
    }
    
    return matchesSearch && matchesPayment && matchesDate && matchesBranch
  })

  const [selectedSale, setSelectedSale] = useState(null)

  const printTicket = (sale) => {
    setSelectedSale(sale)
  }

  const handlePrintReceipt = (sale) => {
    if (!sale) return
    const now = new Date(sale.created_at)
    const dateStr = formatDateTime(now)
    const itemsHTML = (sale.sale_items || []).map(item => {
      return `<tr>
        <td style="text-align:left;padding:2px 0;">${item.product_name}</td>
        <td style="text-align:center;padding:2px 0;">${item.quantity} u</td>
        <td style="text-align:right;padding:2px 0;">${formatCurrency(item.unit_price)}</td>
        <td style="text-align:right;padding:2px 0;">${formatCurrency(item.subtotal)}</td>
      </tr>`
    }).join('')

    // Exchange/return section for reprint
    let exchangePrintHTML = ''
    const exchItems = sale.exchange_items || []
    if (exchItems.length > 0) {
      const exchangeRowsHTML = exchItems.map(ei => {
        const subtotal = (ei.quantity || ei.qty || 0) * (ei.unit_price || 0)
        return `<tr>
          <td style="text-align:left;padding:2px 0;">${ei.product_name}</td>
          <td style="text-align:center;padding:2px 0;">${ei.quantity || ei.qty}</td>
          <td style="text-align:right;padding:2px 0;">${formatCurrency(ei.unit_price)}</td>
          <td style="text-align:right;padding:2px 0;color:#c00;">-${formatCurrency(subtotal)}</td>
        </tr>`
      }).join('')
      const exchangeTotalVal = exchItems.reduce((s, ei) => s + (ei.quantity || ei.qty || 0) * (ei.unit_price || 0), 0)
      exchangePrintHTML = `
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:10px;font-weight:bold;margin-bottom:3px;">🔄 CAMBIOS / DEVOLUCIONES:</div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <tbody>${exchangeRowsHTML}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#c00;margin-top:3px;"><span>Cambios:</span><span>-${formatCurrency(exchangeTotalVal)}</span></div>
      `
    }

    let paymentInfo = ''
    const paymentMethod = sale.payment_method
    if (paymentMethod === 'cash') {
      paymentInfo = `
        <div style="display:flex;justify-content:space-between;"><span>Recibido:</span><span>${formatCurrency(sale.cash_received || sale.total)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;"><span>Vuelto:</span><span>${formatCurrency(sale.cash_change || 0)}</span></div>
      `
    } else if (paymentMethod === 'debit' || paymentMethod === 'credit') {
      const details = sale.payment_details || {}
      paymentInfo = `
        <div style="display:flex;justify-content:space-between;"><span>Tarjeta:</span><span>${details.card_brand || 'N/A'}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>Cupón:</span><span>#${details.voucher_number || 'N/A'}</span></div>
      `
    } else if (paymentMethod === 'combined') {
      const details = sale.payment_details || {}
      const splits = details.splits || []
      const splitsHTML = splits.map(s => {
        const label = { cash: 'Efectivo', debit: 'Débito', credit: 'Crédito', transfer: 'Transferencia' }[s.method] || s.method
        return `<div style="display:flex;justify-content:space-between;font-size:11px;color:#555;"><span>- ${label}:</span><span>${formatCurrency(s.amount)}</span></div>`
      }).join('')
      paymentInfo = `
        <div style="margin-top:2px;">
          <div style="font-weight:bold;font-size:11px;">Desglose Pago Mixto:</div>
          ${splitsHTML}
        </div>
      `
    }

    const payMethodLabel = { cash: 'Efectivo', debit: 'Débito', credit: 'Crédito', transfer: 'Transferencia', combined: 'Mixto', installment: 'Cuotas' }[paymentMethod] || paymentMethod

    const receiptHTML = `
      <div style="font-family:'Courier New',Courier,monospace;width:72mm;padding:4mm;font-size:12px;color:#000;background:#fff;">
        <div style="text-align:center;margin-bottom:8px;">
          <div style="font-size:16px;font-weight:bold;">${tenant?.name || 'Mi Negocio'}</div>
          <div style="font-size:10px;color:#555;margin-bottom:4px;">Ticket de Venta</div>
          <div style="font-size:10px;font-weight:bold;color:#ff3b30;border:1px solid #ff3b30;padding:2px 4px;display:inline-block;border-radius:3px;">TICKET NO FISCAL</div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:11px;margin-bottom:6px;">
          <div>Fecha: ${dateStr}</div>
          <div>Ticket: #${sale.ticket_number}</div>
          <div>Cajero: ${sale.profiles?.full_name || 'N/A'}</div>
          ${tenant?.subscription_plan === 'enterprise' ? `<div>Sucursal: ${sale.branches?.name || 'Casa Central'}</div>` : ''}
          <div>Origen: ${sale.online_orders ? `Pedido #${sale.online_orders.order_number} (${{
            online: 'Tienda Online',
            whatsapp: 'WhatsApp',
            phone: 'Teléfono',
            preventista: 'Preventa',
            pos: 'Pedido Caja'
          }[sale.online_orders.source] || sale.online_orders.source})` : 'Caja de Negocio'}</div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr style="border-bottom:1px solid #000;">
              <th style="text-align:left;padding:2px 0;">Prod</th>
              <th style="text-align:center;padding:2px 0;">Cant</th>
              <th style="text-align:right;padding:2px 0;">P.U.</th>
              <th style="text-align:right;padding:2px 0;">Subt</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        ${exchangePrintHTML}
        <div style="font-size:12px;">
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;margin:4px 0;"><span>TOTAL:</span><span>${formatCurrency(sale.total)}</span></div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:11px;">
          <div style="display:flex;justify-content:space-between;"><span>Método de pago:</span><span>${payMethodLabel}</span></div>
          ${paymentInfo}
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="text-align:center;font-size:10px;color:#555;margin-top:8px;">
          ¡Gracias por su compra!
        </div>
        <div style="text-align:center;font-size:9px;color:#777;margin-top:6px;font-weight:bold;">
          TICKET NO FISCAL<br/>DOCUMENTO NO VÁLIDO COMO FACTURA
        </div>
      </div>
    `

    const printWindow = window.open('', '_blank', 'width=300,height=600')
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket #${sale.ticket_number}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: 80mm auto; margin: 0; }
            }
            body { margin: 0; padding: 0; background: #fff; }
          </style>
        </head>
        <body>
          ${receiptHTML}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const exportCSV = () => {
    if (filteredSales.length === 0) return

    const headers = ['Fecha', 'Ticket', 'Método de Pago', 'Estado', 'Items', 'Total']
    const rows = filteredSales.map(sale => [
      formatDateTime(sale.created_at),
      sale.ticket_number || '',
      getPaymentMethodLabel(sale),
      sale.status === 'completed' ? 'Completado' : 'Anulado',
      sale.sale_items?.length || 0,
      sale.total || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([String.fromCharCode(0xFEFF) + csvContent], { type: 'text/csv;charset=utf-8;' })
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
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

            {/* Branch selector */}
            {tenant?.subscription_plan === 'enterprise' && !profile?.branch_id && (
              <select 
                className="form-select" 
                style={{ width: 'auto', minWidth: '150px' }}
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
              >
                <option value="all">Todas las sucursales</option>
                <option value="central">Casa Central (Matriz)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
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
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      #{sale.ticket_number}
                      {sale.exchange_items && sale.exchange_items.length > 0 && (
                        <span title={`${sale.exchange_items.length} cambio(s) registrado(s)`} style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', letterSpacing: '0.02em' }}>🔄 CAMBIO</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: sale.online_orders ? 'var(--color-secondary)' : 'var(--text-secondary)', marginTop: '2px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <span>{sale.online_orders ? `🛒 Pedido #${sale.online_orders.order_number}` : '🏪 Caja'}</span>
                      {tenant?.subscription_plan === 'enterprise' && (
                        <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '1px 4px', borderRadius: '3px', fontSize: '0.65rem' }}>
                          🏢 {sale.branches?.name || 'Casa Central'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="badge badge-neutral" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {getPaymentMethodLabel(sale)}
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
              <div style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>{tenant?.name || 'Comercio'}</div>
              <div style={{ fontSize: '0.8125rem', color: '#666', marginBottom: '6px' }}>Ticket de Venta</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#ff3b30', border: '1px solid #ff3b30', padding: '2px 4px', display: 'inline-block', borderRadius: '3px', marginBottom: '8px' }}>TICKET NO FISCAL</div>
              <div style={{ fontSize: '0.8125rem', color: '#666' }}>Nro: {selectedSale.ticket_number}</div>
              <div style={{ fontSize: '0.8125rem', color: '#666' }}>{formatDateTime(selectedSale.created_at)}</div>
              {selectedSale.profiles?.full_name && (
                <div style={{ fontSize: '0.8125rem', color: '#666' }}>Cajero: {selectedSale.profiles.full_name}</div>
              )}
              {tenant?.subscription_plan === 'enterprise' && (
                <div style={{ fontSize: '0.8125rem', color: '#666' }}>Sucursal: {selectedSale.branches?.name || 'Casa Central'}</div>
              )}
              <div style={{ fontSize: '0.8125rem', color: '#666' }}>
                Origen: {selectedSale.online_orders ? `Pedido #${selectedSale.online_orders.order_number} (${{
                  online: 'Tienda Online',
                  whatsapp: 'WhatsApp',
                  phone: 'Teléfono',
                  preventista: 'Preventa',
                  pos: 'Pedido Caja'
                }[selectedSale.online_orders.source] || selectedSale.online_orders.source})` : 'Caja de Negocio'}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-4)', minHeight: '60px' }}>
              {selectedSale.sale_items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                  <div>{item.quantity}× {item.product_name}</div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>

            {/* Exchange/Return section in modal */}
            {selectedSale.exchange_items && selectedSale.exchange_items.length > 0 && (
              <div style={{ borderTop: '1px dashed #ccc', paddingTop: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c00', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>🔄 Cambios / Devoluciones:</div>
                {selectedSale.exchange_items.map((ei, idx) => {
                  const qty = ei.quantity || ei.qty || 0
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8125rem' }}>
                      <div style={{ color: '#c00' }}>-{qty}× {ei.product_name} <span style={{ fontSize: '0.7rem', color: '#999' }}>({ei.reason})</span></div>
                      <div style={{ fontWeight: 600, color: '#c00' }}>-{formatCurrency(qty * ei.unit_price)}</div>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, color: '#c00', borderTop: '1px solid #f5c6c6', paddingTop: '4px', marginTop: '4px' }}>
                  <span>Total cambios:</span>
                  <span>-{formatCurrency(selectedSale.exchange_total || selectedSale.exchange_items.reduce((s, ei) => s + (ei.quantity || ei.qty || 0) * ei.unit_price, 0))}</span>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px dashed #ccc', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(selectedSale.total)}</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', marginBottom: 'var(--space-6)', borderTop: '1px dashed #ccc', paddingTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Método de pago:</span>
                <span style={{ fontWeight: 600 }}>{{ cash: 'Efectivo', debit: 'Débito', credit: 'Crédito', transfer: 'Transferencia', combined: 'Mixto', installment: 'Cuotas' }[selectedSale.payment_method] || selectedSale.payment_method}</span>
              </div>
              {selectedSale.payment_method === 'cash' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>Recibido:</span>
                    <span>{formatCurrency(selectedSale.cash_received || selectedSale.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '2px' }}>
                    <span>Vuelto:</span>
                    <span>{formatCurrency(selectedSale.cash_change || 0)}</span>
                  </div>
                </>
              )}
              {(selectedSale.payment_method === 'debit' || selectedSale.payment_method === 'credit') && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>Tarjeta:</span>
                    <span>{selectedSale.payment_details?.card_brand || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '2px' }}>
                    <span>Cupón:</span>
                    <span>#{selectedSale.payment_details?.voucher_number || 'N/A'}</span>
                  </div>
                </>
              )}
              {selectedSale.payment_method === 'combined' && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#666' }}>Desglose Pago Mixto:</div>
                  {(selectedSale.payment_details?.splits || []).map((s, idx) => {
                    const label = { cash: 'Efectivo', debit: 'Débito', credit: 'Crédito', transfer: 'Transferencia' }[s.method] || s.method
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#555', paddingLeft: '8px', marginTop: '2px' }}>
                        <span>- {label}:</span>
                        <span>{formatCurrency(s.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginBottom: '8px' }}>
              ¡Gracias por su compra!
            </div>
            <div style={{ textAlign: 'center', fontSize: '9px', color: '#777', marginBottom: 'var(--space-6)', fontWeight: 'bold' }}>
              TICKET NO FISCAL<br/>DOCUMENTO NO VÁLIDO COMO FACTURA
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setSelectedSale(null)} style={{ flex: 1, padding: '10px', background: '#f0f0f0', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                Cerrar
              </button>
              <button onClick={() => handlePrintReceipt(selectedSale)} style={{ flex: 1, padding: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
