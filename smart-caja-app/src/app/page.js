'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, var(--color-primary), #8a2be2)', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'var(--font-headline)' }}>Smart Caja</span>
        </div>
        
        <div style={{ display: 'flex', gap: '32px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <span style={{ cursor: 'pointer' }}>Características</span>
          <span style={{ cursor: 'pointer' }}>Precios</span>
          <span style={{ cursor: 'pointer' }}>Testimonios</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Login</Link>
          <Link href="/register" style={{ padding: '8px 16px', background: 'var(--color-primary-hover)', color: '#fff', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, transition: 'var(--transition)' }}>
            Empezar ahora
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '80px 24px 40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.03em', fontFamily: 'var(--font-headline)' }}>
          Tu negocio, <span style={{ color: 'var(--color-primary)' }}>digitalizado</span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
          Kiosco, supermercado, boutique o lubricentro — un solo sistema para gestionar todo con precisión y control.
        </p>
        <Link href="/register" className="glow-primary" style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--color-primary-hover)', color: '#fff', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, transition: 'var(--transition)' }}>
          Empezar ahora
        </Link>
      </section>

      {/* Hero Image / Dashboard Mockup */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 80px', padding: '24px' }}>
        <div style={{ 
          borderRadius: '24px', 
          padding: '4px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}>
          <img 
            src="/hero-dashboard.png" 
            alt="Smart Caja Dashboard 3D Interface" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              borderRadius: '20px',
              display: 'block'
            }} 
          />
        </div>
      </div>

      {/* Features Section */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-headline)' }}>Herramientas para crecer</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Todo lo que necesitas en una sola plataforma.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { title: 'Caja registradora', desc: 'Ventas rápidas, cierres precisos y control total del flujo de caja.', icon: '💰', color: 'var(--color-primary)' },
            { title: 'Inventario con scanner', desc: 'Gestión de stock en tiempo real con integración de códigos de barras.', icon: '📦', color: 'var(--color-primary)' },
            { title: 'Estadísticas de ventas', desc: 'Métricas clave para entender el crecimiento de tu negocio.', icon: '📈', color: 'var(--color-secondary)' },
            { title: 'Plan de cuotas', desc: 'Configura intereses y planes de pago a la medida de tus clientes.', icon: '📋', color: 'var(--color-primary)' },
            { title: 'Tickets digitales', desc: 'Envía comprobantes por email o WhatsApp al instante.', icon: '🧾', color: 'var(--color-primary)' },
            { title: 'Multi-empleados', desc: 'Control de accesos y registro de ventas por usuario.', icon: '👥', color: 'var(--color-primary)' },
          ].map((feat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', transition: 'var(--transition)' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '14px' }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>{feat.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-headline)' }}>Planes a tu medida</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Transparencia y crecimiento para cada etapa.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'center' }}>
          
          {/* Basic */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>Básico</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>Para negocios que recién empiezan.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '24px' }}>$20.000<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mes</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              <div>✓ Caja registradora</div>
              <div>✓ Inventario básico</div>
              <div>✓ Ticket digital</div>
            </div>
            <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
              Elegir Básico
            </Link>
          </div>

          {/* Pro */}
          <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-focus)', borderRadius: '16px', padding: '32px', position: 'relative', boxShadow: '0 0 24px rgba(221, 183, 255, 0.15)' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary-hover)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#fff' }}>
              MÁS POPULAR
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>Profesional</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>La herramienta completa para crecer.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '24px' }}>$35.000<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mes</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              <div>✓ Todo lo de Básico</div>
              <div>✓ Estadísticas avanzadas</div>
              <div>✓ Plan de cuotas</div>
              <div>✓ Soporte prioritario</div>
            </div>
            <Link href="/register" className="glow-primary" style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'var(--color-primary-hover)', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>
              Elegir Profesional
            </Link>
          </div>

          {/* Enterprise */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>Empresa</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>Múltiples sucursales y control total.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '24px' }}>$60.000<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mes</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              <div>✓ Todo lo de Profesional</div>
              <div>✓ Multi-sucursal</div>
              <div>✓ API de integración</div>
            </div>
            <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
              Elegir Empresa
            </Link>
          </div>

        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ 
          background: 'linear-gradient(180deg, var(--bg-card-hover) 0%, var(--bg-card) 100%)', 
          border: '1px solid var(--border-highlight)', 
          borderRadius: '24px', 
          padding: '64px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em', color: '#fff', fontFamily: 'var(--font-headline)' }}>
            Transformá tu negocio hoy
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '32px' }}>
            Únete a cientos de comercios argentinos que ya controlan sus ventas y stock desde una sola plataforma.
          </p>
          <Link href="/register" className="glow-primary" style={{ display: 'inline-block', padding: '14px 40px', background: 'var(--color-primary-hover)', color: '#fff', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 600 }}>
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', fontFamily: 'var(--font-headline)' }}>Smart Caja</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Contact Support</span>
        </div>
        <div>© 2026 Smart Caja. All rights reserved.</div>
      </footer>
    </div>
  )
}
