'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/pos', label: 'Caja', icon: '💰' },
  { href: '/inventory', label: 'Inventario', icon: '📦' },
  { href: '/analytics', label: 'Estadísticas', icon: '📈' },
  { href: '/shifts', label: 'Turnos', icon: '⏱️' },
  { href: '/installments', label: 'Cuotas', icon: '📋' },
  { href: '/sales', label: 'Ventas', icon: '🧾' },
]

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { tenant, profile, signOut } = useAuth()
  
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
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="icon" style={{ fontSize: '1.2rem', opacity: isActive ? 1 : 0.6, width: '24px', textAlign: 'center' }}>{item.icon}</span>
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
