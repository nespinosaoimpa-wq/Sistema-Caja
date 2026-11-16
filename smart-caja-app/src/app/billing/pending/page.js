'use client'

import { useRouter } from 'next/navigation'
import { Clock, RefreshCw, ArrowRight } from 'lucide-react'

export default function PendingPage() {
  const router = useRouter()

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
        background: 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.12) 0%, transparent 65%)'
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
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F59E0B'
        }}>
          <Clock size={36} strokeWidth={2} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.75rem',
          marginBottom: 'var(--space-2)',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          Pago en Proceso
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Mercado Pago está procesando tu suscripción. Tu cuenta se activará automáticamente ni bien se confirme la acreditación.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => router.push('/dashboard')}
          >
            Ir al Dashboard <ArrowRight size={16} />
          </button>
          
          <button 
            className="btn btn-ghost" 
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={15} /> Verificar estado actual
          </button>
        </div>
      </div>
    </div>
  )
}
