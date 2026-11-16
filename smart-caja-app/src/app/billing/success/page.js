'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { reloadProfile } = useAuth()
  
  const planName = searchParams.get('plan') || 'Premium'

  useEffect(() => {
    reloadProfile()

    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 8000)

    return () => clearTimeout(timer)
  }, [reloadProfile, router])

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
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.15) 0%, transparent 65%)'
      }} />

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-10) var(--space-8)',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          margin: '0 auto var(--space-6)',
          borderRadius: '50%',
          background: 'rgba(20, 184, 166, 0.12)',
          border: '1px solid rgba(45, 212, 191, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2DD4BF'
        }}>
          <CheckCircle2 size={38} strokeWidth={2} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.85rem',
          marginBottom: 'var(--space-2)',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          Suscripción Activada
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Tu plan <strong style={{ color: '#2DD4BF', textTransform: 'capitalize' }}>{planName}</strong> ya está activo. Todas las funciones avanzadas han sido habilitadas para tu comercio.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => router.push('/dashboard')}
          >
            Ir al Dashboard <ArrowRight size={16} />
          </button>
          
          <Link href="/settings?tab=billing" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, padding: 'var(--space-2)' }}>
            Ver detalles de mi suscripción
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-base)' }} />}>
      <SuccessContent />
    </Suspense>
  )
}
