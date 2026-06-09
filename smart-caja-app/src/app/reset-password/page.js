'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'

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
        // Supabase Auth automatically parses the recovery token from the URL hash
        // and establishes a session on the client. Let's check if we have a user.
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

      toast.success('¡Contraseña actualizada con éxito! Redirigiendo...')
      
      // Small delay for UX and session propagation
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
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
          <span>Validando enlace de recuperación...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
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
        background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 60%)'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="sidebar-logo-icon" style={{ width: '44px', height: '44px', fontSize: '22px' }}>🏪</div>
          <span className="sidebar-logo-text" style={{ fontSize: '1.5rem' }}>Smart Caja</span>
        </div>

        <div className="card" style={{ padding: 'var(--space-8)' }}>
          {isValidSession ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>
                Establecer nueva contraseña 🔒
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-6)', lineHeight: 1.5 }}>
                Escribí tu nueva contraseña de acceso. Asegurate de que sea segura y tenga al menos 6 caracteres.
              </p>

              <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {errors.global && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    color: 'var(--color-error)',
                    fontSize: '0.8125rem'
                  }}>
                    {errors.global}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nueva Contraseña</label>
                  <input
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setErrors(prev => ({ ...prev, password: '', global: '' }))
                    }}
                    disabled={loading}
                    autoFocus
                    required
                  />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar Contraseña</label>
                  <input
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    type="password"
                    placeholder="Repetí la contraseña"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value)
                      setErrors(prev => ({ ...prev, confirmPassword: '', global: '' }))
                    }}
                    disabled={loading}
                    required
                  />
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
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
                      Guardando...
                    </span>
                  ) : 'Actualizar contraseña'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚠️</div>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px', color: 'var(--color-error)' }}>
                Enlace Expirado o Inválido
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '24px' }}>
                El enlace de recuperación que utilizaste es inválido, ha expirado o ya fue utilizado anteriormente. Por favor, solicitá un nuevo enlace.
              </p>
              <Link href="/forgot-password" style={{ width: '100%' }}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Solicitar nuevo enlace
                </button>
              </Link>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', color: 'var(--text-secondary)' }}>
          ¿Querés volver?{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Iniciar sesión
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
