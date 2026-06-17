'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils/formatters'
import { useToast } from '@/lib/hooks/useToast'
import UpgradePrompt from '@/components/ui/UpgradePrompt'

const STATUSES = [
  { id: 'pending',    label: 'Pendiente',   emoji: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { id: 'confirmed',  label: 'Confirmado',  emoji: '✅', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { id: 'preparing',  label: 'Preparando',  emoji: '⚙️', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  { id: 'ready',      label: 'Listo',       emoji: '📦', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  { id: 'delivered',  label: 'Entregado',   emoji: '🏁', color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
]

const SOURCES = {
  online:      { label: 'Tienda online', color: '#7C3AED' },
  whatsapp:    { label: 'WhatsApp',      color: '#25D366' },
  phone:       { label: 'Teléfono',      color: '#3b82f6' },
  pos:         { label: 'Caja (POS)',    color: '#10B981' },
  preventista: { label: 'Preventa',      color: '#F59E0B' },
}

export default function OrdersPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const toast = useToast()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active') // 'active' | 'all'
  const [newCount, setNewCount] = useState(0)

  const loadOrders = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('online_orders')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data)
      setNewCount(data.filter(o => o.status === 'pending').length)
    }
    setLoading(false)
  }, [supabase, tenant])

  useEffect(() => {
    if (!tenant?.id) return
    if (tenant.subscription_plan === 'basic') { setLoading(false); return }
    const timer = setTimeout(() => loadOrders(), 0)
    return () => clearTimeout(timer)
  }, [tenant, loadOrders])

  // Realtime subscription
  useEffect(() => {
    if (!tenant?.id || tenant.subscription_plan === 'basic') return
    const channel = supabase
      .channel(`orders_${tenant.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'online_orders',
        filter: `tenant_id=eq.${tenant.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev])
          setNewCount(prev => prev + 1)
          toast.success(`🛒 ¡Nuevo pedido de ${payload.new.customer_name}!`)
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenant?.id, tenant?.subscription_plan, supabase, toast])

  const moveOrder = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    const { error } = await supabase
      .from('online_orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      
    if (error) {
      toast.error('Error al actualizar estado')
    } else {
      // If moving to confirmed for the first time, deduct stock
      if (newStatus === 'confirmed' && order.status === 'pending') {
        const items = Array.isArray(order.items) ? order.items : []
        for (const item of items) {
          if (item.product_id) {
            // Deduct product stock
            const { data: prod } = await supabase.from('products').select('stock_quantity, control_stock').eq('id', item.product_id).single()
            if (prod && prod.control_stock !== false) {
              await supabase.from('products').update({ stock_quantity: Math.max(0, prod.stock_quantity - item.qty) }).eq('id', item.product_id)
            }
            
            // Deduct variant stock if exists
            if (item.variant_id) {
              const { data: variant } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single()
              if (variant) {
                await supabase.from('product_variants').update({ stock_quantity: Math.max(0, variant.stock_quantity - item.qty) }).eq('id', item.variant_id)
              }
            }
          }
        }
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      if (newStatus !== 'pending') setNewCount(prev => Math.max(0, prev - 1))
    }
  }

  const cancelOrder = async (orderId) => {
    if (!confirm('¿Cancelar este pedido?')) return
    await supabase.from('online_orders').update({ status: 'cancelled' }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
    toast.info('Pedido cancelado')
  }

  const waLink = (phone, orderNumber, customerName) => {
    const msg = encodeURIComponent(`Hola ${customerName}! Te confirmamos que recibimos tu pedido ${orderNumber} y ya lo estamos preparando. Gracias por elegirnos 🙌`)
    const clean = phone?.replace(/\D/g, '') || ''
    return clean ? `https://wa.me/${clean}?text=${msg}` : null
  }

  if (loading) return (
    <div style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Cargando pedidos...</div>
  )

  if (tenant?.subscription_plan === 'basic') {
    return (
      <UpgradePrompt
        title="Módulo de Pedidos Online"
        description="Recibí pedidos desde tu tienda online pública, gestioná estados en un tablero Kanban y notificá a tus clientes por WhatsApp con un clic."
        requiredPlan="professional"
      />
    )
  }

  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/tienda/${tenant?.slug}`
    : `/tienda/${tenant?.slug}`

  const visibleOrders = filter === 'active'
    ? orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    : orders

  const columns = STATUSES.map(s => ({
    ...s,
    items: visibleOrders.filter(o => o.status === s.id),
  }))

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div className="app-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛒 Pedidos Online
            {newCount > 0 && (
              <span style={{ background: '#EF4444', color: '#fff', fontSize: '0.7rem', fontWeight: 800, borderRadius: '12px', padding: '2px 8px' }}>
                {newCount} nuevo{newCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Gestiona tus pedidos de la tienda online en tiempo real
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Filter toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--border-color)' }}>
            {[['active', 'Activos'], ['all', 'Todos']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)} style={{
                padding: '6px 14px', borderRadius: 'calc(var(--radius-md) - 3px)',
                background: filter === val ? 'var(--color-primary)' : 'transparent',
                color: filter === val ? '#000' : 'var(--text-secondary)',
                fontWeight: filter === val ? 700 : 500,
                border: 'none', cursor: 'pointer', fontSize: '0.8125rem', transition: 'all 0.15s',
              }}>{lbl}</button>
            ))}
          </div>

          {/* Store link */}
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            🌐 Ver mi tienda
          </a>

          <button
            onClick={() => { navigator.clipboard.writeText(storeUrl); toast.success('¡Link copiado!') }}
            className="btn btn-ghost"
            style={{ fontSize: '0.8125rem', padding: '8px 14px' }}
          >
            📋 Copiar link
          </button>
        </div>
      </div>

      {/* Store not enabled warning */}
      {!tenant?.ecommerce_enabled && (
        <div style={{
          margin: '0 16px', padding: '14px 16px',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 'var(--radius-md)', color: '#f59e0b',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem',
        }}>
          ⚠️ Tu tienda online no está habilitada.
          <a href="/settings?tab=store" style={{ color: 'inherit', fontWeight: 700 }}>Activarla en Configuración →</a>
        </div>
      )}

      {/* Kanban board */}
      <div style={{
        flex: 1, overflowX: 'auto',
        padding: 'var(--space-4)',
        display: 'flex', gap: '12px', alignItems: 'flex-start',
      }}>
        {columns.map((col, idx) => (
          <div key={col.id} style={{
            width: '290px', minWidth: '290px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            display: 'flex', flexDirection: 'column',
            maxHeight: '100%', overflow: 'hidden',
          }}>
            {/* Column header */}
            <div style={{
              padding: '14px 16px',
              background: col.bg,
              borderBottom: `2px solid ${col.color}22`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: col.color }}>
                {col.emoji} {col.label}
              </span>
              <span style={{
                background: `${col.color}22`, color: col.color,
                padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
              }}>{col.items.length}</span>
            </div>

            {/* Cards */}
            <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {col.items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  Sin pedidos
                </div>
              )}
              {col.items.map(order => {
                const items = Array.isArray(order.items) ? order.items : []
                const src = SOURCES[order.source] || SOURCES.online
                const wa = waLink(order.customer_phone, order.order_number, order.customer_name)
                const nextStatus = STATUSES[idx + 1]
                const prevStatus = STATUSES[idx - 1]
                const timeAgo = order.created_at
                  ? (() => {
                      const diff = Math.floor((Date.now() - new Date(order.created_at)) / 60000)
                      if (diff < 1) return 'Ahora'
                      if (diff < 60) return `${diff}min`
                      if (diff < 1440) return `${Math.floor(diff / 60)}h`
                      return new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                    })()
                  : ''

                return (
                  <div key={order.id} style={{
                    background: 'var(--bg-input)',
                    border: order.status === 'pending' ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    boxShadow: order.status === 'pending' ? '0 0 12px rgba(245,158,11,0.08)' : '0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.customer_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          #{order.order_number} · {timeAgo}
                        </div>
                      </div>
                      <span style={{
                        background: `${src.color}18`, color: src.color,
                        fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '8px',
                      }}>{src.label}</span>
                    </div>

                    {/* Contact */}
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        📞 {order.customer_phone}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        {order.delivery_mode === 'delivery' ? `🚚 Delivery · ${order.customer_address || 'Sin dir.'}` : '🏪 Retira en local'}
                      </div>
                      
                      {/* Delivery Date & Advance Payment */}
                      {(order.delivery_date || (order.advance_payment && order.advance_payment > 0)) && (
                        <div style={{
                          fontSize: '0.75rem', color: 'var(--text-muted)',
                          padding: '6px 8px', background: 'rgba(255,255,255,0.03)',
                          borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '3px',
                          marginTop: '8px', border: '1px solid var(--border-color)'
                        }}>
                          {order.delivery_date && (
                            <div>📅 Entrega: <strong style={{ color: 'var(--text-secondary)' }}>{new Date(order.delivery_date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></div>
                          )}
                          {order.advance_payment && order.advance_payment > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                              <span>💰 Seña: <strong style={{ color: 'var(--color-secondary)' }}>{formatCurrency(order.advance_payment)}</strong></span>
                              <span>Pnd: <strong style={{ color: 'var(--color-error)' }}>{formatCurrency(order.total - order.advance_payment)}</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginBottom: '8px' }}>
                      {items.slice(0, 3).map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {item.name}{item.variant_label ? ` (${item.variant_label})` : ''} x{item.qty}
                          </span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(item.unit_price * item.qty)}</span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          +{items.length - 3} más
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(order.total)}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" style={{
                          flex: '0 0 auto',
                          padding: '6px 10px', background: '#25D366', border: 'none',
                          borderRadius: 'var(--radius-sm)', color: '#fff',
                          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}>
                          📱 WA
                        </a>
                      )}
                      {nextStatus && (
                        <button
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem' }}
                          onClick={() => moveOrder(order.id, nextStatus.id)}
                        >
                          {nextStatus.emoji} {nextStatus.label} →
                        </button>
                      )}
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <Link
                          href={`/pos?order_id=${order.id}`}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                            background: 'var(--color-secondary)',
                            color: '#000',
                            fontWeight: 700
                          }}
                        >
                          💵 Cobrar
                        </Link>
                      )}
                      {prevStatus && idx < STATUSES.length - 1 && (
                        <button
                          className="btn btn-ghost"
                          style={{ flex: '0 0 auto', padding: '6px 8px', fontSize: '0.75rem' }}
                          onClick={() => moveOrder(order.id, prevStatus.id)}
                        >←</button>
                      )}
                      {col.id !== 'delivered' && col.id !== 'cancelled' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          style={{
                            flex: '0 0 auto', padding: '6px 8px',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 'var(--radius-sm)', color: '#EF4444',
                            fontSize: '0.75rem', cursor: 'pointer',
                          }}
                        >✕</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
