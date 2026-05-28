'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { reloadProfile } = useAuth()
  
  const planName = searchParams.get('plan') || 'Premium'

  useEffect(() => {
    // Reload profile to get updated tenant status
    reloadProfile()

    // Auto redirect after 8 seconds
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
      {/* Confetti / Glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at center, rgba(78, 222, 163, 0.15) 0%, transparent 60%)'
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
        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div className="success-icon-container">
          <div className="success-icon">✓</div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', marginBottom: 'var(--space-2)', color: 'white' }}>
          ¡Suscripción Activada!
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', fontSize: '1rem', lineHeight: 1.5 }}>
          Tu plan <strong style={{ color: 'var(--color-primary)', textTransform: 'capitalize' }}>{planName}</strong> ya está activo. Todas las funciones premium están habilitadas para tu negocio.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', justifyContent: 'center', background: 'var(--color-secondary)' }}
            onClick={() => router.push('/dashboard')}
          >
            Ir al Dashboard →
          </button>
          
          <Link href="/settings?tab=billing" style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', fontWeight: 500, padding: 'var(--space-2)' }}>
            Ver detalles de mi suscripción
          </Link>
        </div>
      </div>

      <style>{`
        .success-icon-container {
          width: 80px; height: 80px;
          margin: 0 auto var(--space-6);
          border-radius: 50%;
          background: var(--color-secondary-light);
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .success-icon-container::after {
          content: ''; position: absolute; inset: -10px;
          border-radius: 50%; border: 2px solid var(--color-secondary);
          opacity: 0.3; animation: pulse 2s infinite;
        }
        .success-icon {
          font-size: 2.5rem; color: var(--color-secondary);
          font-weight: 800; animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
        @keyframes scaleIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
      `}</style>
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
