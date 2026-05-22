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
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                style={isLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
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
          {children}
        </div>
      </main>
    </div>
  )
}
