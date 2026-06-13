'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils/formatters'
import { useToast } from '@/lib/hooks/useToast'
import { getInitialCategories } from '@/lib/config/rubroConfig'

function RegisterContent() {
  const router = useRouter()
  const toast = useToast()
  const searchParams = useSearchParams()

  const inviteTenant = searchParams.get('invite_tenant')
  const inviteRole = searchParams.get('invite_role') || 'cashier'
  const inviteEmail = searchParams.get('invite_email') || ''
  const inviteName = searchParams.get('invite_name') || ''
  const refCode = searchParams.get('ref') || ''

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

  // Si está invitado, saltamos al paso 2 y precargamos datos
  useEffect(() => {
    if (inviteTenant) {
      const timer = setTimeout(() => {
        setStep(2)
        setForm(prev => ({
          ...prev,
          email: inviteEmail,
          full_name: inviteName,
        }))
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [inviteTenant, inviteEmail, inviteName])

  const businessTypes = [
    { value: 'general', label: 'General / Kiosco', desc: 'Almacén, kiosco, minimarket' },
    { value: 'supermercado', label: 'Supermercado', desc: 'Cadena o de cercanía' },
    { value: 'ropa', label: 'Ropa / Indumentaria', desc: 'Tienda de ropa, talle y color' },
    { value: 'lubricentro', label: 'Lubricentro', desc: 'Aceites sueltos, filtros' },
    { value: 'farmacia', label: 'Farmacia', desc: 'Medicamentos y perfumería' },
    { value: 'ferreteria', label: 'Ferretería', desc: 'Tornillos, herramientas' },
    { value: 'carniceria', label: 'Carnicería / Fiambrería', desc: 'Vacuno, cerdo, pollo, fiambres' },
    { value: 'verduleria', label: 'Verdulería / Frutería', desc: 'Venta al peso, frutas y verduras' },
    { value: 'panaderia', label: 'Panadería / Pastelería', desc: 'Panes, facturas, sandwiches' },
    { value: 'ecommerce', label: 'E-commerce', desc: 'Tienda online con pedidos' },
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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!form.email.trim()) {
      errs.email = 'Ingresá tu email'
    } else if (!emailRegex.test(form.email.trim())) {
      errs.email = 'Email inválido. Ej: usuario@dominio.com'
    }
    
    // Solo validar teléfono si es un registro de nuevo negocio
    if (!inviteTenant) {
      if (!form.phone.trim()) {
        errs.phone = 'Ingresá tu WhatsApp o Celular'
      } else if (!/^[0-9+\s-()]{7,25}$/.test(form.phone.trim())) {
        errs.phone = 'Número no válido. Ej: +54 9 11 1234-5678'
      }
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
      // 1. Crear usuario en Auth
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

      if (inviteTenant) {
        // --- REGISTRO DE COLABORADOR INVITADO ---
        // 2. Insertar o actualizar perfil vinculado al tenant de la invitación
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            tenant_id: inviteTenant,
            full_name: form.full_name,
            email: form.email,
            role: inviteRole,
            is_active: true
          })

        if (profileError) throw profileError

        toast.success('¡Registro completado! Te has unido al comercio.')
      } else {
        // --- REGISTRO DE NUEVO PROPIETARIO ---
        // 2. Crear tenant/negocio con UUID autogenerado en el cliente para evitar fallos de RLS/select
        const tenantId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
          ? crypto.randomUUID() 
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });

        let referredById = null
        let referrerTenantId = null

        if (refCode) {
          const { data: refTenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('referral_code', refCode.trim().toUpperCase())
            .maybeSingle()

          if (refTenant) {
            referredById = refTenant.id
            referrerTenantId = refTenant.id
          }
        }

        const slug = generateSlug(form.business_name) + '-' + Math.random().toString(36).slice(2, 6)
        const { error: tenantError } = await supabase
          .from('tenants')
          .insert({
            id: tenantId,
            name: form.business_name,
            slug,
            business_type: form.business_type,
            email: form.email,
            phone: form.phone,
            subscription_plan: 'enterprise',
            referred_by_id: referredById,
          })

        if (tenantError) throw tenantError

        // 3. Crear o actualizar perfil de dueño
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            tenant_id: tenantId,
            full_name: form.full_name,
            email: form.email,
            role: 'owner',
            is_active: true
          })

        if (profileError) throw profileError

        // Insert referral tracking log if referred
        if (referrerTenantId) {
          await supabase
            .from('referrals')
            .insert({
              referrer_tenant_id: referrerTenantId,
              referred_tenant_id: tenantId,
              status: 'registered'
            })
            .catch(err => console.error('[Register] Referral track error:', err.message))
        }

        // 4. Crear categorías iniciales correspondientes al rubro
        const initialCategories = getInitialCategories(form.business_type)
        const categoriesToInsert = initialCategories.map(cat => ({
          tenant_id: tenantId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color || '#7C3AED',
        }))

        const { error: catError } = await supabase
          .from('categories')
          .insert(categoriesToInsert)

        if (catError) {
          console.error('[Register] Error creating default category:', catError)
        }

        toast.success('¡Cuenta creada! Bienvenido a Smart Caja')
      }

      // Small delay to allow Supabase auth state and profile propagation
      // before the app layout tries to load them via onAuthStateChange
      await new Promise(resolve => setTimeout(resolve, 500))
      router.replace('/dashboard')
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
          {/* Indicador de pasos - Solo si no está invitado */}
          {!inviteTenant && (
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
          )}

          {step === 1 && !inviteTenant ? (
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
                {inviteTenant ? 'Registro de Colaborador' : 'Creá tu cuenta'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-6)' }}>
                {inviteTenant ? 'Unite al equipo de tu comercio en Smart Caja' : `Para ${form.business_name}`}
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
                    disabled={!!inviteTenant && !!inviteEmail}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                {/* Ocultar campo de teléfono si es un colaborador invitado */}
                {!inviteTenant && (
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
                )}

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
                {!inviteTenant && (
                  <button
                    className="btn btn-ghost"
                    style={{ flex: '0 0 auto' }}
                    onClick={() => setStep(1)}
                  >
                    ← Atrás
                  </button>
                )}
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Procesando...
                    </span>
                  ) : inviteTenant ? 'Unirse al Equipo 🚀' : 'Crear cuenta gratis 🎉'}
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
                {inviteTenant ? 'Al registrarte te unís al comercio respectivo.' : 'Al registrarte aceptás nuestros términos de uso. 5 días gratis, sin tarjeta.'}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        Cargando registro...
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
