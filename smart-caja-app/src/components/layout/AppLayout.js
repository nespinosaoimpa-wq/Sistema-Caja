'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Clock, 
  Receipt, 
  BarChart3, 
  CreditCard,
  Settings,
  LogOut,
  Lock,
  ListTodo,
  Store
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minPlan: 'basic' },
  { href: '/pos', label: 'Caja', icon: ShoppingCart, minPlan: 'basic' },
  { href: '/inventory', label: 'Inventario', icon: Package, minPlan: 'basic' },
  { href: '/shifts', label: 'Turnos', icon: Clock, minPlan: 'basic' },
  { href: '/sales', label: 'Ventas', icon: Receipt, minPlan: 'basic' },
  { href: '/orders', label: 'Pedidos', icon: ListTodo, minPlan: 'professional' },
  { href: '/analytics', label: 'Estadísticas', icon: BarChart3, minPlan: 'professional' },
  { href: '/installments', label: 'Cuotas', icon: CreditCard, minPlan: 'professional' },
  { href: '/branches', label: 'Sucursales', icon: Store, minPlan: 'enterprise' },
]

const PLAN_WEIGHTS = {
  'basic': 1,
  'professional': 2,
  'enterprise': 3
}

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, tenant, profile, loading, signOut, reloadProfile } = useAuth()

  const [setupForm, setSetupForm] = useState({ business_name: '', business_type: 'general' })
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState(null)

  const handleSelfHeal = async (e) => {
    e.preventDefault()
    if (!setupForm.business_name.trim()) {
      setSetupError('Ingresá el nombre del negocio')
      return
    }
    setSetupLoading(true)
    setSetupError(null)

    const supabase = createClient()
    try {
      console.log('1. Generando slug e insertando comercio...')
      const slug = setupForm.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).slice(2, 6)
      
      // 1. Create Tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: setupForm.business_name,
          slug,
          business_type: setupForm.business_type,
          email: user.email,
        })
        .select()
        .single()

      if (tenantError) {
        console.error('Error en Paso 1 (Tenant):', tenantError)
        throw new Error(`Error al crear comercio: ${tenantError.message}`)
      }
      console.log('Paso 1 Completado. Tenant ID:', tenantData.id)

      // 2. Create or Update Profile
      console.log('2. Insertando/actualizando perfil...')
      let profileError;
      if (!profile) {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            tenant_id: tenantData.id,
            full_name: user.user_metadata?.full_name || 'Propietario',
            email: user.email,
            role: 'owner',
          })
        profileError = error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({
            tenant_id: tenantData.id,
          })
          .eq('id', user.id)
        profileError = error;
      }

      if (profileError) {
        console.error('Error en Paso 2 (Profile):', profileError)
        throw new Error(`Error al crear perfil: ${profileError.message}`)
      }
      console.log('Paso 2 Completado.')

      // 3. Create default category
      console.log('3. Creando categoría General...')
      const { error: categoryError } = await supabase
        .from('categories')
        .insert({
          tenant_id: tenantData.id,
          name: 'General',
          icon: '📦',
          color: '#7C3AED',
        })

      if (categoryError) {
        console.error('Error en Paso 3 (Category):', categoryError)
        throw new Error(`Error al crear categoría inicial: ${categoryError.message}`)
      }
      console.log('Paso 3 Completado.')

      // 4. Reload auth state
      console.log('4. Recargando perfil en la app...')
      await reloadProfile()
      console.log('Auto-recuperación finalizada con éxito.')
    } catch (err) {
      console.error('Error capturado en handleSelfHeal:', err)
      setSetupError(err.message || 'Error al crear el comercio.')
    } finally {
      setSetupLoading(false)
    }
  }

  // Self-heal check: if logged in but no profile/tenant exists
  if (!loading && user && (!profile || !tenant)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', padding: 'var(--space-8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <span style={{ fontSize: '3rem' }}>🏪</span>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginTop: '12px' }}>
              Completar Configuración del Comercio
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
              Detectamos que tu cuenta no tiene un comercio inicializado. Completá estos datos para comenzar.
            </p>
          </div>

          <form onSubmit={handleSelfHeal} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label required">Nombre del negocio</label>
              <input
                className="form-input"
                placeholder="Ej: Almacén La Esperanza"
                value={setupForm.business_name}
                onChange={e => setSetupForm(prev => ({ ...prev, business_name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Rubro</label>
              <select
                className="form-select"
                value={setupForm.business_type}
                onChange={e => setSetupForm(prev => ({ ...prev, business_type: e.target.value }))}
              >
                <option value="general">🏪 General / Kiosco</option>
                <option value="supermercado">🛒 Supermercado</option>
                <option value="ropa">👗 Ropa / Indumentaria</option>
                <option value="lubricentro">🔧 Lubricentro</option>
                <option value="farmacia">💊 Farmacia</option>
                <option value="ferreteria">🔨 Ferretería</option>
                <option value="otro">📦 Otro</option>
              </select>
            </div>

            {setupError && (
              <div style={{
                background: 'rgba(255, 180, 171, 0.1)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                color: 'var(--color-error)',
                fontSize: '0.8125rem',
                lineHeight: 1.4
              }}>
                <strong>Error:</strong> {setupError}
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Asegurate de haber ejecutado el archivo de políticas RLS en Supabase SQL Editor para permitir la creación del comercio.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => signOut()}
              >
                Cerrar Sesión
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={setupLoading}
              >
                {setupLoading ? 'Inicializando...' : 'Finalizar Configuración →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
  
  const userPlan = tenant?.subscription_plan || 'basic'
  const userPlanWeight = PLAN_WEIGHTS[userPlan]

  // Subscription validation
  const subscriptionStatus = tenant?.subscription_status || 'trial'
  const trialEndsAt = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  const now = new Date()
  
  const isTrialExpired = subscriptionStatus === 'trial' && trialEndsAt && now > trialEndsAt
  const isSuspended = subscriptionStatus === 'suspended' || subscriptionStatus === 'cancelled' || isTrialExpired
  
  // Warning banner if trial expires in less than 3 days
  const isTrialEndingSoon = subscriptionStatus === 'trial' && trialEndsAt && !isTrialExpired && 
    (trialEndsAt.getTime() - now.getTime()) < (3 * 24 * 60 * 60 * 1000)

  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0

  const isSettingsPage = pathname === '/settings'
  const showBlocker = isSuspended && !isSettingsPage

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">Smart Caja</div>
        </div>

        <nav className="sidebar-nav" style={{ marginTop: 'var(--space-4)' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            const itemPlanWeight = PLAN_WEIGHTS[item.minPlan]
            const isLocked = userPlanWeight < itemPlanWeight
            const IconComponent = item.icon

            return (
              <Link 
                key={item.href}
                href={isSuspended ? '/settings' : item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                style={isLocked || (isSuspended && !isActive) ? { opacity: 0.6, cursor: isLocked ? 'not-allowed' : 'pointer' } : {}}
              >
                <span className="icon" style={{ opacity: isActive ? 1 : 0.6, width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isLocked ? <Lock size={18} /> : <IconComponent size={18} />}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: 'var(--space-6) 0', marginTop: 'auto' }}>
          <Link href="/settings" className={`sidebar-nav-item ${pathname === '/settings' ? 'active' : ''}`}>
             <span className="icon" style={{ opacity: 0.6, width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Settings size={18} />
             </span>
             Configuración
          </Link>
          <button onClick={() => { signOut(); router.push('/login'); }} className="sidebar-nav-item" style={{ width: '100%', textAlign: 'left', marginTop: '8px' }}>
             <span className="icon" style={{ opacity: 0.6, width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <LogOut size={18} />
             </span>
            Salir
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {/* We don't render a top header bar anymore, to match the clean layout of the screenshot */}
        <div className="app-content" style={{ paddingTop: 'var(--space-10)' }}>
          {showBlocker ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: 'calc(100vh - 120px)', padding: 'var(--space-8)', textAlign: 'center'
            }}>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-xl)', padding: 'var(--space-10)', maxWidth: '550px',
                boxShadow: '0 25px 50px rgba(255,180,171,0.1)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-error)', marginBottom: '12px', fontFamily: 'var(--font-headline)' }}>
                  Acceso Restringido
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  Tu período de prueba gratis o la suscripción activa para <strong style={{ color: '#fff' }}>{tenant?.name}</strong> ha finalizado o se encuentra suspendido. 
                </p>
                <div style={{ background: 'rgba(255, 180, 171, 0.1)', border: '1px solid rgba(255, 180, 171, 0.2)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem', marginBottom: '4px' }}>¿Cómo solucionarlo?</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Para reestablecer las operaciones y habilitar la caja registradora, selecciona tu plan e integra Mercado Pago en la pestaña de Configuración.
                  </div>
                </div>
                <Link href="/settings" style={{
                  display: 'inline-block', width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, var(--color-primary-hover), var(--color-primary))', color: '#fff',
                  borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '1rem',
                  boxShadow: '0 4px 15px rgba(183, 109, 255, 0.3)', textAlign: 'center'
                }}>
                  Ir a Configuración y Activar Plan →
                </Link>
              </div>
            </div>
          ) : (
            <>
              {isTrialEndingSoon && (
                <div style={{
                  background: 'linear-gradient(90deg, #F59E0B, #D97706)', color: '#000',
                  padding: '12px 24px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)',
                  fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⏳</span>
                    <span>Tu período de prueba gratis finaliza en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}. Completa tu suscripción para continuar operando sin interrupciones.</span>
                  </div>
                  <Link href="/settings" style={{ background: '#000', color: '#fff', padding: '6px 16px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Suscribirse
                  </Link>
                </div>
              )}
              {children}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
