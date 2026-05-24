'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils/formatters'
import { useToast } from '@/lib/hooks/useToast'

export default function RegisterPage() {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    // Step 1 - Business info
    business_name: '',
    business_type: 'general',
    // Step 2 - Owner info
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const businessTypes = [
    { value: 'general', label: 'General / Kiosco', desc: 'Almacén, kiosco, minimarket' },
    { value: 'supermercado', label: 'Supermercado', desc: 'Cadena o comercio grande' },
    { value: 'ropa', label: 'Ropa / Indumentaria', desc: 'Tienda de ropa y calzado' },
    { value: 'lubricentro', label: 'Lubricentro', desc: 'Productos para vehículos' },
    { value: 'farmacia', label: 'Farmacia', desc: 'Medicamentos y salud' },
    { value: 'ferreteria', label: 'Ferretería', desc: 'Herramientas y materiales' },
    { value: 'otro', label: 'Otro', desc: 'Cualquier otro rubro' },
  ]

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validateStep1 = () => {
    const errs = {}
    if (!form.business_name.trim()) errs.business_name = 'Ingresá el nombre del negocio'
    if (!form.business_type) errs.business_type = 'Seleccioná el rubro'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Ingresá tu nombre'
    if (!form.email.includes('@')) errs.email = 'Email inválido'
    if (!form.phone.trim()) {
      errs.phone = 'Ingresá tu WhatsApp o Celular'
    } else if (!/^[0-9+\s-()]{7,25}$/.test(form.phone.trim())) {
      errs.phone = 'Número no válido. Ej: +54 9 11 1234-5678'
    }
    if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleRegister = async () => {
    if (!validateStep2()) return
    setLoading(true)

    const supabase = createClient()

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name }
        }
      })

      if (authError) {
        if (authError.status === 429) {
          throw new Error('Demasiados intentos. Por favor espera unos minutos e intenta de nuevo, o contacta a soporte.')
        }
        if (authError.message.includes('already registered')) {
          throw new Error('Este email ya está registrado. Por favor, iniciá sesión.')
        }
        throw authError
      }

      const userId = authData.user?.id
      if (!userId) throw new Error('Error al crear usuario')

      // 2. Create tenant
      const slug = generateSlug(form.business_name) + '-' + Math.random().toString(36).slice(2, 6)
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: form.business_name,
          slug,
          business_type: form.business_type,
          email: form.email,
          phone: form.phone,
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      // 3. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          tenant_id: tenantData.id,
          full_name: form.full_name,
          email: form.email,
          role: 'owner',
        })

      if (profileError) throw profileError

      // 4. Create default category
      await supabase.from('categories').insert({
        tenant_id: tenantData.id,
        name: 'General',
        icon: '📦',
        color: '#7C3AED',
      })

      toast.success('¡Cuenta creada! Bienvenido a Smart Caja')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Error al registrarse')
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
        background: 'radial-gradient(ellipse at 30% 30%, rgba(124,58,237,0.12) 0%, transparent 60%)'
      }} />

      <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="sidebar-logo-icon" style={{ width: '44px', height: '44px', fontSize: '22px' }}>🏪</div>
          <span className="sidebar-logo-text" style={{ fontSize: '1.5rem' }}>Smart Caja</span>
        </div>

        <div className="card" style={{ padding: 'var(--space-8)' }}>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3" style={{ marginBottom: 'var(--space-6)' }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: s <= step ? 'var(--gradient-primary)' : 'var(--bg-input)',
                  border: s <= step ? 'none' : '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8125rem', fontWeight: 700,
                  color: s <= step ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.3s',
                }}>
                  {s < step ? '✓' : s}
                </div>
                {s < 2 && <div style={{ width: '60px', height: '2px', background: step > s ? 'var(--color-primary)' : 'var(--border-color)', transition: 'all 0.3s', borderRadius: '2px' }} />}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
                ¿Qué tipo de negocio tenés?
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-6)' }}>
                Esto nos ayuda a personalizar Smart Caja para vos.
              </p>

              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="form-label required">Nombre del negocio</label>
                <input
                  className={`form-input ${errors.business_name ? 'error' : ''}`}
                  placeholder="Ej: Almacén La Esperanza"
                  value={form.business_name}
                  onChange={e => updateForm('business_name', e.target.value)}
                  autoFocus
                />
                {errors.business_name && <span className="form-error">{errors.business_name}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="form-label required">Rubro</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  {businessTypes.map(bt => (
                    <button
                      key={bt.value}
                      onClick={() => updateForm('business_type', bt.value)}
                      style={{
                        padding: 'var(--space-3)',
                        background: form.business_type === bt.value ? 'var(--color-primary-light)' : 'var(--bg-input)',
                        border: `1px solid ${form.business_type === bt.value ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{bt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{bt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => validateStep1() && setStep(2)}
              >
                Continuar →
              </button>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
                Creá tu cuenta
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-6)' }}>
                Para <strong style={{ color: 'var(--text-primary)' }}>{form.business_name}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label required">Tu nombre completo</label>
                  <input
                    className={`form-input ${errors.full_name ? 'error' : ''}`}
                    placeholder="Juan García"
                    value={form.full_name}
                    onChange={e => updateForm('full_name', e.target.value)}
                    autoFocus
                  />
                  {errors.full_name && <span className="form-error">{errors.full_name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label required">Email</label>
                  <input
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    type="email"
                    placeholder="juan@comercio.com"
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label required">WhatsApp / Celular (soporte y contacto)</label>
                  <input
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    type="tel"
                    placeholder="Ej: +54 9 11 1234-5678"
                    value={form.phone}
                    onChange={e => updateForm('phone', e.target.value)}
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label required">Contraseña</label>
                  <input
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                  />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label required">Confirmar contraseña</label>
                  <input
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    type="password"
                    placeholder="Repetí la contraseña"
                    value={form.confirmPassword}
                    onChange={e => updateForm('confirmPassword', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && handleRegister()}
                  />
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: '0 0 auto' }}
                  onClick={() => setStep(1)}
                >
                  ← Atrás
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Creando cuenta...
                    </span>
                  ) : 'Crear cuenta gratis 🎉'}
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
                Al registrarte aceptás nuestros términos de uso. 5 días gratis, sin tarjeta.
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          ¿Ya tenés cuenta?{' '}
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
