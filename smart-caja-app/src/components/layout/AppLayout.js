'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', minPlan: 'basic' },
  { href: '/pos', label: 'Caja', icon: '💰', minPlan: 'basic' },
  { href: '/inventory', label: 'Inventario', icon: '📦', minPlan: 'basic' },
  { href: '/shifts', label: 'Turnos', icon: '⏱️', minPlan: 'basic' },
  { href: '/sales', label: 'Ventas', icon: '🧾', minPlan: 'basic' },
  { href: '/analytics', label: 'Estadísticas', icon: '📈', minPlan: 'professional' },
  { href: '/installments', label: 'Cuotas', icon: '📋', minPlan: 'professional' },
]

const PLAN_WEIGHTS = {
  'basic': 1,
  'professional': 2,
  'enterprise': 3
}

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { tenant, profile, signOut } = useAuth()
  
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

            return (
              <Link 
                key={item.href}
                href={isSuspended ? '/settings' : item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                style={isLocked || (isSuspended && !isActive) ? { opacity: 0.6, cursor: isLocked ? 'not-allowed' : 'pointer' } : {}}
              >
                <span className="icon" style={{ fontSize: '1.2rem', opacity: isActive ? 1 : 0.6, width: '24px', textAlign: 'center' }}>
                  {isLocked ? '🔒' : item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: 'var(--space-6) 0', marginTop: 'auto' }}>
          <Link href="/settings" className={`sidebar-nav-item ${pathname === '/settings' ? 'active' : ''}`}>
             <span className="icon" style={{ fontSize: '1.2rem', opacity: 0.6, width: '24px', textAlign: 'center' }}>⚙️</span>
             Configuración
          </Link>
          <button onClick={() => { signOut(); router.push('/login'); }} className="sidebar-nav-item" style={{ width: '100%', textAlign: 'left', marginTop: '8px' }}>
             <span className="icon" style={{ fontSize: '1.2rem', opacity: 0.6, width: '24px', textAlign: 'center' }}>🚪</span>
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
