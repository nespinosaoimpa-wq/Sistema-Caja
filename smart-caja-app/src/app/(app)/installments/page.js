'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { useToast } from '@/lib/hooks/useToast'
import { CheckCircle2, DollarSign, X } from 'lucide-react'

export default function InstallmentsPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const toast = useToast()
  
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Custom payment modal state
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [payingPlan, setPayingPlan] = useState(false)

  const loadPlans = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('installment_plans')
      .select('*, sales(ticket_number)')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })

    if (data) setPlans(data)
    setLoading(false)
  }, [supabase, tenant])

  useEffect(() => {
    if (tenant?.id && tenant?.subscription_plan !== 'basic') {
      const timer = setTimeout(() => {
        loadPlans()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [tenant?.id, tenant?.subscription_plan, loadPlans])

  const applyPayment = async (planId, amount) => {
    try {
      const plan = plans.find(p => p.id === planId)
      if (!plan) return false

      const newPaidAmount = Number(plan.paid_amount) + Number(amount)
      const newRemaining = Math.max(0, Number(plan.total_amount) - newPaidAmount)
      const newPaidInstallments = Math.min(
        plan.total_installments,
        plan.paid_installments + Math.ceil(amount / plan.installment_amount)
      )
      const newStatus = newRemaining <= 0.01 ? 'completed' : 'active'

      const { error } = await supabase
        .from('installment_plans')
        .update({
          paid_installments: newPaidInstallments,
          paid_amount: newPaidAmount,
          remaining_amount: newRemaining,
          status: newStatus
        })
        .eq('id', planId)

      if (error) throw error

      // Log payment history
      await supabase
        .from('installment_payments')
        .insert({
          installment_plan_id: planId,
          tenant_id: tenant.id,
          amount: amount,
          payment_method: 'cash',
          notes: newStatus === 'completed' ? 'Pago total — Saldo cancelado' : `Pago parcial — Saldo restante ${formatCurrency(newRemaining)}`
        })

      return true
    } catch (err) {
      console.error('Error applying payment:', err)
      return false
    }
  }

  // Pay one installment (the default installment_amount)
  const handlePayInstallment = async (planId) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return
    const ok = await applyPayment(planId, plan.installment_amount)
    if (ok) {
      toast.success('Pago de cuota registrado exitosamente')
      loadPlans()
    } else {
      toast.error('Error al registrar pago')
    }
  }

  // Pay everything remaining at once
  const handlePayAll = async (planId) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return
    const ok = await applyPayment(planId, plan.remaining_amount)
    if (ok) {
      toast.success('✅ Saldo cancelado completamente')
      loadPlans()
    } else {
      toast.error('Error al registrar pago')
    }
  }

  // Open custom payment modal
  const openPayModal = (plan) => {
    setSelectedPlan(plan)
    setCustomAmount(plan.installment_amount.toString())
    setShowPayModal(true)
  }

  // Confirm custom payment
  const handleCustomPay = async () => {
    const amount = parseFloat(customAmount)
    if (!amount || amount <= 0) {
      toast.warning('Ingresá un monto válido')
      return
    }
    if (amount > Number(selectedPlan.remaining_amount) + 0.01) {
      toast.warning('El monto no puede superar el saldo restante')
      return
    }
    setPayingPlan(true)
    const ok = await applyPayment(selectedPlan.id, amount)
    setPayingPlan(false)
    if (ok) {
      const newRemaining = Number(selectedPlan.remaining_amount) - amount
      if (newRemaining <= 0.01) {
        toast.success('✅ Saldo cancelado completamente')
      } else {
        toast.success(`Pago de ${formatCurrency(amount)} registrado`)
      }
      setShowPayModal(false)
      setSelectedPlan(null)
      loadPlans()
    } else {
      toast.error('Error al registrar pago')
    }
  }

  const filteredPlans = plans.filter(p => 
    !searchTerm || 
    p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sales?.ticket_number?.includes(searchTerm)
  )

  const totalPending = plans
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + Number(p.remaining_amount), 0)

  const activePlans = plans.filter(p => p.status === 'active').length

  if (tenant?.subscription_plan === 'basic') {
    return (
      <UpgradePrompt 
        title="Plan de Cuotas y Cuentas Corrientes" 
        description="Permite a tus clientes pagar a plazo, gestiona deudas y mantén el control financiero."
        requiredPlan="professional"
      />
    )
  }

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCardIcon /> Cuotas y Cuentas Corrientes
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Administrá los pagos a plazo de tus clientes
          </p>
        </div>
      </div>

      <div className="app-content">
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div className="card" style={{ border: '1px solid var(--color-tertiary-light)' }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px' }}>Deuda Total a Cobrar</div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-tertiary)' }}>
                  {formatCurrency(totalPending)}
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-tertiary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                💰
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px' }}>Clientes con Saldo Activo</div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800 }}>
                  {activePlans}
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                👥
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-body">
            <div className="form-input-icon" style={{ maxWidth: '400px' }}>
              <span className="input-icon">🔍</span>
              <input 
                className="form-input" 
                placeholder="Buscar por cliente o nro de ticket..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          {loading ? (
             <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando planes...</div>
          ) : filteredPlans.length === 0 ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📝</div>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No hay planes de cuotas</h3>
              <p style={{ color: 'var(--text-muted)' }}>Podés crear planes de cuotas desde la pantalla de Caja al momento de cobrar.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
              {filteredPlans.map(plan => (
                <div key={plan.id} style={{ 
                  border: `1px solid ${plan.status === 'completed' ? 'var(--color-secondary)' : 'var(--border-color)'}`, 
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  background: plan.status === 'completed' ? 'rgba(16,185,129,0.04)' : 'var(--bg-input)',
                  opacity: plan.status === 'completed' ? 0.85 : 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{plan.customer_name}</div>
                    <span className={`badge ${plan.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {plan.status === 'completed' ? '✅ Pagado' : 'Pendiente'}
                    </span>
                  </div>
                  
                  {plan.customer_phone && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>📞 {plan.customer_phone}</div>}
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    Ticket #{plan.sales?.ticket_number} — {formatDateTime(plan.created_at).split(',')[0]}
                  </div>

                  <div style={{ background: 'var(--bg-card)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total:</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(plan.total_amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Pagado:</span>
                      <span style={{ color: 'var(--color-secondary)' }}>{formatCurrency(plan.paid_amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Resta:</span>
                      <span style={{ fontWeight: 700, color: plan.status === 'completed' ? 'var(--color-secondary)' : 'var(--color-tertiary)' }}>
                        {formatCurrency(plan.remaining_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {plan.total_amount > 0 && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (Number(plan.paid_amount) / Number(plan.total_amount)) * 100)}%`,
                          background: plan.status === 'completed' ? 'var(--color-secondary)' : 'var(--color-primary)',
                          borderRadius: '99px', transition: 'width 0.4s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        <span>Cuotas: {plan.paid_installments} / {plan.total_installments}</span>
                        <span>{Math.round((Number(plan.paid_amount) / Number(plan.total_amount)) * 100)}% cobrado</span>
                      </div>
                    </div>
                  )}

                  {plan.status === 'active' && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Cobrar cuota */}
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, minWidth: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        onClick={() => handlePayInstallment(plan.id)}
                      >
                        <DollarSign size={14} /> Cobrar {formatCurrency(plan.installment_amount)}
                      </button>
                      {/* Monto personalizado */}
                      <button 
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 10px', border: '1px solid var(--border-color)' }}
                        title="Ingresar monto personalizado"
                        onClick={() => openPayModal(plan)}
                      >
                        Otro monto
                      </button>
                      {/* Pagar todo */}
                      <button 
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 10px', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)' }}
                        title="Cancelar saldo completo"
                        onClick={() => handlePayAll(plan.id)}
                      >
                        <CheckCircle2 size={14} style={{ marginRight: '4px' }} />
                        Pagar Todo
                      </button>
                    </div>
                  )}
                  {plan.status === 'completed' && (
                    <div style={{ textAlign: 'center', color: 'var(--color-secondary)', fontWeight: 600, fontSize: '0.875rem', padding: '4px 0' }}>
                      ✅ Saldo cancelado
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Payment Modal */}
      {showPayModal && selectedPlan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-card)' }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} /> Registrar Pago
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowPayModal(false); setSelectedPlan(null) }}><X size={16}/></button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{selectedPlan.customer_name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Saldo restante: <strong style={{ color: 'var(--color-tertiary)' }}>{formatCurrency(selectedPlan.remaining_amount)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Monto a cobrar</label>
                <div className="form-input-icon">
                  <span className="input-icon" style={{ color: 'var(--color-secondary)' }}>$</span>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max={selectedPlan.remaining_amount}
                    step="1"
                    placeholder="0"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick amount buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-ghost btn-sm"
                  style={{ border: '1px solid var(--border-color)' }}
                  onClick={() => setCustomAmount(selectedPlan.installment_amount.toString())}
                >
                  1 cuota ({formatCurrency(selectedPlan.installment_amount)})
                </button>
                <button 
                  className="btn btn-ghost btn-sm"
                  style={{ border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)' }}
                  onClick={() => setCustomAmount(selectedPlan.remaining_amount.toString())}
                >
                  Total ({formatCurrency(selectedPlan.remaining_amount)})
                </button>
              </div>

              {customAmount && parseFloat(customAmount) > 0 && (
                <div style={{
                  background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Nuevo saldo restante:</span>
                  <span style={{ fontWeight: 700, color: parseFloat(customAmount) >= Number(selectedPlan.remaining_amount) ? 'var(--color-secondary)' : 'var(--color-tertiary)' }}>
                    {formatCurrency(Math.max(0, Number(selectedPlan.remaining_amount) - parseFloat(customAmount)))}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowPayModal(false); setSelectedPlan(null) }}>
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={handleCustomPay}
                  disabled={payingPlan || !customAmount || parseFloat(customAmount) <= 0}
                >
                  <DollarSign size={16} /> {payingPlan ? 'Registrando...' : 'Confirmar Pago'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Small inline CreditCard icon component
function CreditCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
      <rect width="22" height="16" x="1" y="4" rx="2" ry="2"/>
      <line x1="1" x2="23" y1="10" y2="10"/>
    </svg>
  )
}
