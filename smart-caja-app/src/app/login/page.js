'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

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
        email: form.email,
        password: form.password,
      })

      if (error) throw error

      toast.success('¡Bienvenido de vuelta! 👋')
      router.push('/dashboard')
    } catch (err) {
      if (err.message === 'Invalid login credentials') {
        try {
          const checkRes = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email })
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
        toast.error(err.message)
      }
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
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 70% 50%, rgba(124,58,237,0.12) 0%, transparent 60%)'
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="sidebar-logo-icon" style={{ width: '44px', height: '44px', fontSize: '22px' }}>🏪</div>
          <span className="sidebar-logo-text" style={{ fontSize: '1.5rem' }}>Smart Caja</span>
        </div>

        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
            Bienvenido 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
            Iniciá sesión en tu Smart Caja
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className={`form-input ${errors.email ? 'error' : ''}`}
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                autoFocus
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Contraseña</label>
                <Link href="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                className={`form-input ${errors.password ? 'error' : ''}`}
                type="password"
                placeholder="Tu contraseña"
                value={form.password}
                onChange={e => updateForm('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-6)' }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Ingresando...
              </span>
            ) : 'Iniciar sesión'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', color: 'var(--text-secondary)' }}>
          ¿No tenés cuenta?{' '}
          <Link href="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Registrate gratis
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
