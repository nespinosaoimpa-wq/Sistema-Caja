'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'

export default function ForgotPasswordPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleResetRequest = async (e) => {
    e.preventDefault()
    setError('')

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email.trim()) {
      setError('Por favor, ingresá tu correo electrónico.')
      return
    } else if (!emailRegex.test(email.trim())) {
      setError('El correo ingresado no es válido.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      // 1. Verificar si el correo está registrado en la base de datos para no enviar correos a cuentas inexistentes
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })
      
      if (checkRes.ok) {
        const { registered } = await checkRes.json()
        if (!registered) {
          throw new Error('El correo electrónico no se encuentra registrado.')
        }
      }

      // 2. Enviar el email de recuperación
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${appUrl}/reset-password`,
      })

      if (resetError) throw resetError

      setSubmitted(true)
      toast.success('¡Enlace de recuperación enviado con éxito!')
    } catch (err) {
      console.error('[Forgot Password] Error requesting reset:', err)
      setError(err.message || 'Ocurrió un error al enviar el correo de recuperación.')
      toast.error(err.message || 'Error al solicitar recuperación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
      position: 'relative',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.12) 0%, transparent 60%)'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="sidebar-logo-icon" style={{ width: '44px', height: '44px', fontSize: '22px' }}>🏪</div>
          <span className="sidebar-logo-text" style={{ fontSize: '1.5rem' }}>Smart Caja</span>
        </div>

        <div className="card" style={{ padding: 'var(--space-8)' }}>
          {!submitted ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>
                ¿Olvidaste tu contraseña? 🤔
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-6)', lineHeight: 1.5 }}>
                Ingresá tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña.
              </p>

              <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    className={`form-input ${error ? 'error' : ''}`}
                    type="email"
                    placeholder="ejemplo@comercio.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    disabled={loading}
                    autoFocus
                    required
                  />
                  {error && <span className="form-error">{error}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Enviando...
                    </span>
                  ) : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>✉️</div>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px', color: '#fff' }}>
                ¡Correo Enviado!
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Enviamos un enlace de recuperación a <strong style={{ color: '#fff' }}>{email}</strong>. Por favor, revisá tu bandeja de entrada y tu carpeta de correo no deseado (spam).
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Volver a intentar con otro email
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', color: 'var(--text-secondary)' }}>
          ¿Recordaste tu contraseña?{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Iniciá sesión
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
