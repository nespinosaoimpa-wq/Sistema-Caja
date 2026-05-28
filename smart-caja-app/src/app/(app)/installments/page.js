'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { useToast } from '@/lib/hooks/useToast'

export default function InstallmentsPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const toast = useToast()
  
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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

  const handlePayInstallment = async (planId, amount) => {
    try {
      const plan = plans.find(p => p.id === planId)
      if (!plan) return
      
      const newPaidInstallments = plan.paid_installments + 1
      const newPaidAmount = Number(plan.paid_amount) + Number(amount)
      const newRemaining = Number(plan.total_amount) - newPaidAmount
      const newStatus = newRemaining <= 0.01 ? 'completed' : 'active' // 0.01 to avoid float issues

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

      // Log payment history in installment_payments
      const { error: payError } = await supabase
        .from('installment_payments')
        .insert({
          installment_plan_id: planId,
          tenant_id: tenant.id,
          amount: amount,
          payment_method: 'cash',
          notes: `Pago de cuota ${newPaidInstallments} de ${plan.total_installments}`
        })

      if (payError) {
        console.error('Error logging installment payment:', payError)
      }

      toast.success('Pago de cuota registrado exitosamente')
      loadPlans()
    } catch (err) {
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
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700 }}>
            📋 Cuotas y Cuentas Corrientes
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Administrá los pagos a plazo de tus clientes
          </p>
        </div>
      </div>

      <div className="app-content">
        <div className="card" style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--color-tertiary-light)' }}>
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
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  background: plan.status === 'completed' ? 'var(--bg-card)' : 'var(--bg-input)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <div style={{ fontWeight: 700 }}>{plan.customer_name}</div>
                    <span className={`badge ${plan.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {plan.status === 'completed' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                  
                  {plan.customer_phone && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>📞 {plan.customer_phone}</div>}
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>Ticket #{plan.sales?.ticket_number} — {formatDateTime(plan.created_at).split(',')[0]}</div>

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
                      <span style={{ fontWeight: 700, color: plan.status === 'completed' ? 'inherit' : 'var(--color-tertiary)' }}>{formatCurrency(plan.remaining_amount)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.8125rem' }}>
                      Cuotas: <strong>{plan.paid_installments} / {plan.total_installments}</strong>
                    </div>
                    {plan.status === 'active' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePayInstallment(plan.id, plan.installment_amount)}
                      >
                        Cobrar {formatCurrency(plan.installment_amount)}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
