'use client'

import { useRouter } from 'next/navigation'

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
        background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 60%)'
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
        <div className="pending-icon-container">
          <div className="pending-icon">⏳</div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', marginBottom: 'var(--space-2)', color: 'white' }}>
          Pago en Proceso
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', fontSize: '1rem', lineHeight: 1.5 }}>
          Mercado Pago está procesando tu suscripción. Te notificaremos automáticamente en cuanto se acredite. Esto suele demorar unos minutos.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => router.push('/dashboard')}
          >
            Ir al Dashboard
          </button>
          
          <button 
            className="btn btn-ghost" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => window.location.reload()}
          >
            ↻ Verificar estado actual
          </button>
        </div>
      </div>

      <style>{`
        .pending-icon-container {
          width: 80px; height: 80px;
          margin: 0 auto var(--space-6);
          border-radius: 50%;
          background: var(--color-primary-light);
          display: flex; align-items: center; justify-content: center;
        }
        .pending-icon {
          font-size: 2.5rem;
          animation: pulseIcon 2s ease-in-out infinite;
        }
        @keyframes pulseIcon { 
          0% { transform: scale(0.9); opacity: 0.8; } 
          50% { transform: scale(1.1); opacity: 1; } 
          100% { transform: scale(0.9); opacity: 0.8; } 
        }
      `}</style>
    </div>
  )
}
