'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { tenant, profile, loading: authLoading } = useAuth()
  const [error, setError] = useState(null)

  const planId = searchParams.get('planId') || 'basic'
  const planName = searchParams.get('planName') || 'Básico'
  const price = searchParams.get('price') || '20000'

  useEffect(() => {
    // Wait until auth has fully resolved
    if (authLoading) return
    if (!tenant || !profile) {
      router.push('/login')
      return
    }

    let isSubscribed = true

    const createSubscription = async () => {
      try {
        const response = await fetch('/api/billing/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId,
            tenantId: tenant.id,
            email: profile.email,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al conectar con Mercado Pago')
        }

        if (data.init_point && isSubscribed) {
          window.location.href = data.init_point
        } else {
          throw new Error('Respuesta inválida de Mercado Pago')
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err.message)
        }
      }
    }

    createSubscription()

    return () => { isSubscribed = false }
  }, [authLoading, tenant, profile, router, planId])

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
              onClick={() => window.location.reload()}
            >
              Reintentar
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
              <div className="spinner" />
            </div>
            
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>
              Preparando tu suscripción...
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
              Serás redirigido de forma segura a Mercado Pago en un momento.
            </p>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-highlight)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              textAlign: 'left',
              marginBottom: 'var(--space-6)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Plan</span>
                <span style={{ fontWeight: 600 }}>{planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Frecuencia</span>
                <span style={{ fontWeight: 600 }}>Mensual</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: 'var(--space-4) 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                  ${Number(price).toLocaleString('es-AR')} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>ARS</span>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#009EE3', fontSize: '0.875rem', fontWeight: 600 }}>
              <span style={{ background: '#009EE3', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>MP</span>
              Pago seguro con Mercado Pago
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
