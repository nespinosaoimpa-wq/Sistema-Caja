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

  useEffect(() => {
    if (tenant?.id) {
      loadShifts()
    }
  }, [tenant?.id])

  const loadShifts = async () => {
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
                    <label className="form-label">Efectivo final en caja</label>
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
    </div>
  )
}
