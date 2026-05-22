'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  useEffect(() => {
    // Register PWA service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const features = [
    { icon: '📦', title: 'Inventario Inteligente', desc: 'Escaneá con lector USB o la cámara del celular. Cargá con código de referencia propio.' },
    { icon: '💰', title: 'Caja Registradora Virtual', desc: 'Sumá productos, aplicá descuentos, cobrá en efectivo, débito, crédito o combinado.' },
    { icon: '📋', title: 'Cuotas de la Casa', desc: 'Registrá ventas a plazo informal. Seguí los pagos de cada cliente.' },
    { icon: '📊', title: 'Estadísticas en Tiempo Real', desc: 'Ventas por hora, productos más vendidos, métodos de pago y stock estancado.' },
    { icon: '🖨️', title: 'Tickets No Fiscales', desc: 'Imprimí o compartí el ticket de cada venta con todos los detalles.' },
    { icon: '📱', title: 'Funciona Sin Internet', desc: 'PWA offline-first. Seguís vendiendo aunque se corte la conexión.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Background glow effects */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 20%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 60%)'
      }} />

      {/* NAVBAR */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 var(--space-6)',
        height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div className="flex items-center gap-3">
          <div className="sidebar-logo-icon">🏪</div>
          <span className="sidebar-logo-text" style={{ fontSize: '1.25rem' }}>Smart Caja</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn btn-ghost btn-sm">Iniciar sesión</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Probar gratis</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '80px var(--space-6) 60px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="badge badge-primary" style={{ marginBottom: 'var(--space-5)', display: 'inline-flex' }}>
            🚀 ¡Nuevo! — Sistema POS en la nube
          </div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 'var(--space-6)' }}>
            La caja que se adapta<br />
            <span style={{ background: 'linear-gradient(135deg, #7C3AED, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              a tu negocio
            </span>
          </h1>
          <p style={{ fontSize: '1.1875rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto var(--space-8)' }}>
            Desde el kiosco del barrio hasta la cadena de supermercados. 
            Inventario, ventas, estadísticas y cuotas en un solo lugar.
            Funciona sin internet.
          </p>
          <div className="flex items-center justify-center gap-4" style={{ flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-xl">
              Empezar gratis — 14 días 🎉
            </Link>
            <a href="#features" className="btn btn-ghost btn-lg">Ver funciones</a>
          </div>
          <p style={{ marginTop: 'var(--space-4)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Sin tarjeta de crédito. Solo <strong style={{ color: 'var(--color-secondary)' }}>$20.000 ARS/mes</strong> después de la prueba.
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'rgba(124,58,237,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-6)', textAlign: 'center' }}>
          {[
            { value: 'Multirubro', label: 'Cualquier negocio' },
            { value: 'Offline', label: 'Funciona sin internet' },
            { value: 'Multi-empleado', label: 'Turnos por cajero' },
            { value: 'En tu cel', label: 'Scanner de cámara' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" style={{ padding: '80px var(--space-6)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-headline)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
            Todo lo que necesitás
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-12)', fontSize: '1rem' }}>
            Sin complicaciones. Sin capacitación. Empezás en minutos.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ padding: 'var(--space-6)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.0625rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '80px var(--space-6)', background: 'rgba(124,58,237,0.04)', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
            Un precio. Todo incluido.
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
            Sin planes confusos. Sin extras ocultos.
          </p>
          <div className="card" style={{ padding: 'var(--space-8)', border: '2px solid var(--color-primary)', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              background: 'var(--gradient-primary)', borderRadius: 'var(--radius-full)',
              padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'white'
            }}>
              ¡Popular!
            </div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '3.5rem', fontWeight: 800, color: 'var(--color-secondary)', lineHeight: 1 }}>
              $20.000
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>ARS / mes por comercio</div>
            <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 'var(--space-8)' }}>
              {[
                'Productos ilimitados',
                'Ventas ilimitadas',
                'Múltiples empleados / turnos',
                'Scanner por cámara y USB',
                'Cuotas informales',
                'Estadísticas avanzadas',
                'Tickets imprimibles',
                'Soporte por WhatsApp',
                'Funciona offline (PWA)',
                '14 días de prueba gratis',
              ].map(item => (
                <li key={item} style={{ padding: '6px 0', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn btn-primary btn-xl" style={{ width: '100%', justifyContent: 'center' }}>
              Empezar prueba gratuita
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: 'var(--space-8) var(--space-6)', textAlign: 'center' }}>
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="sidebar-logo-icon">🏪</div>
          <span className="sidebar-logo-text">Smart Caja</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          © 2025 Smart Caja. Hecho en Argentina 🇦🇷
        </p>
        <div className="flex items-center justify-center gap-6" style={{ marginTop: 'var(--space-4)' }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Iniciar sesión</Link>
          <Link href="/register" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Registrarse</Link>
        </div>
      </footer>
    </div>
  )
}
