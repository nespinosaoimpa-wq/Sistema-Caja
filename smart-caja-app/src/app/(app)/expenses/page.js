'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { useToast } from '@/lib/hooks/useToast'
import { Banknote, CreditCard, ArrowLeftRight, Calendar, Plus, Filter, TrendingDown, ClipboardList } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  { value: 'combustible', label: '⛽ Combustible / Fletes' },
  { value: 'servicios', label: '🔌 Servicios (Luz, Internet, etc.)' },
  { value: 'mercaderia', label: '📦 Proveedores / Mercadería' },
  { value: 'sueldos', label: '👥 Sueldos / Jornales' },
  { value: 'mantenimiento', label: '🔧 Mantenimiento / Reparación' },
  { value: 'general', label: '📝 Gastos Generales / Varios' }
]

const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Efectivo de Caja', icon: <Banknote size={16} /> },
  { value: 'card', label: '💳 Tarjeta (Firma/Débito)', icon: <CreditCard size={16} /> },
  { value: 'transfer', label: '📱 Transferencia / MP', icon: <ArrowLeftRight size={16} /> }
]

export default function ExpensesPage() {
  const { tenant, profile } = useAuth()
  const supabase = createClient()
  const toast = useToast()

  const [expenses, setExpenses] = useState([])
  const [activeShift, setActiveShift] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('combustible')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [reason, setReason] = useState('')
  const [customDate, setCustomDate] = useState('')

  // Filter states
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('month') // 'month' | 'week' | 'all'

  const loadData = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    try {
      // 1. Fetch active shift (if any)
      const { data: shiftData, error: shiftErr } = await supabase
        .from('shifts')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'open')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (shiftErr) console.error('Error fetching shift:', shiftErr)
      setActiveShift(shiftData || null)

      // 2. Fetch cash movements of type 'expense'
      const { data: movements, error: movementsErr } = await supabase
        .from('cash_movements')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('tenant_id', tenant.id)
        .eq('type', 'expense')
        .order('created_at', { ascending: false })

      if (movementsErr) throw movementsErr
      setExpenses(movements || [])
    } catch (err) {
      console.error('[loadData] Error:', err)
      toast.error('Error al cargar gastos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [tenant?.id, profile?.id, supabase, toast])

  useEffect(() => {
    if (tenant?.id) {
      loadData()
    }
  }, [tenant?.id, loadData])

  const handleRegisterExpense = async (e) => {
    e.preventDefault()
    const expAmount = parseFloat(amount)
    if (isNaN(expAmount) || expAmount <= 0) {
      toast.warning('Ingresá un monto de gasto válido mayor a 0')
      return
    }
    if (!reason.trim()) {
      toast.warning('Ingresá una descripción o motivo para el gasto')
      return
    }

    // Cash verification
    if (paymentMethod === 'cash' && !activeShift) {
      toast.warning('Para pagar en efectivo de la caja física, debe haber un turno de caja abierto.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        tenant_id: tenant.id,
        shift_id: paymentMethod === 'cash' ? activeShift.id : null,
        type: 'expense',
        amount: expAmount,
        reason: reason.trim(),
        category,
        payment_method: paymentMethod,
        user_id: profile?.id || null
      }

      if (customDate) {
        payload.created_at = new Date(customDate).toISOString()
      }

      const { error } = await supabase
        .from('cash_movements')
        .insert(payload)

      if (error) {
        // Safe check if shift_id null fails due to migration not run
        if (error.message?.includes('null value in column "shift_id"')) {
          throw new Error('La base de datos requiere asociar el gasto a un turno abierto. Por favor, cambia el medio de pago a Efectivo de Caja o abre una caja registradora primero (alternativamente, aplica la migración SQL 014 en Supabase).')
        }
        throw error
      }

      toast.success('Gasto registrado con éxito')
      setAmount('')
      setReason('')
      setCustomDate('')
      loadData()
    } catch (err) {
      console.error('[handleRegisterExpense] Error:', err)
      toast.error('Error al registrar gasto: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Filters logic
  const filteredExpenses = expenses.filter(item => {
    // 1. Category filter
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory

    // 2. Payment Method filter
    const matchesPaymentMethod = filterPaymentMethod === 'all' || item.payment_method === filterPaymentMethod

    // 3. Date range filter
    const itemDate = new Date(item.created_at)
    const now = new Date()
    let matchesDate = true
    if (filterDateRange === 'month') {
      matchesDate = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    } else if (filterDateRange === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchesDate = itemDate >= oneWeekAgo
    }

    return matchesCategory && matchesPaymentMethod && matchesDate
  })

  // Calculate totals
  const now = new Date()
  const thisMonthExpenses = expenses.filter(item => {
    const itemDate = new Date(item.created_at)
    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
  })

  const totalMonthlyExpenses = thisMonthExpenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
  const totalMonthlyCashExpenses = thisMonthExpenses
    .filter(item => item.payment_method === 'cash')
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)

  // Grouped expenses by category for quick breakdown
  const categoryTotals = thisMonthExpenses.reduce((acc, item) => {
    const cat = item.category || 'general'
    acc[cat] = (acc[cat] || 0) + parseFloat(item.amount || 0)
    return acc
  }, {})

  const getCategoryLabel = (catValue) => {
    const found = EXPENSE_CATEGORIES.find(c => c.value === catValue)
    return found ? found.label : catValue
  }

  return (
    <div style={{ paddingBottom: 'var(--space-8)' }}>
      <style>{`
        .expenses-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: var(--space-6);
          align-items: start;
        }
        @media (max-width: 1024px) {
          .expenses-grid {
            grid-template-columns: 1fr;
          }
        }
        .metric-card {
          position: relative;
          overflow: hidden;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }
        .metric-glow {
          position: absolute;
          top: 0;
          right: 0;
          width: 120px;
          height: 120px;
          background: var(--color-tertiary);
          filter: blur(55px);
          opacity: 0.08;
          pointer-events: none;
        }
        .cat-bar-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(0,0,0,0.1);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }
        .cat-bar-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
        }
        .cat-bar-line {
          width: 100%;
          height: 6px;
          background: var(--bg-surface);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 4px;
        }
        .cat-bar-fill {
          height: 100%;
          background: var(--color-tertiary, #f59e0b);
          border-radius: 3px;
        }
      `}</style>

      {/* Header */}
      <div className="app-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={20} style={{ color: 'var(--color-tertiary)' }} /> Control de Gastos
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Registrá compras de mercadería, combustible para camionetas de reparto, mantenimiento y otros gastos operativos.
          </p>
        </div>
      </div>

      {/* Monthly Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="metric-card">
          <div className="metric-glow" />
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Gastos del Mes (Total)</div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-tertiary)' }}>
              {formatCurrency(totalMonthlyExpenses)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Suma de todos los medios de pago.</span>
          </div>
        </div>

        <div className="metric-card">
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Gastos desde la Caja (Mes)</div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
              {formatCurrency(totalMonthlyCashExpenses)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Descontados del efectivo del arqueo.</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="expenses-grid">
        
        {/* Left column: Add Expense form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Registrar Gasto</span>
            </div>
            
            <form onSubmit={handleRegisterExpense} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Active Shift warning */}
              {paymentMethod === 'cash' && !activeShift && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--color-error)' }}>
                  ⚠️ No tenés un turno de caja abierto. Debes abrir caja para retirar efectivo, o seleccionar otro método de pago (Tarjeta/Transferencia).
                </div>
              )}

              {/* Amount */}
              <div className="form-group">
                <label className="form-label required">Monto del Gasto</label>
                <div className="form-input-icon">
                  <span className="input-icon" style={{ color: 'var(--color-tertiary)' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label required">Rubro / Categoría</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label className="form-label required">Método de Pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: '6px',
                        background: paymentMethod === m.value ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-surface)',
                        border: `1px solid ${paymentMethod === m.value ? 'var(--color-tertiary)' : 'var(--border-color)'}`,
                        color: paymentMethod === m.value ? 'var(--color-tertiary)' : 'var(--text-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      {m.icon}
                      {m.label.replace(/💵 |💳 |📱 /, '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Notes */}
              <div className="form-group">
                <label className="form-label required">Descripción / Comprobante</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Combustible camioneta Hilux reparto"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                />
              </div>

              {/* Custom Date (optional) */}
              <div className="form-group">
                <label className="form-label">Fecha del Gasto (opcional)</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                />
                <span className="form-hint">Dejar en blanco para registrar ahora mismo.</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: 'var(--color-tertiary)', borderColor: 'var(--color-tertiary)', fontWeight: 700, padding: '12px', marginTop: '8px', color: '#000' }}
                disabled={submitting || (paymentMethod === 'cash' && !activeShift)}
              >
                {submitting ? 'Procesando...' : 'Guardar Gasto'}
              </button>

            </form>
          </div>

          {/* Monthly breakdown by category card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Distribución por Rubro (Mes)</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.keys(categoryTotals).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '12px' }}>No hay gastos en este mes.</div>
              ) : (
                Object.entries(categoryTotals).map(([cat, val]) => {
                  const pct = totalMonthlyExpenses > 0 ? (val / totalMonthlyExpenses * 100) : 0
                  return (
                    <div key={cat} className="cat-bar-container">
                      <div className="cat-bar-row">
                        <span style={{ fontWeight: 600, color: '#fff' }}>{getCategoryLabel(cat)}</span>
                        <span>{formatCurrency(val)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="cat-bar-line">
                        <div className="cat-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: Expenses History list */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span className="card-title">Historial de Gastos</span>
            
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Rubro selector */}
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem', height: '32px' }}
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">Todos los rubros</option>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              {/* Pago selector */}
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem', height: '32px' }}
                value={filterPaymentMethod}
                onChange={e => setFilterPaymentMethod(e.target.value)}
              >
                <option value="all">Medio de pago</option>
                <option value="cash">Efectivo de Caja</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>

              {/* Rango fecha buttons */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {['month', 'week', 'all'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterDateRange(t)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: filterDateRange === t ? 'var(--bg-card-hover)' : 'transparent',
                      border: `1px solid ${filterDateRange === t ? 'var(--border-color)' : 'transparent'}`,
                      color: filterDateRange === t ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      height: '32px'
                    }}
                  >
                    {t === 'month' ? 'Este Mes' : t === 'week' ? '7 días' : 'Todo'}
                  </button>
                ))}
              </div>

            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando gastos...</div>
            ) : filteredExpenses.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No se encontraron gastos que coincidan con los filtros.
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción / Comprobante</th>
                      <th>Rubro</th>
                      <th>Pago</th>
                      <th>Cajero</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(item => {
                      const methodLabel = PAYMENT_METHODS.find(m => m.value === item.payment_method)?.label || item.payment_method
                      return (
                        <tr key={item.id} style={{ opacity: item.shift_id ? 1 : 0.8 }}>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.created_at)}</td>
                          <td style={{ fontWeight: 600, color: '#fff' }}>
                            {item.reason}
                            {!item.shift_id && item.payment_method === 'cash' && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-tertiary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                                Fuera de caja
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>{getCategoryLabel(item.category)}</td>
                          <td style={{ fontSize: '0.8125rem' }}>{methodLabel}</td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.profiles?.full_name || 'N/A'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-tertiary)', fontSize: '0.95rem' }}>
                            {formatCurrency(item.amount)}
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
    </div>
  )
}
