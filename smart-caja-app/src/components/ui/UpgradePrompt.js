'use client'

export default function UpgradePrompt({ title, description, requiredPlan }) {
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
            Plan requerido: {requiredPlan === 'professional' ? 'Profesional' : 'Empresa'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Mejora tu suscripción para desbloquear esta y otras herramientas avanzadas.
          </div>
        </div>

        <button style={{
          background: 'linear-gradient(135deg, #A855F7, #9333EA)',
          color: '#fff',
          border: 'none',
          padding: '12px 24px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Mejorar Plan
        </button>
      </div>
    </div>
  )
}
