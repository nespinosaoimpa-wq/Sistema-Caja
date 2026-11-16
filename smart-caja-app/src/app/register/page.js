'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Mail,
  ShieldCheck,
  HelpCircle,
  Store,
  ShoppingCart,
  Tag,
  Wrench,
  Activity,
  Layers,
  Scale,
  Leaf,
  Coffee,
  Globe,
  Lock,
  User,
  Phone
} from 'lucide-react'

function RegisterContent() {
  const router = useRouter()
  const toast = useToast()
  const searchParams = useSearchParams()

  const inviteTenant = searchParams.get('invite_tenant')
  const inviteRole = searchParams.get('invite_role') || 'cashier'
  const inviteEmail = searchParams.get('invite_email') || ''
  const inviteName = searchParams.get('invite_name') || ''
  const refCode = searchParams.get('ref') || ''
  const planParam = searchParams.get('plan') || searchParams.get('planId') || ''
  const isStoreMode = searchParams.get('mode') === 'store'

  const [step, setStep] = useState(1)
  const [verificationEmail, setVerificationEmail] = useState('')
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
      toast.success('Correo de confirmación reenviado. ¡Revisá tu bandeja!')
      setCooldown(60)
    } catch (err) {
      toast.error(err.message || 'Error al reenviar el correo')
    } finally {
      setResendLoading(false)
    }
  }

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    subscription_plan: 'professional',
    business_name: '',
    business_type: 'general',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (planParam && ['basic', 'professional', 'enterprise'].includes(planParam.toLowerCase())) {
      setForm(prev => ({ ...prev, subscription_plan: planParam.toLowerCase() }))
    }
  }, [planParam])

  useEffect(() => {
    if (isStoreMode) {
      setStep(2)
      setForm(prev => ({ ...prev, subscription_plan: 'basic' }))
    }
  }, [isStoreMode])

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
    { value: 'general', label: 'General / Kiosco', desc: 'Almacén, minimarket', icon: Store },
    { value: 'supermercado', label: 'Supermercado', desc: 'Cadena o cercanía', icon: ShoppingCart },
    { value: 'ropa', label: 'Ropa / Indumentaria', desc: 'Talle, color y moda', icon: Tag },
    { value: 'lubricentro', label: 'Lubricentro / Autos', desc: 'Aceites, repuestos', icon: Wrench },
    { value: 'farmacia', label: 'Farmacia / Perfumería', desc: 'Salud y cosmética', icon: Activity },
    { value: 'ferreteria', label: 'Ferretería / Bazar', desc: 'Materiales, herramientas', icon: Wrench },
    { value: 'carniceria', label: 'Carnicería / Fiambrería', desc: 'Cortes y balanza', icon: Scale },
    { value: 'verduleria', label: 'Verdulería / Frutería', desc: 'Venta por peso', icon: Leaf },
    { value: 'panaderia', label: 'Panadería / Confitería', desc: 'Panes y pastelería', icon: Coffee },
    { value: 'ecommerce', label: 'E-commerce', desc: 'Ventas y catálogo online', icon: Globe },
    { value: 'otro', label: 'Otro rubro', desc: 'Cualquier comercio', icon: Layers },
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

    const emailNormalized = form.email.trim().toLowerCase()
    const supabase = createClient()

    try {
      let isServerSuccess = false
      let serverErrorMsg = ''

      try {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailNormalized,
            password: form.password,
            full_name: form.full_name,
            phone: form.phone,
            business_name: form.business_name,
            business_type: form.business_type,
            subscription_plan: form.subscription_plan,
            refCode,
            inviteTenant,
            inviteRole
          })
        })

        const regData = await regRes.json().catch(() => ({}))
        if (regRes.ok && regData.success) {
          isServerSuccess = true
        } else {
          serverErrorMsg = regData.error || ''
        }
      } catch (serverFetchErr) {
        console.warn('Server registration endpoint error:', serverFetchErr)
      }

      if (isServerSuccess) {
        toast.success('Cuenta creada con éxito.')
        try {
          const { error: loginErr } = await supabase.auth.signInWithPassword({
            email: emailNormalized,
            password: form.password,
          })
          if (!loginErr) {
            router.replace('/dashboard')
            return
          }
        } catch (loginEx) {
          console.warn('Auto login after server register failed:', loginEx)
        }
        router.push(`/login?registered=1&email=${encodeURIComponent(emailNormalized)}`)
        return
      }

      if (serverErrorMsg) {
        throw new Error(serverErrorMsg)
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailNormalized,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: form.full_name }
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('Este email ya está registrado. Por favor, iniciá sesión.')
        }
        throw authError
      }

      const userId = authData.user?.id
      if (userId) {
        const onboardRes = await fetch('/api/auth/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            email: emailNormalized,
            business_name: form.business_name,
            business_type: form.business_type,
            full_name: form.full_name,
            phone: form.phone,
            refCode,
            inviteTenant,
            inviteRole,
            subscription_plan: form.subscription_plan
          })
        })

        if (!onboardRes.ok) {
          const onboardErr = await onboardRes.json().catch(() => ({}))
          console.warn('Onboard API warning:', onboardErr)
        }
      }

      if (!authData.session) {
        setVerificationEmail(emailNormalized)
        toast.success('Cuenta creada. Por favor, verificá tu correo electrónico.')
      } else {
        toast.success('Cuenta creada con éxito.')
        router.replace('/dashboard')
      }
    } catch (err) {
      let errMsg = err.message || 'Error al registrarse'
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        errMsg = 'No se pudo conectar con el servidor. Por favor, verificá tu conexión a internet.'
      }
      toast.error(errMsg)
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
      {/* Deep petrol ambient lighting */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.12) 0%, transparent 65%)'
      }} />

      <div style={{ width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1 }}>
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
          {verificationEmail ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(20, 184, 166, 0.12)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#2DD4BF'
              }}>
                <Mail size={34} strokeWidth={1.8} />
              </div>

              <h2 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: '8px',
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Confirmá tu correo
              </h2>

              <p style={{
                color: '#94A3B8',
                fontSize: '0.9375rem',
                marginBottom: '24px',
                lineHeight: 1.6
              }}>
                Enviamos un enlace de confirmación a <strong style={{ color: '#2DD4BF' }}>{verificationEmail}</strong>.<br />
                Hacé clic en el enlace para activar tu cuenta e ingresar al sistema.
              </p>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '0.85rem',
                color: '#94A3B8',
                textAlign: 'left',
                display: 'flex',
                gap: '12px'
              }}>
                <HelpCircle size={20} style={{ color: '#2DD4BF', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: '4px' }}>¿No encontrás el correo?</strong>
                  <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.5 }}>
                    <li>Revisá tu carpeta de <strong>Spam</strong> o Correo no deseado.</li>
                    <li>Verificá que la dirección ingresada no tenga errores tipográficos.</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#0D9488',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: resendLoading || cooldown > 0 ? 'not-allowed' : 'pointer',
                    opacity: resendLoading || cooldown > 0 ? 0.6 : 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)'
                  }}
                  onClick={() => handleResendConfirmation(verificationEmail)}
                  disabled={resendLoading || cooldown > 0}
                >
                  {resendLoading ? 'Reenviando...' : cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar email de confirmación'}
                </button>

                <Link
                  href="/login"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94A3B8',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Ir al inicio de sesión
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Stepper */}
              {!inviteTenant && !isStoreMode && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '28px'
                }}>
                  {[
                    { num: 1, label: 'Plan' },
                    { num: 2, label: 'Negocio' },
                    { num: 3, label: 'Cuenta' }
                  ].map((s, idx) => {
                    const isDone = step > s.num
                    const isCurrent = step === s.num
                    return (
                      <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isDone ? '#0D9488' : isCurrent ? '#0D9488' : '#0B1322',
                          border: isDone || isCurrent ? '1px solid #2DD4BF' : '1px solid rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: isDone || isCurrent ? '#FFFFFF' : '#64748B',
                          boxShadow: isCurrent ? '0 0 12px rgba(45, 212, 191, 0.3)' : 'none',
                          transition: 'all 0.3s'
                        }}>
                          {isDone ? <Check size={14} strokeWidth={3} /> : s.num}
                        </div>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCurrent ? '#FFFFFF' : isDone ? '#2DD4BF' : '#64748B',
                          letterSpacing: '0.02em'
                        }}>
                          {s.label}
                        </span>
                        {idx < 2 && (
                          <div style={{
                            width: '28px',
                            height: '1px',
                            background: step > s.num ? '#0D9488' : 'rgba(255, 255, 255, 0.1)',
                            marginLeft: '4px'
                          }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* STEP 1: Plan selection */}
              {step === 1 && !inviteTenant ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h1 style={{
                      fontFamily: 'var(--font-headline)',
                      fontSize: '1.6rem',
                      fontWeight: 700,
                      marginBottom: '6px',
                      color: '#FFFFFF',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase'
                    }}>
                      Elegí tu plan de prueba
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
                      Comenzarás con <strong style={{ color: '#2DD4BF' }}>15 días gratis</strong> completos. Sin tarjetas ni compromisos.
                    </p>
                  </div>

                  {/* Banner Catalogo Online Gratis */}
                  <div style={{
                    background: 'rgba(15, 118, 110, 0.1)',
                    border: '1px solid rgba(45, 212, 191, 0.25)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 700, color: '#FFFFFF', display: 'block' }}>¿Solo necesitás Catálogo Web con Pedidos?</span>
                      Creá tu tienda online gratis en 10 segundos sin elegir planes.
                    </div>
                    <Link
                      href="/register?mode=store"
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(45, 212, 191, 0.15)',
                        border: '1px solid rgba(45, 212, 191, 0.4)',
                        color: '#2DD4BF',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Tienda Gratis <ArrowRight size={13} />
                    </Link>
                  </div>

                  {/* Plan Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                    {[
                      {
                        value: 'professional',
                        name: 'Plan Profesional',
                        price: '$60.000',
                        badge: 'RECOMENDADO',
                        desc: 'POS rápido, control de stock por unidad y kilo, fiados y arqueos.',
                        features: [
                          'Punto de venta y caja rápida por peso/unidad con códigos de barra',
                          'Control de inventario, stock ilimitado, alertas de reposición y mermas',
                          'Arqueo de caja ciego por turno con auditoría Dueño vs Cajeros',
                          'Cuentas corrientes para fiar a clientes con límites y recordatorios',
                          'Métricas y reportes financieros con balance neto exportable',
                          'Soporte prioritario humano por WhatsApp'
                        ]
                      },
                      {
                        value: 'enterprise',
                        name: 'Plan Empresa',
                        price: '$100.000',
                        badge: 'MULTI-SUCURSAL',
                        desc: 'Para comercios en expansión, sucursales unificadas o franquicias.',
                        features: [
                          'Control centralizado de 2 o más sucursales con stock transferible',
                          'Compras a proveedores y listas de precios por sucursal',
                          'Usuarios, cajeros y roles ilimitados con permisos granulares',
                          'Reportes comparativos de rendimiento inter-sucursales',
                          'Soporte dedicado y prioritario 24/7'
                        ]
                      }
                    ].map(p => {
                      const isSelected = form.subscription_plan === p.value
                      return (
                        <div
                          key={p.value}
                          onClick={() => updateForm('subscription_plan', p.value)}
                          style={{
                            padding: '18px 20px',
                            background: isSelected ? 'rgba(15, 118, 110, 0.12)' : '#0B1322',
                            border: `2px solid ${isSelected ? '#2DD4BF' : 'rgba(255, 255, 255, 0.08)'}`,
                            borderRadius: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                            boxShadow: isSelected ? '0 0 0 1px #2DD4BF, 0 12px 24px -8px rgba(45, 212, 191, 0.2)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontFamily: 'var(--font-headline)',
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                color: isSelected ? '#FFFFFF' : '#CBD5E1',
                                letterSpacing: '0.02em',
                                textTransform: 'uppercase'
                              }}>
                                {p.name}
                              </span>
                              {p.badge && (
                                <span style={{
                                  background: isSelected ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                  border: `1px solid ${isSelected ? 'rgba(45, 212, 191, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                                  color: isSelected ? '#2DD4BF' : '#94A3B8',
                                  fontSize: '0.625rem',
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: '9999px',
                                  letterSpacing: '0.06em'
                                }}>
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <div>
                              <span style={{
                                fontFamily: 'var(--font-headline)',
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: '#FFFFFF'
                              }}>
                                {p.price}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '3px' }}>/mes</span>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '12px', lineHeight: 1.4 }}>
                            {p.desc}
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                            {p.features.map((f, fi) => (
                              <div key={fi} style={{
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: isSelected ? '#E2E8F0' : '#94A3B8'
                              }}>
                                <Check size={14} style={{ color: '#2DD4BF', flexShrink: 0 }} />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#2DD4BF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <ShieldCheck size={14} />
                            Probás este plan 15 días gratis · Sin tarjeta
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '10px',
                      background: '#0D9488',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-headline)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(13, 148, 136, 0.35)',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => setStep(2)}
                  >
                    Probar gratis por 15 días <ArrowRight size={16} />
                  </button>
                </>
              ) : step === 2 && !inviteTenant ? (
                <>
                  {/* STEP 2: Business info */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h1 style={{
                      fontFamily: 'var(--font-headline)',
                      fontSize: '1.6rem',
                      fontWeight: 700,
                      marginBottom: '6px',
                      color: '#FFFFFF',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase'
                    }}>
                      {isStoreMode ? 'Configurá tu Tienda Online' : 'Datos de tu negocio'}
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
                      {isStoreMode
                        ? 'Activá tu catálogo web para comenzar a recibir pedidos por WhatsApp.'
                        : 'Personalizaremos tu caja, comprobantes y catálogo según tu actividad.'}
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      Nombre del negocio <span style={{ color: '#F87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Kiosco Belgrano o Ferretería Central"
                      value={form.business_name}
                      onChange={e => updateForm('business_name', e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: '#080E1A',
                        border: `1px solid ${errors.business_name ? '#F87171' : 'rgba(255, 255, 255, 0.12)'}`,
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '0.9375rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                    />
                    {errors.business_name && (
                      <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        {errors.business_name}
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                      Rubro principal <span style={{ color: '#F87171' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {businessTypes.map(bt => {
                        const Icon = bt.icon
                        const isSelected = form.business_type === bt.value
                        return (
                          <button
                            key={bt.value}
                            type="button"
                            onClick={() => updateForm('business_type', bt.value)}
                            style={{
                              padding: '10px 12px',
                              background: isSelected ? 'rgba(15, 118, 110, 0.14)' : '#0B1322',
                              border: `1px solid ${isSelected ? '#2DD4BF' : 'rgba(255, 255, 255, 0.08)'}`,
                              borderRadius: '10px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: isSelected ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSelected ? '#2DD4BF' : '#94A3B8',
                              flexShrink: 0
                            }}>
                              <Icon size={15} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                                color: isSelected ? '#FFFFFF' : '#CBD5E1',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {bt.label}
                              </div>
                              <div style={{
                                fontSize: '0.7rem',
                                color: '#64748B',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {bt.desc}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {isStoreMode ? (
                      <Link
                        href="/catalogo-gratis"
                        style={{
                          padding: '12px 18px',
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          color: '#94A3B8',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ArrowLeft size={15} /> Volver
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        style={{
                          padding: '12px 18px',
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          color: '#94A3B8',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ArrowLeft size={15} /> Atrás
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '10px',
                        background: '#0D9488',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-headline)',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)'
                      }}
                      onClick={() => validateStep1() && setStep(3)}
                    >
                      Continuar <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* STEP 3: Owner info */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h1 style={{
                      fontFamily: 'var(--font-headline)',
                      fontSize: '1.6rem',
                      fontWeight: 700,
                      marginBottom: '6px',
                      color: '#FFFFFF',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase'
                    }}>
                      {inviteTenant ? 'Registro de Colaborador' : 'Creá tu cuenta de acceso'}
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
                      {inviteTenant
                        ? 'Unite al equipo de tu comercio en Smart Caja'
                        : `Administrador para ${form.business_name || 'tu negocio'}`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                        Nombre y Apellido <span style={{ color: '#F87171' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                        <input
                          type="text"
                          placeholder="Ej: Marcelo Fernández"
                          value={form.full_name}
                          onChange={e => updateForm('full_name', e.target.value)}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '12px 14px 12px 38px',
                            background: '#080E1A',
                            border: `1px solid ${errors.full_name ? '#F87171' : 'rgba(255, 255, 255, 0.12)'}`,
                            borderRadius: '10px',
                            color: '#FFFFFF',
                            fontSize: '0.9375rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                      {errors.full_name && (
                        <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          {errors.full_name}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                        Correo Electrónico <span style={{ color: '#F87171' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                        <input
                          type="email"
                          placeholder="tu@comercio.com"
                          value={form.email}
                          onChange={e => updateForm('email', e.target.value)}
                          disabled={!!inviteTenant && !!inviteEmail}
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

                    {!inviteTenant && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                          WhatsApp / Celular (contacto y soporte) <span style={{ color: '#F87171' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                          <input
                            type="tel"
                            placeholder="+54 9 11 1234-5678"
                            value={form.phone}
                            onChange={e => updateForm('phone', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '12px 14px 12px 38px',
                              background: '#080E1A',
                              border: `1px solid ${errors.phone ? '#F87171' : 'rgba(255, 255, 255, 0.12)'}`,
                              borderRadius: '10px',
                              color: '#FFFFFF',
                              fontSize: '0.9375rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                        {errors.phone && (
                          <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                            {errors.phone}
                          </span>
                        )}
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                        Contraseña <span style={{ color: '#F87171' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                        <input
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={form.password}
                          onChange={e => updateForm('password', e.target.value)}
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
                        Confirmar Contraseña <span style={{ color: '#F87171' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                        <input
                          type="password"
                          placeholder="Repetí la contraseña"
                          value={form.confirmPassword}
                          onChange={e => updateForm('confirmPassword', e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !loading && handleRegister()}
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
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
                    {!inviteTenant && (
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        style={{
                          padding: '12px 18px',
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          color: '#94A3B8',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ArrowLeft size={15} /> Atrás
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '10px',
                        background: '#0D9488',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-headline)',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)'
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
                          Creando cuenta...
                        </span>
                      ) : inviteTenant ? (
                        'Unirse al Comercio'
                      ) : (
                        'Comenzar 15 Días Gratis'
                      )}
                    </button>
                  </div>

                  <p style={{
                    fontSize: '0.75rem',
                    color: '#64748B',
                    textAlign: 'center',
                    marginTop: '16px',
                    lineHeight: 1.4
                  }}>
                    {inviteTenant
                      ? 'Al registrarte te unís como colaborador del comercio invitado.'
                      : isStoreMode
                      ? 'Al registrarte aceptás nuestros términos de uso. Tienda virtual 100% gratis sin costos ocultos.'
                      : 'Al registrarte aceptás nuestros términos de uso. 15 días de prueba completa gratis, sin tarjeta.'}
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {/* Bottom Link */}
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#94A3B8', fontSize: '0.875rem' }}>
          ¿Ya tenés una cuenta?{' '}
          <Link href="/login" style={{ color: '#2DD4BF', fontWeight: 600, textDecoration: 'none' }}>
            Iniciá sesión aquí
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
        background: '#080E1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94A3B8'
      }}>
        Cargando registro...
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
