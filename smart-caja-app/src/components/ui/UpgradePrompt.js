'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'

const PLAN_LABELS = {
  basic: 'Básico',
  professional: 'Profesional',
  enterprise: 'Empresa',
}

export default function UpgradePrompt({ title, description, requiredPlan }) {
  const router = useRouter()
  const { tenant, profile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async (e) => {
    e.preventDefault()
    if (!tenant?.id) {
      router.push('/settings?tab=billing')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: requiredPlan,
          tenantId: tenant.id,
          email: profile?.email || tenant?.email || '',
        })
      })

      const data = await res.json()

      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        throw new Error(data.error || 'Error al generar link de pago')
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Error al iniciar el pago. Intentá de nuevo.')
      // Fallback: navigate to billing settings so user can still upgrade
      router.push('/settings?tab=billing')
    } finally {
      setLoading(false)
    }
  }

  const planLabel = PLAN_LABELS[requiredPlan] || requiredPlan

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-12) var(--space-6)',
      textAlign: 'center',
      height: '100%',
      minHeight: '400px'
    }}>
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-10)',
        maxWidth: '500px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔒</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-8)' }}>
          {description}
        </p>

        <div style={{
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#A855F7', fontWeight: 600, marginBottom: '4px' }}>
            Plan requerido: {planLabel}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Mejorá tu suscripción para desbloquear esta y otras herramientas avanzadas.
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            display: 'block',
            background: loading ? 'rgba(168, 85, 247, 0.5)' : 'linear-gradient(135deg, #A855F7, #9333EA)',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
            textAlign: 'center',
            fontSize: '1rem',
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = '1' }}
        >
          {loading ? 'Procesando...' : `Mejorar a Plan ${planLabel}`}
        </button>
      </div>
    </div>
  )
}
