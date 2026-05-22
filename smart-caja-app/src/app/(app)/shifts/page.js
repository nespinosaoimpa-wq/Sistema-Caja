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
    }
    setLoading(false)
  }

  const handleCloseShift = async () => {
    if (!activeShift) return
    if (!closingCash) { toast.warning('Ingresá el efectivo final en caja'); return }

    try {
      const { error } = await supabase
        .from('shifts')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closing_cash: parseFloat(closingCash),
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
    const openingCash = parseFloat(prompt('¿Con cuánto efectivo iniciás la caja?', '0') || 0)
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
      toast.success('Caja abierta exitosamente')
      loadShifts()
    } catch (err) {
      toast.error(err.message)
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', color: 'var(--color-secondary)', marginBottom: 'var(--space-2)' }}>
                    🟢 Turno Abierto
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Iniciado a las {formatDateTime(activeShift.opened_at)}<br/>
                    Efectivo inicial: <strong>{formatCurrency(activeShift.opening_cash)}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1, maxWidth: '200px' }}>
                    <label className="form-label flex justify-between items-center">
                      <span>Efectivo final en caja</span>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ padding: '2px 8px', fontSize: '0.6875rem' }}
                        onClick={() => setShowBillCounter(true)}
                      >
                        💵 Contar
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
                  <button className="btn btn-primary" onClick={handleCloseShift}>
                    🔒 Cerrar Caja
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>😴</div>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No tenés un turno activo</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Para empezar a registrar ventas en efectivo, abrí un nuevo turno de caja.</p>
                <button className="btn btn-secondary btn-lg" onClick={handleOpenShift}>
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
    </div>
  )
}
