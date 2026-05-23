'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { useToast } from '@/lib/hooks/useToast'
import UpgradePrompt from '@/components/ui/UpgradePrompt'

const ORDER_STATUSES = [
  { id: 'pending', label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { id: 'production', label: 'En Producción', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { id: 'ready', label: 'Listo', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { id: 'delivered', label: 'Entregado', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' }
]

export default function OrdersPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const toast = useToast()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Orders feature available for Professional and Enterprise
    if (tenant?.id && (tenant.subscription_plan === 'professional' || tenant.subscription_plan === 'enterprise')) {
      loadOrders()
    } else {
      setLoading(false)
    }
  }, [tenant])

  const loadOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })

    if (data) setOrders(data)
    setLoading(false)
  }

  const moveOrder = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      
    if (error) {
      toast.error('Error al actualizar pedido')
    } else {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
  }

  if (loading) return <div style={{ padding: 'var(--space-8)' }}>Cargando pedidos...</div>

  if (tenant?.subscription_plan === 'basic') {
    return (
      <UpgradePrompt 
        title="Módulo de Pedidos (Kanban)" 
        description="Ideal para imprentas, bordados, o kioscos con rotisería. Toma señas, gestiona fechas de entrega y lleva tus órdenes de trabajo con un tablero interactivo por estados."
        requiredPlan="professional"
      />
    )
  }

  // Agrupamos por estado
  const columns = ORDER_STATUSES.map(statusObj => ({
    ...statusObj,
    items: orders.filter(o => o.status === statusObj.id)
  }))

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 700 }}>
            📋 Tablero de Pedidos
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Gestiona los estados de tus trabajos y órdenes a entregar
          </p>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflowX: 'auto', 
        padding: 'var(--space-4)',
        display: 'flex',
        gap: 'var(--space-4)',
        alignItems: 'flex-start'
      }}>
        {columns.map((col, idx) => (
          <div key={col.id} style={{
            width: '320px',
            minWidth: '320px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '100%',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '2px solid',
              borderColor: col.color,
              background: col.bg,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: col.color }}>{col.label}</h3>
              <span style={{ 
                background: 'rgba(0,0,0,0.2)', padding: '2px 8px', 
                borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' 
              }}>
                {col.items.length}
              </span>
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {col.items.map(order => (
                <div key={order.id} style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700 }}>{order.customer_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      #{order.id.slice(0, 6)}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <div>📞 {order.customer_phone || 'Sin teléfono'}</div>
                    {order.delivery_date && <div>📅 Entrega: {new Date(order.delivery_date).toLocaleDateString()}</div>}
                  </div>

                  <div style={{ borderTop: '1px dashed var(--border-color)', margin: '8px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                    <span>Total:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-tertiary)' }}>
                    <span>Seña:</span>
                    <span>{formatCurrency(order.advance_payment)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-error)', fontWeight: 700, marginTop: '4px' }}>
                    <span>Saldo:</span>
                    <span>{formatCurrency(order.total - order.advance_payment)}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    {idx > 0 && (
                      <button 
                        className="btn btn-ghost" 
                        style={{ flex: 1, padding: '4px', fontSize: '0.75rem' }}
                        onClick={() => moveOrder(order.id, columns[idx-1].id)}
                      >
                        ← Volver
                      </button>
                    )}
                    {idx < columns.length - 1 && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1, padding: '4px', fontSize: '0.75rem' }}
                        onClick={() => moveOrder(order.id, columns[idx+1].id)}
                      >
                        Avanzar →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
