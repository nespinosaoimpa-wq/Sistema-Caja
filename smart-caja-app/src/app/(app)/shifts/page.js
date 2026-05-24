'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { useToast } from '@/lib/hooks/useToast'

export default function ShiftsPage() {
  const { tenant, profile } = useAuth()
  const supabase = createClient()
  const toast = useToast()
  
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeShift, setActiveShift] = useState(null)
  
  const [closingCash, setClosingCash] = useState('')
  const [showBillCounter, setShowBillCounter] = useState(false)
  const [bills, setBills] = useState({
    '10000': 0, '5000': 0, '2000': 0, '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0
  })

  // Card auditing states
  const [shiftSales, setShiftSales] = useState([])
  const [checkedVouchers, setCheckedVouchers] = useState({})
  const [editedVouchers, setEditedVouchers] = useState({})
  // Open Shift Modal state

  const [showOpenModal, setShowOpenModal] = useState(false)
  const [openingCashInput, setOpeningCashInput] = useState('')
  const [openingShift, setOpeningShift] = useState(false)


  const calculateTotalBills = () => {
    return Object.entries(bills).reduce((sum, [val, qty]) => sum + (parseFloat(val) * parseInt(qty || 0)), 0)
  }

  const handleSaveBills = () => {
    setClosingCash(calculateTotalBills().toString())
    setShowBillCounter(false)
  }

  useEffect(() => {
    if (tenant?.id) {
      loadShifts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id])

  async function loadShifts() {
    setLoading(true)
    const { data } = await supabase
      .from('shifts')
      .select('*, profiles:user_id(full_name)')
      .eq('tenant_id', tenant.id)
      .order('opened_at', { ascending: false })
      .limit(50)

    if (data) {
      setShifts(data)
      const open = data.find(s => s.status === 'open' && s.user_id === profile.id)
      setActiveShift(open || null)

      if (open) {
        // Load sales for the active shift
        const { data: sales } = await supabase
          .from('sales')
          .select('*')
          .eq('shift_id', open.id)
          .eq('status', 'completed')
        
        if (sales) {
          setShiftSales(sales)
          const initialChecked = {}
          const initialEdited = {}
          sales.forEach(sale => {
            if (sale.payment_method === 'debit' || sale.payment_method === 'credit') {
              initialChecked[sale.id] = true
              initialEdited[sale.id] = sale.payment_details?.voucher_number || ''
            }
          })
          setCheckedVouchers(initialChecked)
          setEditedVouchers(initialEdited)
        }
      } else {
        setShiftSales([])
      }
    }
    setLoading(false)
  }

  const handleCloseShift = async () => {
    if (!activeShift) return
    if (closingCash === '') { toast.warning('Ingresá el efectivo final en caja'); return }

    try {
      // 1. Save updated vouchers
      for (const saleId of Object.keys(editedVouchers)) {
        const originalSale = shiftSales.find(s => s.id === saleId)
        const newVoucher = editedVouchers[saleId]
        if (originalSale && originalSale.payment_details?.voucher_number !== newVoucher) {
          const updatedDetails = {
            ...originalSale.payment_details,
            voucher_number: newVoucher
          }
          await supabase
            .from('sales')
            .update({ payment_details: updatedDetails })
            .eq('id', saleId)
        }
      }

      // 2. Recalculate totals
      const cashSalesTotal = shiftSales
        .filter(s => s.payment_method === 'cash')
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0)

      const debitSalesTotal = shiftSales
        .filter(s => s.payment_method === 'debit')
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0)

      const creditSalesTotal = shiftSales
        .filter(s => s.payment_method === 'credit')
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0)

      const combinedSalesTotal = shiftSales
        .filter(s => s.payment_method === 'combined')
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0)

      const installmentSalesTotal = shiftSales
        .filter(s => s.payment_method === 'installment')
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0)

      const debitCardSalesTotal = shiftSales
        .filter(s => s.payment_method === 'debit' && !(s.payment_details?.is_transfer || s.payment_details?.card_brand === 'Transferencia'))
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0)

      const transferSalesTotal = shiftSales
        .filter(s => s.payment_method === 'debit' && (s.payment_details?.is_transfer || s.payment_details?.card_brand === 'Transferencia'))
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0)

      const totalCardSalesExpected = debitCardSalesTotal + creditSalesTotal
      
      const totalCardTicketsVerified = shiftSales
        .filter(s => (s.payment_method === 'debit' || s.payment_method === 'credit') && !(s.payment_details?.is_transfer || s.payment_details?.card_brand === 'Transferencia') && checkedVouchers[s.id])
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0)

      const cardDiscrepancy = totalCardTicketsVerified - totalCardSalesExpected

      const notesText = `Conciliación POSnet: Tarjetas registradas ${formatCurrency(totalCardSalesExpected)}, Conciliadas físicamente ${formatCurrency(totalCardTicketsVerified)}. Diferencia de tarjetas: ${formatCurrency(cardDiscrepancy)}. Total Transferencias del turno: ${formatCurrency(transferSalesTotal)}.`

      // 3. Update shift in Supabase
      const { error } = await supabase
        .from('shifts')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closing_cash: parseFloat(closingCash),
          total_cash_sales: cashSalesTotal,
          total_debit_sales: debitSalesTotal,
          total_credit_sales: creditSalesTotal,
          total_combined_sales: combinedSalesTotal,
          total_installment_sales: installmentSalesTotal,
          total_transactions: shiftSales.length,
          notes: notesText
        })
        .eq('id', activeShift.id)

      if (error) throw error
      
      toast.success('Turno cerrado correctamente')
      setClosingCash('')
      loadShifts()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleOpenShift = async () => {
    const openingCash = parseFloat(openingCashInput) || 0
    setOpeningShift(true)
    try {
      const { error } = await supabase
        .from('shifts')
        .insert({
          tenant_id: tenant.id,
          user_id: profile.id,
          opening_cash: openingCash,
          status: 'open',
        })
      if (error) throw error
      toast.success('¡Caja abierta exitosamente!')
      setShowOpenModal(false)
      setOpeningCashInput('')
      loadShifts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setOpeningShift(false)
    }
  }

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>
            ⏱️ Turnos y Caja
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Apertura y cierre de caja por empleado
          </p>
        </div>
      </div>

      <div className="app-content">
        {/* Active Shift Area */}
        <div className="card" style={{ marginBottom: 'var(--space-6)', border: activeShift ? '2px solid var(--color-secondary)' : '1px solid var(--border-color)' }}>
          <div className="card-body">
            {activeShift ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Upper block: status & main data */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', color: 'var(--color-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🟢 Turno Abierto <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '100px', fontWeight: 400 }}>ID: #{activeShift.id.slice(-6)}</span>
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Iniciado el {formatDateTime(activeShift.opened_at)} por {profile?.full_name || 'Cajero'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Caja Inicial</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{formatCurrency(activeShift.opening_cash)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ventas Efectivo</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-secondary)' }}>+{formatCurrency(shiftSales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + parseFloat(s.total), 0))}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Efectivo Esperado</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency((activeShift.opening_cash || 0) + shiftSales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + parseFloat(s.total), 0))}</div>
                    </div>
                  </div>
                </div>

                {/* Middle block: columns for Card Reconciliation and Closing Input */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-6)' }}>
                  
                  {/* Left Column: POSnet voucher list */}
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '20px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      💳 Control de Cupones POSnet / Tarjeta ({shiftSales.filter(s => (s.payment_method === 'debit' || s.payment_method === 'credit') && !(s.payment_details?.is_transfer || s.payment_details?.card_brand === 'Transferencia')).length})
                    </h4>
                    
                    {shiftSales.filter(s => (s.payment_method === 'debit' || s.payment_method === 'credit') && !(s.payment_details?.is_transfer || s.payment_details?.card_brand === 'Transferencia')).length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '16px 0' }}>
                        No se registraron ventas con tarjeta en este turno.
                      </p>
                    ) : (
                      <div style={{ overflowX: 'auto', maxHeight: '250px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.8125rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                              <th style={{ padding: '6px' }}>Conciliar</th>
                              <th style={{ padding: '6px' }}>Ticket</th>
                              <th style={{ padding: '6px' }}>Marca / Lector</th>
                              <th style={{ padding: '6px' }}>Monto</th>
                              <th style={{ padding: '6px' }}>Nro Operación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shiftSales.filter(s => (s.payment_method === 'debit' || s.payment_method === 'credit') && !(s.payment_details?.is_transfer || s.payment_details?.card_brand === 'Transferencia')).map(sale => (
                              <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: checkedVouchers[sale.id] ? 1 : 0.6 }}>
                                <td style={{ padding: '8px 6px' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={!!checkedVouchers[sale.id]} 
                                    onChange={(e) => setCheckedVouchers(prev => ({ ...prev, [sale.id]: e.target.checked }))}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  />
                                </td>
                                <td style={{ padding: '8px 6px', fontWeight: 600 }}>#{sale.ticket_number}</td>
                                <td style={{ padding: '8px 6px' }}>
                                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', marginRight: '4px' }}>
                                    {sale.payment_details?.card_brand || 'Tarj'}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {sale.payment_details?.integrated ? '⚡ POSnet' : '✍️ Manual'}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 6px', fontWeight: 600, color: 'var(--color-secondary)' }}>
                                  {formatCurrency(sale.total)}
                                </td>
                                <td style={{ padding: '8px 6px' }}>
                                  <input 
                                    className="form-input"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', width: '95px', height: '24px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff' }}
                                    value={editedVouchers[sale.id] || ''}
                                    onChange={(e) => setEditedVouchers(prev => ({ ...prev, [sale.id]: e.target.value }))}
                                    placeholder="Nro Cupón"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Close shift inputs & details */}
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Cierre y Arqueo de Caja</h4>

                    {/* Expected Card sales total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tarjetas registradas:</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>
                        {formatCurrency(shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').reduce((sum, s) => sum + parseFloat(s.total), 0))}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Cupones controlados:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                        {formatCurrency(shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').filter(s => checkedVouchers[s.id]).reduce((sum, s) => sum + parseFloat(s.total), 0))}
                      </span>
                    </div>

                    {/* Discrepancy on cards */}
                    {shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').length > 0 && (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem',
                        padding: '6px 12px', borderRadius: '6px',
                        background: (shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').filter(s => checkedVouchers[s.id]).reduce((sum, s) => sum + parseFloat(s.total), 0) - shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').reduce((sum, s) => sum + parseFloat(s.total), 0)) === 0 ? 'rgba(78, 222, 163, 0.05)' : 'rgba(255, 178, 183, 0.1)',
                        border: `1px solid ${(shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').filter(s => checkedVouchers[s.id]).reduce((sum, s) => sum + parseFloat(s.total), 0) - shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').reduce((sum, s) => sum + parseFloat(s.total), 0)) === 0 ? 'rgba(78, 222, 163, 0.2)' : 'rgba(255, 178, 183, 0.3)'}`,
                        color: (shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').filter(s => checkedVouchers[s.id]).reduce((sum, s) => sum + parseFloat(s.total), 0) - shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').reduce((sum, s) => sum + parseFloat(s.total), 0)) === 0 ? 'var(--color-secondary)' : 'var(--color-error)'
                      }}>
                        <span>Diferencia tarjetas:</span>
                        <span style={{ fontWeight: 700 }}>
                          {formatCurrency(shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').filter(s => checkedVouchers[s.id]).reduce((sum, s) => sum + parseFloat(s.total), 0) - shiftSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit').reduce((sum, s) => sum + parseFloat(s.total), 0))}
                        </span>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

                    {/* Closing cash inputs */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label flex justify-between items-center" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                          <span>Efectivo real en caja</span>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '1px 6px', fontSize: '0.65rem' }}
                            onClick={() => setShowBillCounter(true)}
                          >
                            💵 Contar billetes
                          </button>
                        </label>
                        <input 
                          className="form-input" 
                          type="number" 
                          placeholder="0.00"
                          value={closingCash}
                          onChange={e => setClosingCash(e.target.value)}
                        />
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={handleCloseShift}
                        style={{ height: '42px', padding: '0 20px', borderRadius: 'var(--radius-md)' }}
                      >
                        🔒 Cerrar Turno
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>😴</div>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No tenés un turno activo</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Para empezar a registrar ventas en efectivo, abrí un nuevo turno de caja.</p>
                <button className="btn btn-secondary btn-lg" onClick={() => setShowOpenModal(true)}>
                  🔓 Abrir Caja Nueva
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Historial de Turnos</span>
          </div>
          {loading ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Cargando...</div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Cajero</th>
                    <th>Apertura</th>
                    <th>Cierre</th>
                    <th style={{ textAlign: 'right' }}>Caja Inicial</th>
                    <th style={{ textAlign: 'right' }}>Caja Final</th>
                    <th style={{ textAlign: 'right' }}>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(shift => {
                    const diff = shift.closing_cash !== null ? shift.closing_cash - shift.opening_cash : null;
                    return (
                      <tr key={shift.id}>
                        <td>
                          <span className={`badge ${shift.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>
                            {shift.status === 'open' ? 'Abierto' : 'Cerrado'}
                          </span>
                        </td>
                        <td>{shift.profiles?.full_name}</td>
                        <td>{formatDateTime(shift.opened_at)}</td>
                        <td>{shift.closed_at ? formatDateTime(shift.closed_at) : '-'}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(shift.opening_cash)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {shift.closing_cash !== null ? formatCurrency(shift.closing_cash) : '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: diff > 0 ? 'var(--color-secondary)' : diff < 0 ? 'var(--color-error)' : 'inherit' }}>
                          {diff !== null ? formatCurrency(diff) : '-'}
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

      {/* Bill Counter Modal */}
      {showBillCounter && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)' }}>
            <div className="card-header">
              <span className="card-title">💵 Contador de Billetes</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBillCounter(false)}>✕</button>
            </div>
            <div className="card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {Object.keys(bills).sort((a,b) => parseFloat(b) - parseFloat(a)).map(val => (
                  <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div style={{ flex: 1, fontWeight: 600, color: 'var(--color-secondary)' }}>${val}</div>
                    <div style={{ color: 'var(--text-muted)' }}>x</div>
                    <input 
                      className="form-input"
                      type="number"
                      min="0"
                      value={bills[val] || ''}
                      onChange={e => setBills(prev => ({ ...prev, [val]: parseInt(e.target.value) || 0 }))}
                      style={{ width: '80px', textAlign: 'center' }}
                    />
                    <div style={{ width: '80px', textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(parseFloat(val) * (bills[val] || 0))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-body" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Efectivo:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {formatCurrency(calculateTotalBills())}
                </span>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSaveBills}>
                Confirmar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ OPEN SHIFT PREMIUM MODAL ============ */}
      {showOpenModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowOpenModal(false); setOpeningCashInput('') } }}
        >
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(78,222,163,0.1)',
            position: 'relative',
          }}>
            {/* Close */}
            <button
              onClick={() => { setShowOpenModal(false); setOpeningCashInput('') }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
            >✕</button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(78,222,163,0.1)',
                border: '2px solid rgba(78,222,163,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', margin: '0 auto 16px'
              }}>🔓</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-headline)', color: '#fff', marginBottom: '6px' }}>
                Abrir Nueva Caja
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Ingresá el efectivo inicial con el que empezás el turno.
              </p>
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Efectivo Inicial
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-secondary)', fontWeight: 800, fontSize: '1.25rem'
                }}>$</span>
                <input
                  type="number"
                  className="form-input"
                  value={openingCashInput}
                  onChange={e => setOpeningCashInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !openingShift) handleOpenShift() }}
                  placeholder="0"
                  autoFocus
                  min="0"
                  style={{
                    fontSize: '1.75rem', fontWeight: 800, textAlign: 'right',
                    paddingLeft: '40px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px',
                    height: 'auto',
                    background: 'var(--bg-surface)',
                    border: openingCashInput ? '2px solid var(--color-secondary)' : '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'border-color 0.2s',
                    color: '#fff'
                  }}
                />
              </div>
              {openingCashInput && (
                <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--color-secondary)', marginTop: '6px', fontWeight: 600 }}>
                  {formatCurrency(parseFloat(openingCashInput) || 0)}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div style={{
              background: 'rgba(78,222,163,0.05)', border: '1px solid rgba(78,222,163,0.15)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '24px',
              fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5
            }}>
              💡 Si empezás sin efectivo, podés dejar en <strong style={{ color: '#fff' }}>$0</strong>. El sistema igual va a registrar todas las ventas.
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-ghost"
                onClick={() => { setShowOpenModal(false); setOpeningCashInput('') }}
                style={{ flex: 1 }}
                disabled={openingShift}
              >
                Cancelar
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleOpenShift}
                disabled={openingShift}
                style={{
                  flex: 2,
                  fontWeight: 800,
                  fontSize: '1rem',
                  padding: '14px',
                  opacity: openingShift ? 0.7 : 1
                }}
              >
                {openingShift ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    Abriendo...
                  </span>
                ) : '🔓 Confirmar Apertura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
