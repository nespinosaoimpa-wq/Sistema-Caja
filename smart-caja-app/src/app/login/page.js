'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import { Mail, Lock, AlertTriangle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(c => c - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResendConfirmation = async (email) => {
    const supabase = createClient()
    setResendLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
      toast.success('Correo de confirmación reenviado. Revisá tu bandeja.')
      setCooldown(60)
    } catch (err) {
      toast.error(err.message || 'Error al reenviar el correo')
    } finally {
      setResendLoading(false)
    }
  }

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const handleLogin = async () => {
    const errs = {}
    if (!form.email.includes('@')) errs.email = 'Email inválido'
    if (!form.password) errs.password = 'Ingresá tu contraseña'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })

      if (error) throw error

      toast.success('Sesión iniciada con éxito.')
      router.push('/dashboard')
    } catch (err) {
      let msg = err.message || 'Error al iniciar sesión'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = 'No se pudo conectar con el servidor de autenticación. Verificá tu conexión a internet.'
      }

      if (msg.toLowerCase().includes('confirm') || msg === 'Email not confirmed') {
        setUnconfirmedEmail(form.email)
        toast.error('Debés confirmar tu correo electrónico antes de ingresar.')
      } else if (msg === 'Invalid login credentials') {
        try {
          const checkRes = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email.trim().toLowerCase() })
          })
          if (checkRes.ok) {
            const { registered } = await checkRes.json()
            if (!registered) {
              toast.error('El correo electrónico no se encuentra registrado.')
            } else {
              toast.error('Contraseña incorrecta. Por favor, verificá e intentá nuevamente.')
            }
          } else {
            toast.error('Email o contraseña incorrectos')
          }
        } catch {
          toast.error('Email o contraseña incorrectos')
        }
      } else {
        toast.error(msg)
      }
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
          <h1 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.6rem',
            fontWeight: 700,
            marginBottom: '6px',
            color: '#FFFFFF',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            Iniciar Sesión
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '24px' }}>
            Ingresá a tu punto de venta y administración
          </p>

          {unconfirmedEmail && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              color: '#CBD5E1',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontWeight: 700 }}>
                <AlertTriangle size={18} />
                <span>Correo no verificado</span>
              </div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Enviamos un enlace de activación a tu correo. Hacé clic en el enlace para activar tu cuenta.
              </p>
              <button
                type="button"
                style={{
                  alignSelf: 'flex-start',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#F59E0B',
                  color: '#080E1A',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: resendLoading || cooldown > 0 ? 'not-allowed' : 'pointer',
                  opacity: resendLoading || cooldown > 0 ? 0.6 : 1
                }}
                onClick={() => handleResendConfirmation(unconfirmedEmail)}
                disabled={resendLoading || cooldown > 0}
              >
                {resendLoading ? 'Reenviando...' : cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar email de confirmación'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    background: '#080E1A',
                    border: `1px solid ${errors.email ? '#F87171' : 'rgba(255, 255, 255, 0.12)'}`,
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    outline: 'none'
                  }}
                />
              </div>
              {errors.email && (
                <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  {errors.email}
                </span>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1' }}>
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: '0.78rem', color: '#2DD4BF', textDecoration: 'none', fontWeight: 600 }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="password"
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
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
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '24px',
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
              transition: 'background 0.2s'
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
                Ingresando...
              </span>
            ) : (
              <>
                Ingresar al sistema <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Bottom Link */}
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#94A3B8', fontSize: '0.875rem' }}>
          ¿No tenés una cuenta?{' '}
          <Link href="/register" style={{ color: '#2DD4BF', fontWeight: 600, textDecoration: 'none' }}>
            Registrate gratis (15 días de prueba)
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
