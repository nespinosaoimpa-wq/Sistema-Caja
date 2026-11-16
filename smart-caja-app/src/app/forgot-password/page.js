'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

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
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      if (checkRes.ok) {
        const { registered } = await checkRes.json()
        if (!registered) {
          throw new Error('El correo electrónico no se encuentra registrado.')
        }
      }

      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${appUrl}/reset-password`,
      })

      if (resetError) throw resetError

      setSubmitted(true)
      toast.success('Enlace de recuperación enviado.')
    } catch (err) {
      console.error('[Forgot Password] Error requesting reset:', err)
      let msg = err.message || 'Ocurrió un error al enviar el correo de recuperación.'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = 'No se pudo conectar con el servidor. Por favor, verificá tu conexión a internet.'
      }
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080E1A',
      color: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      fontFamily: 'var(--font-body)'
    }}>
      {/* Petrol ambient lighting */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.12) 0%, transparent 65%)'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Executive Logo Mark */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0F766E, #0284C7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(15, 118, 110, 0.35)',
            color: '#FFFFFF',
            fontWeight: 900,
            fontFamily: 'var(--font-headline)',
            fontSize: '1.125rem',
            letterSpacing: '-0.5px'
          }}>
            SC
          </div>
          <span style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.6rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#FFFFFF',
            textTransform: 'uppercase'
          }}>
            Smart <span style={{ color: '#2DD4BF' }}>Caja</span>
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: '#0E1727',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)'
        }}>
          {!submitted ? (
            <>
              <h1 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '6px',
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Recuperar Contraseña
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5 }}>
                Ingresá tu correo registrado y te enviaremos el enlace para restablecer tu clave.
              </p>

              <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Correo Electrónico
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
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
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 38px',
                        background: '#080E1A',
                        border: `1px solid ${error ? '#F87171' : 'rgba(255, 255, 255, 0.12)'}`,
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '0.9375rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  {error && (
                    <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {error}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#0D9488',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-headline)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
                    transition: 'background 0.2s',
                    marginTop: '8px'
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#FFFFFF',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      Enviando...
                    </span>
                  ) : (
                    <>
                      Enviar Enlace <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(20, 184, 166, 0.12)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#2DD4BF'
              }}>
                <CheckCircle2 size={32} strokeWidth={2} />
              </div>

              <h2 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '8px',
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Correo Enviado
              </h2>

              <p style={{ color: '#94A3B8', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Enviamos un enlace de recuperación a <strong style={{ color: '#2DD4BF' }}>{email}</strong>. Por favor, revisá tu bandeja de entrada o spam.
              </p>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#CBD5E1',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Volver a intentar con otro correo
              </button>
            </div>
          )}
        </div>

        {/* Bottom Link */}
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#94A3B8', fontSize: '0.875rem' }}>
          <Link
            href="/login"
            style={{
              color: '#2DD4BF',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={14} /> Volver a iniciar sesión
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
