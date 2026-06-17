'use client'

import { useEffect, useState } from 'react'

export default function GlobalError({ error, reset }) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    console.error('Captured by global error boundary:', error)

    // Detectar si el error es de tipo ChunkLoadError (ocurre al subir una nueva versión a Vercel)
    const errorMsg = error?.message || ''
    const errorStack = error?.stack || ''
    const isChunkError = 
      errorMsg.toLowerCase().includes('failed to load chunk') ||
      errorMsg.toLowerCase().includes('chunk') ||
      errorMsg.toLowerCase().includes('loading chunk') ||
      errorStack.toLowerCase().includes('chunkloaderror')

    if (isChunkError) {
      console.warn('ChunkLoadError detected! Attempting automatic recovery...')
      const lastReloadTime = sessionStorage.getItem('last-chunk-error-reload')
      const now = Date.now()

      // Para prevenir bucles infinitos de recarga, solo recargamos si pasaron más de 10 segundos
      if (!lastReloadTime || (now - parseInt(lastReloadTime, 10) > 10000)) {
        sessionStorage.setItem('last-chunk-error-reload', now.toString())
        window.location.reload()
      }
    }
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060e20',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: '#0b1326',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '2rem'
        }}>
          ⚠️
        </div>

        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          marginBottom: '10px',
          color: '#fff'
        }}>
          Ocurrió un error inesperado
        </h1>

        <p style={{
          color: '#94a3b8',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          marginBottom: '24px'
        }}>
          La aplicación experimentó un problema al renderizar esta página. Podés intentar recargar o volver al inicio.
        </p>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'left',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: '#ef4444',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Detalle del Error:
          </div>
          <div style={{
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            color: '#e2e8f0',
            wordBreak: 'break-all'
          }}>
            {error?.message || 'Error desconocido'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Refrescar Página
          </button>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
          >
            Reintentar
          </button>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showDetails ? 'Ocultar detalles técnicos ▲' : 'Ver detalles técnicos ▼'}
          </button>

          {showDetails && (
            <pre style={{
              marginTop: '16px',
              padding: '12px',
              background: '#040814',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontFamily: 'monospace',
              textAlign: 'left',
              overflowX: 'auto',
              maxHeight: '200px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              border: '1px solid rgba(255, 255, 255, 0.02)'
            }}>
              {error?.stack || 'No hay stack trace disponible.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
