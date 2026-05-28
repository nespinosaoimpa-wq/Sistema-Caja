'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

const CheckIcon = ({ color = 'var(--color-secondary)' }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const PLANS = [
  {
    name: 'Básico',
    price: '$20.000',
    desc: 'Para el comercio que quiere ordenarse y digitalizar su operación diaria.',
    highlight: false,
    badge: null,
    features: [
      { label: 'Punto de Venta (POS) completo', ok: true },
      { label: 'Inventario hasta 300 productos', ok: true },
      { label: 'Scanner de código de barras', ok: true },
      { label: 'Efectivo, débito, crédito, transferencia, QR', ok: true },
      { label: 'Estadísticas básicas (día / semana / mes)', ok: true },
      { label: 'Fiados y Cuentas Corrientes', ok: true },
      { label: 'Arqueo de caja por turno', ok: true, exclusive: true },
      { label: 'Conciliación cupones POSnet', ok: true, exclusive: true },
      { label: 'Soporte por WhatsApp en horario hábil', ok: true },
      { label: 'Facturación ARCA', ok: false, soon: true },
      { label: 'Roles cajero / admin', ok: false },
      { label: 'Estadísticas avanzadas y rentabilidad', ok: false },
      { label: 'Cuotas e intereses', ok: false },
      { label: 'Exportación CSV para contador', ok: false },
      { label: 'Logo propio en tickets', ok: false },
    ],
    cta: 'Empezar con Básico',
    ctaStyle: 'ghost',
  },
  {
    name: 'Profesional',
    price: '$35.000',
    desc: 'Para el comercio que toma decisiones con datos y hace crecer su rentabilidad.',
    highlight: true,
    badge: 'MÁS POPULAR',
    features: [
      { label: 'Todo lo del plan Básico', ok: true },
      { label: 'Productos ilimitados', ok: true },
      { label: 'Estadísticas avanzadas (margen %, horas pico)', ok: true },
      { label: 'Rentabilidad real por producto', ok: true, exclusive: true },
      { label: 'Cuotas e intereses configurables', ok: true, exclusive: true },
      { label: 'Cuentas Corrientes avanzadas + alertas de deuda', ok: true, exclusive: true },
      { label: 'Exportación CSV para tu contador', ok: true, exclusive: true },
      { label: 'Logo propio en tickets de venta', ok: true, exclusive: true },
      { label: 'Personalización visual (colores + logo en la app)', ok: true, exclusive: true },
      { label: 'Roles cajero / admin — hasta 5 usuarios', ok: true },
      { label: 'Soporte prioritario WhatsApp ≤ 2hs', ok: true },
      { label: 'Facturación ARCA', ok: false, soon: true },
      { label: 'Multi-sucursal', ok: false },
    ],
    cta: 'Empezar con Profesional',
    ctaStyle: 'primary',
  },
  {
    name: 'Empresa',
    price: '$60.000',
    desc: 'Para cadenas, franquicias y negocios con múltiples puntos de venta.',
    highlight: false,
    badge: null,
    features: [
      { label: 'Todo lo del plan Profesional', ok: true },
      { label: 'Multi-sucursal ilimitado', ok: true, exclusive: true },
      { label: 'Panel Casa Central consolidado', ok: true, exclusive: true },
      { label: 'Transferencia de stock entre sucursales', ok: true, exclusive: true },
      { label: 'Reportes comparativos (Sucursal A vs B)', ok: true, exclusive: true },
      { label: 'Precios diferenciados por sucursal', ok: true, exclusive: true },
      { label: 'Usuarios ilimitados con roles de zona', ok: true },
      { label: 'Importación masiva de productos (CSV/Excel)', ok: true },
      { label: 'API de integración (facturación/ERP)', ok: true },
      { label: 'Onboarding dedicado (presencial o remoto)', ok: true },
      { label: 'Soporte 24/7 canal exclusivo', ok: true },
      { label: 'Facturación ARCA', ok: false, soon: true },
    ],
    cta: 'Consultar Empresa',
    ctaStyle: 'ghost',
  }
]

export default function LandingPage() {
  // Smooth scroll helper
  const scrollToId = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
      
      {/* Navbar */}
      <nav style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '20px 48px', 
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(6, 14, 32, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, var(--color-primary), #a855f7)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#060e20' }}>⚡</div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'var(--font-headline)', color: '#fff' }}>Smart Caja</span>
        </div>
        
        <div style={{ display: 'flex', gap: '32px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
          <span onClick={() => scrollToId('rubros')} style={{ cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Rubros</span>
          <span onClick={() => scrollToId('caracteristicas')} style={{ cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Funcionalidades</span>
          <span onClick={() => scrollToId('precios')} style={{ cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Precios</span>
          <span onClick={() => scrollToId('testimonios')} style={{ cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Testimonios</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Ingresar</Link>
          <Link href="/register" className="gradient-btn" style={{ padding: '10px 20px', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none' }}>
            Probar Gratis
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '100px 24px 60px', maxWidth: '900px', margin: '0 auto' }} className="animate-fade-in">
        <div className="premium-badge">
          <span>✨</span> Más de 100 comercios confían en nosotros
        </div>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.03em', fontFamily: 'var(--font-headline)' }} className="gradient-text">
          Control absoluto de tu comercio en tiempo real
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.5 }}>
          Gestiona ventas, compras, caja registradora, cuentas corrientes y sucursales. Diseñado a la medida de los comercios argentinos.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Link href="/register" className="gradient-btn" style={{ padding: '14px 36px', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 700, textDecoration: 'none' }}>
            Comenzar ahora
          </Link>
          <button onClick={() => scrollToId('rubros')} className="btn btn-ghost" style={{ padding: '14px 28px', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 600 }}>
            Ver Soluciones
          </button>
        </div>
      </section>

      {/* Rubros Soportados Section — inspired by Megasoft */}
      <section id="rubros" style={{ maxWidth: '1100px', margin: '0 auto 100px', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--font-headline)', color: '#fff' }}>
            Un sistema adaptado a tu rubro
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
            Smart Caja se adapta a las necesidades y dinámicas específicas de cada tipo de negocio.
          </p>
        </div>

        <div className="rubros-grid">
          {[
            { title: 'Supermercados & Minimarkets', desc: 'Control de stock masivo, lectura ágil de códigos de barra y arqueo de múltiples turnos.', icon: '🛒' },
            { title: 'Kioscos y Almacenes', desc: 'Venta express al paso, recarga rápida de productos y combos promocionales configurables.', icon: '🍬' },
            { title: 'Indumentaria & Boutiques', desc: 'Gestión por talles, colores y categorías. Cuentas corrientes para clientes habituales.', icon: '👕' },
            { title: 'Lubricentros & Repuestos', desc: 'Búsqueda inteligente por código y marca, seguimiento de compras a proveedores y control de stock.', icon: '🔧' },
            { title: 'Farmacias y Perfumerías', desc: 'Administración de stock con alertas de vencimiento, trazabilidad y control de facturación.', icon: '💊' },
            { title: 'Ferreterías y Pinturerías', desc: 'Manejo de artículos fraccionados, lista de precios múltiples y control de cuentas corrientes.', icon: '🔨' },
          ].map((rubro, idx) => (
            <div key={idx} className="rubro-card">
              <div className="rubro-icon-box">{rubro.icon}</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '10px', color: '#fff' }}>{rubro.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{rubro.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mockup Dashboard */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 100px', padding: '0 24px' }} className="animate-float">
        <div style={{ 
          borderRadius: '24px', 
          border: '1px solid rgba(221, 183, 255, 0.15)',
          padding: '8px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          background: 'rgba(11, 19, 38, 0.5)',
          overflow: 'hidden'
        }}>
          <div style={{ width: '100%', height: '400px', background: 'linear-gradient(135deg, #131b2e 0%, #060e20 100%)', borderRadius: '16px', display: 'flex', flexDirection: 'column', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
            </div>
            
            {/* Mock Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', flexGrow: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '16px' }}>
                <div style={{ height: '32px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}></div>
                <div style={{ height: '32px', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderRadius: '6px' }}></div>
                <div style={{ height: '32px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}></div>
                <div style={{ height: '32px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}></div>
                <div style={{ height: '32px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ height: '80px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ width: '40px', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div style={{ width: '80px', height: '16px', backgroundColor: 'var(--color-primary)', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ height: '80px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ width: '40px', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div style={{ width: '80px', height: '16px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ height: '80px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ width: '40px', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div style={{ width: '60px', height: '16px', backgroundColor: '#fff', borderRadius: '4px' }}></div>
                  </div>
                </div>
                <div style={{ flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Panel General de Ventas y Rendimiento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="caracteristicas" style={{ maxWidth: '1100px', margin: '0 auto 100px', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--font-headline)', color: '#fff' }}>
            Módulos integrados de alto impacto
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Olvídate de las planillas. Automatiza e integra cada área de tu negocio.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {[
            { title: 'Caja Registradora / POS', desc: 'Ventas ágiles, control de turnos, apertura y cierres de caja detallados y precisos.', icon: '💰' },
            { title: 'Inventario con Barcode', desc: 'Control de stock en tiempo real. Busca por código de barras interno o de fábrica sin retrasos.', icon: '📦' },
            { title: 'Plan de Cuotas y Cta. Cte.', desc: 'Ofrece cuentas corrientes a tus clientes de confianza y gestiona planes de cobro en cuotas.', icon: '📋' },
            { title: 'Gestión de Clientes (CRM)', desc: 'Fideliza y guarda los datos de contacto, historial de compras y deudas de cada cliente.', icon: '👥' },
            { title: 'Control de Compras', desc: 'Registra los pedidos y facturas de tus proveedores, manteniendo al día tus costos y reposiciones.', icon: '🛒' },
            { title: 'Multi-sucursal Centralizado', desc: 'Administra inventarios y ventas de múltiples locales desde un panel centralizado e integrado.', icon: '🏢' },
            { title: 'Estadísticas e Informes', desc: 'Visualiza gráficos intuitivos sobre tus productos más vendidos, ganancias netas y tendencias de caja.', icon: '📈' },
            { title: 'Integración Mercado Pago', desc: 'Cobros nativos con código QR y tarjetas para agilizar la cola en la caja de cobro.', icon: '💳' },
            { title: 'Exportación Completa', desc: 'Descarga todos tus informes de ventas, stock y compras en formato Excel y PDF en un clic.', icon: '📥' },
          ].map((feat, i) => (
            <div key={i} className="feature-card">
              <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '1.25rem' }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>{feat.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" style={{ maxWidth: '1100px', margin: '0 auto 100px', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--font-headline)', color: '#fff' }}>
            Planes adaptados a tu escala
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Precios planos, transparentes y en pesos argentinos. Sin sorpresas.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'stretch' }}>
          
          {/* Básico */}
          <div className="pricing-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Básico</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>Para comercios pequeños que inician.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '24px' }}>$20.000<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mes</span></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px', fontSize: '0.875rem', color: 'var(--text-primary)', flexGrow: 1 }}>
              <div>✅ Punto de Venta (POS) completo</div>
              <div>✅ Lector de código de barras</div>
              <div>✅ Inventario básico (Hasta 500 prod.)</div>
              <div>✅ Apertura y cierre de turnos</div>
              <div>✅ Vista previa e impresión de tickets</div>
              <div>✅ Historial de ventas con filtros</div>
              <div>✅ 1 Usuario del sistema</div>
              <div style={{ color: 'var(--text-muted)' }}>❌ Módulo de clientes y deudas</div>
              <div style={{ color: 'var(--text-muted)' }}>❌ Compras y Proveedores</div>
              <div style={{ color: 'var(--text-muted)' }}>❌ Multi-sucursal</div>
            </div>
            
            <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.borderColor = '#fff'} onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}>
              Elegir Plan Básico
            </Link>
          </div>

          {/* Profesional */}
          <div className="pricing-card-pro" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary)', padding: '4px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: '#060e20' }}>
              RECOMENDADO
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Profesional</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>Control de deuda, cuotas e integraciones.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '24px' }}>$35.000<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mes</span></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px', fontSize: '0.875rem', color: 'var(--text-primary)', flexGrow: 1 }}>
              <div style={{ fontWeight: 'bold' }}>⭐ Todo lo del plan Básico</div>
              <div>✅ Inventario ilimitado de productos</div>
              <div>✅ Plan de Cuotas e Intereses</div>
              <div>✅ Gestión de Clientes (CRM y Cta Cte)</div>
              <div>✅ Estadísticas y Gráficos avanzados</div>
              <div>✅ Descuentos y Recargos en POS</div>
              <div>✅ Integración Mercado Pago</div>
              <div>✅ Multi-usuario (hasta 3 empleados)</div>
              <div>✅ Personalización visual de marca</div>
              <div style={{ color: 'var(--text-muted)' }}>❌ Compras y Proveedores</div>
              <div style={{ color: 'var(--text-muted)' }}>❌ Multi-sucursal</div>
            </div>
            
            <Link href="/register" className="gradient-btn" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '8px', color: '#fff', fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none' }}>
              Elegir Plan Profesional
            </Link>
          </div>

          {/* Empresa */}
          <div className="pricing-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Empresa</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>Gestión centralizada multi-sucursal.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '24px' }}>$60.000<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mes</span></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px', fontSize: '0.875rem', color: 'var(--text-primary)', flexGrow: 1 }}>
              <div style={{ fontWeight: 'bold' }}>⭐ Todo lo del plan Profesional</div>
              <div>✅ Gestión de Multi-sucursales centralizada</div>
              <div>✅ Control de Compras y Proveedores</div>
              <div>✅ Usuarios y Cajeros ilimitados</div>
              <div>✅ Reportes exportables (Excel/PDF)</div>
              <div>✅ Acceso API de integración externa</div>
              <div>✅ Soporte VIP Directo prioritario 24/7</div>
            </div>
            
            <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.borderColor = '#fff'} onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}>
              Elegir Plan Empresa
            </Link>
          </div>

        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonios" style={{ maxWidth: '1100px', margin: '0 auto 100px', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--font-headline)', color: '#fff' }}>
            Opiniones de dueños de negocios
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Conoce cómo Smart Caja ha transformado el día a día de otros comercios.
          </p>
        </div>

        <div className="testimonials-grid">
          {[
            { 
              quote: "Tengo un minimarket y antes usaba cuadernos y planillas Excel para el stock. Con Smart Caja escaneo el código de barra y sé exactamente qué tengo y cuánto vendí en el día. Las estadísticas son oro puro.", 
              author: "Juan Pablo Rossi", 
              role: "Dueño de Minimarket Rossi",
              initials: "JR"
            },
            { 
              quote: "La función de cuentas corrientes y cuotas nos salvó. En el barrio se trabaja mucho a crédito y ahora tenemos todo registrado de forma limpia, sin perder un centavo por anotaciones cruzadas.", 
              author: "Gabriela Funes", 
              role: "Propietaria de Boutique Estilo",
              initials: "GF"
            },
            { 
              quote: "Tenemos 3 sucursales de lubricentros en la zona. Con el plan Empresa puedo controlar las ventas y el stock de cada local en tiempo real sin tener que viajar constantemente de una sucursal a otra.", 
              author: "Marcos Vignola", 
              role: "Fundador de Vignola Lubricantes",
              initials: "MV"
            }
          ].map((t, i) => (
            <div key={i} className="testimonial-card">
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.initials}</div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff' }}>{t.author}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ 
          background: 'linear-gradient(180deg, var(--bg-card-hover) 0%, var(--bg-base) 100%)', 
          border: '1px solid rgba(221, 183, 255, 0.15)', 
          borderRadius: '24px', 
          padding: '64px 24px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em', color: '#fff', fontFamily: 'var(--font-headline)' }}>
            Digitaliza tu comercio hoy mismo
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Únete a la nueva generación de comercios argentinos. Crea tu cuenta gratis en 2 minutos.
          </p>
          <Link href="/register" className="gradient-btn" style={{ display: 'inline-block', padding: '16px 48px', color: '#fff', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 700, textDecoration: 'none' }}>
            Crear Cuenta Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '48px', display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', background: 'linear-gradient(135deg, var(--color-primary), #a855f7)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyInContent: 'center', fontWeight: 'bold', color: '#060e20', fontSize: '10px' }}>⚡</div>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: '1.125rem', fontFamily: 'var(--font-headline)' }}>Smart Caja</span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>Políticas de Privacidad</span>
            <span>Términos del Servicio</span>
            <span>Contacto</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
          <div>© 2026 Smart Caja. Todos los derechos reservados. Inspirado en la excelencia comercial.</div>
          <div>Hecho en Argentina 🇦🇷</div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola%20Smart%20Caja,%20tengo%20una%20consulta`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappFloat}
        aria-label="Soporte por WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}>
          <path d="M17.472 14.382c-.022-.079-.116-.123-.27-.2c-.155-.077-.915-.452-1.056-.502c-.142-.053-.247-.077-.35.077c-.104.154-.4.502-.49.603c-.09.1-.18.11-.336.033c-.156-.078-.659-.243-1.254-.774c-.462-.412-.775-.916-.865-1.07c-.09-.154-.01-.237.069-.314c.07-.07.156-.18.234-.27c.078-.09.104-.15.156-.25c.052-.1.026-.18-.01-.257c-.036-.077-.35-.843-.48-1.158c-.127-.31-.255-.266-.35-.271c-.09-.005-.194-.006-.297-.006c-.103 0-.27.039-.412.193c-.143.155-.545.532-.545 1.298c0 .766.558 1.5.636 1.603c.078.103 1.098 1.677 2.66 2.353c.371.16.663.256.89.328c.373.12.712.103.98.063c.3-.045.915-.373 1.043-.734c.128-.362.128-.673.09-.734zM12.016 2a9.933 9.933 0 0 0-9.924 9.932c0 1.77.462 3.5 1.341 5.025l-1.425 5.205l5.327-1.398a9.907 9.907 0 0 0 4.68 1.168h.004a9.934 9.934 0 0 0 9.924-9.933A9.94 9.94 0 0 0 12.016 2zm0 18.22h-.004a8.214 8.214 0 0 1-4.186-1.155l-.3-.179l-3.118.818l.833-3.041l-.196-.314a8.2 8.2 0 0 1-1.258-4.416a8.223 8.223 0 0 1 8.226-8.221a8.227 8.227 0 0 1 8.224 8.225a8.223 8.223 0 0 1-8.22 8.22z"/>
        </svg>
      </a>
    </div>
  )
}
