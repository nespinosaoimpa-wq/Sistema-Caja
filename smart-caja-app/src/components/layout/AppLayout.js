'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/pos', label: 'Caja Registradora', icon: '💰' },
  { href: '/inventory', label: 'Inventario', icon: '📦' },
  { href: '/sales', label: 'Ventas', icon: '🧾' },
  { href: '/shifts', label: 'Turnos', icon: '⏱️' },
  { href: '/installments', label: 'Cuotas', icon: '📋' },
  { href: '/analytics', label: 'Estadísticas', icon: '📈' },
  { href: '/settings', label: 'Configuración', icon: '⚙️' },
]

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { tenant, profile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 200 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✨</div>
          <div className="sidebar-logo-text">Smart Flow</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Principal</div>
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${pathname?.startsWith(item.href) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-info" onClick={() => router.push('/settings')}>
            <div className="user-avatar">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="user-name truncate">{profile?.full_name || 'Usuario'}</div>
              <div className="user-role">{profile?.role || 'Personal'}</div>
            </div>
            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleSignOut(); }} title="Cerrar sesión">
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {/* Mobile Header */}
        <div className="app-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button 
            className="btn btn-ghost btn-icon" 
            style={{ display: 'none' }} // Would be visible only on mobile via media query
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ padding: '4px 12px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              🏪 {tenant?.name || 'Cargando...'}
            </div>
          </div>
        </div>

        <div className="app-content">
          {children}
        </div>
      </main>

      <style>{`
        @media (min-width: 769px) {
          .app-header button.btn-icon { display: none !important; }
        }
        @media (max-width: 768px) {
          .app-header button.btn-icon { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
