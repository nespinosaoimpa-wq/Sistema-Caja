'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { tenant, profile, loading: authLoading } = useAuth()
  
  const planId = searchParams.get('planId') || 'basic'
  const planName = searchParams.get('planName') || 'Básico'
  const basePrice = Number(searchParams.get('price') || '20000')

  const [price, setPrice] = useState(basePrice)
  const [couponCode, setCouponCode] = useState(searchParams.get('coupon') || '')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState(null)

  // Auto-validate coupon if provided in URL on mount
  useEffect(() => {
    if (authLoading) return
    if (!tenant || !profile) {
      router.push('/login')
      return
    }

    const urlCoupon = searchParams.get('coupon')
    if (urlCoupon) {
      handleApplyCoupon(urlCoupon)
    }
  }, [authLoading, tenant, profile])

  const handleApplyCoupon = async (codeToApply) => {
    const code = codeToApply || couponCode
    if (!code.trim()) return

    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/billing/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok || !data.valid) {
        throw new Error(data.error || 'Cupón inválido')
      }

      const coupon = data.coupon
      setAppliedCoupon(coupon)
      
      // Calculate new price
      if (coupon.discount_type === 'percentage') {
        setPrice(Math.max(0, basePrice * (1 - coupon.discount_value / 100)))
      } else if (coupon.discount_type === 'fixed') {
        setPrice(Math.max(0, basePrice - coupon.discount_value))
      }
    } catch (err) {
      setCouponError(err.message)
      setAppliedCoupon(null)
      setPrice(basePrice)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setPrice(basePrice)
    setCouponCode('')
    setCouponError(null)
  }

  const handlePayment = async () => {
    setPaymentLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          tenantId: tenant.id,
          email: profile.email,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con Mercado Pago')
      }

      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        throw new Error('Respuesta inválida de Mercado Pago')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: 'var(--space-5)',
      fontFamily: 'var(--font-body)',
      color: 'var(--text-primary)',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 70%)'
      }} />

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-8)',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        {error ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>Algo salió mal</h2>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--color-error)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-6)',
              fontSize: '0.9375rem',
            }}>
              {error}
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handlePayment}
            >
              Reintentar Pago
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-3)' }}
              onClick={() => router.push('/settings?tab=billing')}
            >
              Volver a Configuración
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>
              Confirmar tu Suscripción
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: '0.9375rem' }}>
              Revisá los detalles de tu plan antes de proceder al pago seguro.
            </p>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              textAlign: 'left',
              marginBottom: 'var(--space-5)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Plan</span>
                <span style={{ fontWeight: 600 }}>{planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Frecuencia</span>
                <span style={{ fontWeight: 600 }}>Mensual</span>
              </div>

              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', color: '#10B981' }}>
                  <span style={{ fontSize: '0.9375rem' }}>Descuento ({appliedCoupon.code})</span>
                  <span>
                    -{appliedCoupon.discount_type === 'percentage' 
                      ? `${appliedCoupon.discount_value}%` 
                      : `$${appliedCoupon.discount_value}`}
                  </span>
                </div>
              )}

              <div style={{ height: '1px', background: 'var(--border-color)', margin: 'var(--space-4) 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Total a Pagar</span>
                <div style={{ textAlign: 'right' }}>
                  {appliedCoupon && (
                    <div style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2px' }}>
                      ${basePrice.toLocaleString('es-AR')} ARS
                    </div>
                  )}
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                    ${price.toLocaleString('es-AR')} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>ARS/mes</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Coupon input */}
            <div style={{ marginBottom: 'var(--space-6)', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                ¿Tenés un código de descuento?
              </label>
              {!appliedCoupon ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="form-input"
                    placeholder="Ej: LANZAMIENTO50"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                    disabled={couponLoading}
                  />
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleApplyCoupon()}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{ padding: '0 16px', flexShrink: 0 }}
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <span style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: 600 }}>
                    ✓ Cupón {appliedCoupon.code} aplicado
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8125rem' }}
                  >
                    Quitar
                  </button>
                </div>
              )}
              {couponError && (
                <div style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '6px' }}>
                  ❌ {couponError}
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--space-4)' }}
              onClick={handlePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Redirigiendo...
                </span>
              ) : (
                'Pagar con Mercado Pago 🚀'
              )}
            </button>

            <button 
              className="btn btn-ghost" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => router.push('/settings?tab=billing')}
              disabled={paymentLoading}
            >
              Cancelar y volver
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#009EE3', fontSize: '0.8125rem', fontWeight: 600, marginTop: 'var(--space-6)' }}>
              <span style={{ background: '#009EE3', color: 'white', padding: '1px 4px', borderRadius: '3px', fontSize: '0.6875rem' }}>MP</span>
              Pago seguro y encriptado por Mercado Pago
            </div>

            <div style={{
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                💡 ¿Inconvenientes para pagar? Podés realizar transferencia directa al alias <strong style={{ color: '#fff', fontFamily: 'monospace' }}>smart05</strong> (Titular: Smart Caja) y enviar el comprobante a nuestro WhatsApp de soporte para habilitar tu membresía.
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--color-primary-light);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-base)' }} />}>
      <CheckoutContent />
    </Suspense>
  )
}
