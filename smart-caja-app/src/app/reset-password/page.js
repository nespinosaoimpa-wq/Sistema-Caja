'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import { Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const toast = useToast()

  const [checking, setChecking] = useState(true)
  const [isValidSession, setIsValidSession] = useState(false)
  const [loading, setLoading] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})

  const supabase = createClient()

  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsValidSession(true)
        } else {
          setIsValidSession(false)
        }
      } catch (err) {
        console.error('[Reset Password] Session check error:', err)
        setIsValidSession(false)
      } finally {
        setChecking(false)
      }
    }

    verifySession()
  }, [supabase])

  const validateForm = () => {
    const errs = {}
    if (password.length < 6) {
      errs.password = 'La contraseña debe tener al menos 6 caracteres.'
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Las contraseñas ingresadas no coinciden.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success('Contraseña actualizada con éxito.')

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      console.error('[Reset Password] Update error:', err)
      toast.error(err.message || 'Error al actualizar la contraseña.')
      setErrors({ global: err.message || 'Error al actualizar.' })
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#080E1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94A3B8'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#2DD4BF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '0.875rem' }}>Validando enlace de recuperación...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
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
          {isValidSession ? (
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
                Nueva Contraseña
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5 }}>
                Ingresá tu nueva clave de acceso de al menos 6 caracteres.
              </p>

              <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {errors.global && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    color: '#F87171',
                    fontSize: '0.8125rem'
                  }}>
                    {errors.global}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Nueva Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value)
                        setErrors(prev => ({ ...prev, password: '' }))
                      }}
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 38px',
                        background: '#080E1A',
                        border: `1px solid ${errors.password ? '#F87171' : 'rgba(255, 255, 255, 0.12)'}`,
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '0.9375rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  {errors.password && (
                    <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {errors.password}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Confirmar Nueva Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="password"
                      placeholder="Repetí la contraseña"
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value)
                        setErrors(prev => ({ ...prev, confirmPassword: '' }))
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 38px',
                        background: '#080E1A',
                        border: `1px solid ${errors.confirmPassword ? '#F87171' : 'rgba(255, 255, 255, 0.12)'}`,
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '0.9375rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {errors.confirmPassword}
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
                      Actualizando...
                    </span>
                  ) : (
                    <>
                      Guardar Contraseña <ArrowRight size={16} />
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
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#F87171'
              }}>
                <AlertCircle size={32} strokeWidth={2} />
              </div>

              <h2 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.4rem',
                fontWeight: 700,
                marginBottom: '8px',
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Enlace Expirado o Inválido
              </h2>

              <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '24px' }}>
                El enlace de recuperación ya fue utilizado o ha expirado. Por favor, solicitá uno nuevo.
              </p>

              <Link
                href="/forgot-password"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#0D9488',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-headline)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Solicitar nuevo enlace
              </Link>
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
