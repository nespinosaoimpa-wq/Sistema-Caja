'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Users,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minPlan: 'basic' },
  { href: '/pos', label: 'Caja', icon: ShoppingCart, minPlan: 'basic' },
  { href: '/inventory', label: 'Inventario', icon: Package, minPlan: 'basic' },
  { href: '/shifts', label: 'Turnos', icon: Clock, minPlan: 'basic' },
  { href: '/sales', label: 'Ventas', icon: Receipt, minPlan: 'basic' },
  { href: '/customers', label: 'Clientes', icon: Users, minPlan: 'professional' },
  { href: '/analytics', label: 'Estadísticas', icon: TrendingUp, minPlan: 'professional' },
  { href: '/installments', label: 'Cuotas', icon: CreditCard, minPlan: 'professional' },
  { href: '/purchases', label: 'Compras', icon: ShoppingBag, minPlan: 'enterprise' },
]

const PLAN_WEIGHTS = {
  'basic': 1,
  'professional': 2,
  'enterprise': 3
}

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, tenant, profile, loading, profileLoaded, profileError, signOut, reloadProfile } = useAuth()

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  // Redirigir automáticamente si la suscripción está vencida o suspendida
  useEffect(() => {
    if (loading || !user || !profileLoaded || !tenant) return

    const subscriptionStatus = tenant.subscription_status || 'trial'
    const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null
    const now = new Date()
    
    const isTrialExpired = subscriptionStatus === 'trial' && trialEndsAt && now > trialEndsAt
    const isSuspended = subscriptionStatus === 'suspended' || subscriptionStatus === 'cancelled' || isTrialExpired

    if (isSuspended && pathname !== '/settings') {
      router.replace('/settings?tab=billing')
    }
  }, [loading, user, profileLoaded, tenant, pathname, router])

  const [setupForm, setSetupForm] = useState({ business_name: '', business_type: 'general' })
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState(null)
  const [verifyTimeout, setVerifyTimeout] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  const [logoError, setLogoError] = useState(false)
  const retryCountRef = useRef(0)

  // Reset logo error status if the logo url changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoError(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [tenant?.logo_url])

  // Safety net: if initial auth loading stays true for more than 8 seconds, show timeout options
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      if (loading) {
        console.warn('[AppLayout] Initial authentication loading timed out after 20s')
        setLoadingTimeout(true)
      }
    }, 20000)

    return () => clearTimeout(timer)
  }, [loading])

  // Safety net: if profileLoaded stays false too long after loading, force retry or show error
  useEffect(() => {
    if (loading || !user || profileLoaded || profileError) return

    const timer = setTimeout(async () => {
      if (!profileLoaded && !profileError && retryCountRef.current < 2) {
        retryCountRef.current += 1
        console.warn(`[AppLayout] profileLoaded still false — auto-retry #${retryCountRef.current}`)
        try {
          await reloadProfile()
        } catch(e) {
          console.error('[AppLayout] reloadProfile retry failed:', e)
        }
      } else if (!profileLoaded) {
        console.warn('[AppLayout] profileLoaded still false after retries — showing timeout error')
        setVerifyTimeout(true)
      }
    }, 12000)

    return () => clearTimeout(timer)
  }, [loading, user, profileLoaded, profileError, reloadProfile])

  // Auto-recover when returning to the tab (visibility change to visible)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[AppLayout] Tab became active — checking connection state')
        
        // Reset local timeout states
        setLoadingTimeout(false)
        setVerifyTimeout(false)
        
        // If there was an error or it hasn't loaded yet, trigger reload
        if (profileError || (!loading && user && !profileLoaded)) {
          console.log('[AppLayout] Auto-recovering from slow/failed state on visibility change')
          try {
            await reloadProfile()
          } catch (e) {
            console.error('[AppLayout] Auto-recovery reload failed:', e)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loading, user, profileLoaded, profileError, reloadProfile])


  if (loading) {
    if (loadingTimeout) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg-base)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: 'var(--space-8)', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem' }}>⏱️</span>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginTop: '12px', color: '#fff' }}>
              Inicio lento detectado
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px', marginBottom: '24px', lineHeight: 1.6 }}>
              La aplicación está demorando en conectar con el servidor. Esto puede deberse a una red inestable o un retraso temporal en la base de datos.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => signOut()}>
                Cerrar Sesión
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                setLoadingTimeout(false)
                window.location.reload()
              }}>
                Recargar Página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Cargando Smart Caja...
        </span>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

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
      let profileSaveError;
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
        profileSaveError = error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({
            tenant_id: tenantData.id,
          })
          .eq('id', user.id)
        profileSaveError = error;
      }

      if (profileSaveError) {
        console.error('Error en Paso 2 (Profile):', profileSaveError)
        throw new Error(`Error al crear perfil: ${profileSaveError.message}`)
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

  // If loading finished but profile failed to load due to connection/database error
  if (!loading && user && !profileLoaded && profileError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', padding: 'var(--space-8)', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🔌</span>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginTop: '12px', color: '#fff' }}>
            Error de Conexión
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px', marginBottom: '24px', lineHeight: 1.5 }}>
            No pudimos conectar con el servidor para verificar tu cuenta. Esto puede deberse a una conexión de red inestable o un mantenimiento temporal de la base de datos.
          </p>
          <div style={{ 
            background: 'rgba(255, 180, 171, 0.05)', 
            border: '1px solid rgba(255, 180, 171, 0.1)', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px', 
            fontSize: '0.75rem', 
            color: 'var(--color-error)', 
            fontFamily: 'monospace', 
            marginBottom: '24px', 
            textAlign: 'left', 
            wordBreak: 'break-all' 
          }}>
            {profileError}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => signOut()}>
              Cerrar Sesión
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { reloadProfile(); window.location.reload(); }}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If loading finished but verification check hasn't completed yet
  // Show spinner, but with a hard timeout fallback
  if (!loading && user && !profileLoaded && !profileError) {
    // Show timeout error if retries exhausted
    if (verifyTimeout) {
      return (
        <div style={{
          minHeight: '100vh', background: 'var(--bg-base)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: 'var(--space-8)', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem' }}>⏱️</span>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, marginTop: '12px', color: '#fff' }}>
              Verificación lenta
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px', marginBottom: '24px', lineHeight: 1.6 }}>
              No pudimos verificar tu cuenta. Puede ser un problema de conexión o un momento de alta demanda. Intentá de nuevo.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => signOut()}>Cerrar Sesión</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                setVerifyTimeout(false)
                retryCountRef.current = 0
                reloadProfile()
              }}>Reintentar</button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-base)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px'
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Verificando cuenta...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Self-heal check: if logged in but no profile/tenant exists (and check finished successfully)
  if (!loading && user && profileLoaded && (!profile || !tenant)) {
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
                <option value="general">General / Kiosco</option>
                <option value="supermercado">Supermercado</option>
                <option value="ropa">Ropa / Indumentaria</option>
                <option value="lubricentro">Lubricentro</option>
                <option value="farmacia">Farmacia</option>
                <option value="ferreteria">Ferretería</option>
                <option value="otro">Otro</option>
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

  // Quick-access bottom tab items for mobile
  const BOTTOM_TABS = [
    { href: '/pos', label: 'Caja', icon: '🛒' },
    { href: '/inventory', label: 'Inventario', icon: '📦' },
    { href: '/sales', label: 'Ventas', icon: '🧾' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ]

  return (
    <div className="app-layout">
      {/* ===== MOBILE HEADER ===== */}
      <div className="mobile-header">
        <button
          className={`hamburger-btn ${drawerOpen ? 'open' : ''}`}
          onClick={() => setDrawerOpen(d => !d)}
          aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span /><span /><span />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tenant?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.8rem' }}>
              {tenant?.name ? tenant.name.substring(0,2).toUpperCase() : 'SC'}
            </div>
          )}
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
            {tenant?.name || 'Smart Caja'}
          </span>
        </div>
        <div style={{ width: '40px' }} />{/* spacer for centering */}
      </div>

      {/* ===== SIDEBAR BACKDROP (mobile) ===== */}
      {drawerOpen && (
        <div className="sidebar-backdrop" onClick={closeDrawer} />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`app-sidebar ${drawerOpen ? 'drawer-open' : ''}`}>
        <div className="sidebar-logo">
          {tenant?.logo_url && !logoError ? (
            <img 
              src={tenant.logo_url} 
              alt="Logo" 
              onError={() => setLogoError(true)}
              style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
            />
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#fff',
              fontSize: '1rem'
            }}>
              {tenant?.name ? tenant.name.substring(0, 2).toUpperCase() : 'SC'}
            </div>
          )}
          <div className="sidebar-logo-text" style={{ textTransform: 'capitalize' }}>
            {tenant?.name || 'Smart Caja'}
          </div>
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
                <span className="icon" style={{ opacity: isActive ? 1 : 0.7, width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <a 
            href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola%20Smart%20Caja!%20Necesito%20asistencia%20en%20mi%20cuenta%20de%20negocio%20${encodeURIComponent(tenant?.name || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-nav-item"
            style={{ width: '100%', textAlign: 'left', marginTop: '8px', color: '#25D366' }}
          >
             <span className="icon" style={{ opacity: 0.8, width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <MessageSquare size={18} />
             </span>
             Soporte WhatsApp
          </a>
          <button onClick={() => { signOut(); router.push('/login'); }} className="sidebar-nav-item" style={{ width: '100%', textAlign: 'left', marginTop: '8px' }}>
             <span className="icon" style={{ opacity: 0.6, width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <LogOut size={18} />
             </span>
            Salir
          </button>
        </div>
      </aside>

      {/* ===== BOTTOM TAB BAR (mobile) ===== */}
      <nav className="bottom-tab-bar">
        {BOTTOM_TABS.map(tab => {
          const isActive = pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={isSuspended ? '/settings' : tab.href}
              className={`bottom-tab-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{tab.icon}</span>
              {tab.label}
            </Link>
          )
        })}
      </nav>

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
