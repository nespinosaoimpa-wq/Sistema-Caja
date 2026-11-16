'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

const CheckIcon = ({ color = '#10B981' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const PLANS = [
  {
    name: 'Profesional',
    price: '$60.000',
    desc: 'Todo lo que necesita tu comercio para operar rápido, controlar stock y auditar turnos sin pérdidas.',
    highlight: true,
    badge: 'MÁS ELEGIDO',
    features: [
      { label: 'Punto de Venta (POS) rápido y venta por peso / kilo / unidad', ok: true },
      { label: 'Productos ilimitados (códigos de barra y PLU internos)', ok: true },
      { label: 'Efectivo, débito, crédito, transferencias y cobros QR', ok: true },
      { label: 'Arqueo de caja por turno y control Dueño vs Cajero', ok: true, exclusive: true },
      { label: 'Control de Gastos y Desperdicios / Mermas', ok: true, exclusive: true },
      { label: 'Cuentas Corrientes y Fiados con alertas de deuda', ok: true, exclusive: true },
      { label: 'Estadísticas avanzadas (Día, Semana, Mes y margen %)', ok: true, exclusive: true },
      { label: 'Rentabilidad real por producto con costo de compra', ok: true, exclusive: true },
      { label: 'Cuotas e intereses bancarios configurables', ok: true, exclusive: true },
      { label: 'Roles de cajero y administrador (hasta 5 usuarios)', ok: true },
      { label: 'Logo propio en tickets y personalización visual', ok: true, exclusive: true },
      { label: 'Exportación de reportes para contador (Excel / CSV)', ok: true },
      { label: 'Catálogo Online y pedidos por WhatsApp (¡100% GRATIS!)', ok: true },
      { label: 'Soporte prioritario humano por WhatsApp ≤ 2hs', ok: true },
      { label: 'Facturación oficial ARCA', ok: false, soon: true },
      { label: 'Multi-sucursal centralizado', ok: false },
    ],
    cta: 'Empezar con Profesional (15 días gratis)',
    ctaStyle: 'primary',
  },
  {
    name: 'Empresa',
    price: '$100.000',
    desc: 'Para cadenas, franquicias y comercios con múltiples sucursales o puntos de venta.',
    highlight: false,
    badge: 'MULTI-SUCURSAL',
    features: [
      { label: 'Todo lo incluido en el Plan Profesional', ok: true },
      { label: 'Multi-sucursal ilimitado', ok: true, exclusive: true },
      { label: 'Panel Casa Central consolidado', ok: true, exclusive: true },
      { label: 'Transferencia de stock entre locales y depósitos', ok: true, exclusive: true },
      { label: 'Reportes comparativos de rendimiento (Sucursal A vs B)', ok: true, exclusive: true },
      { label: 'Precios diferenciados por sucursal', ok: true, exclusive: true },
      { label: 'Módulo de Compras y Órdenes a Proveedores', ok: true, exclusive: true },
      { label: 'Usuarios y roles de cajero/supervisor ilimitados', ok: true },
      { label: 'Importación masiva de productos (CSV/Excel)', ok: true },
      { label: 'API de integración para sistemas contables/ERP', ok: true },
      { label: 'Onboarding y puesta en marcha personalizada', ok: true },
      { label: 'Soporte prioritario 24/7 canal exclusivo', ok: true },
      { label: 'Facturación oficial ARCA', ok: false, soon: true },
    ],
    cta: 'Empezar con Empresa (15 días gratis)',
    ctaStyle: 'ghost',
  }
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isWeekend, setIsWeekend] = useState(false)

  useEffect(() => {
    const day = new Date().getDay()
    setIsWeekend(day === 0 || day === 5 || day === 6)
  }, [])

  // Savings Calculator State
  const [monthlySales, setMonthlySales] = useState(800000)
  const [estimatedLoss, setEstimatedLoss] = useState(6) // percentage

  // Lead Magnet State
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadBusiness, setLeadBusiness] = useState('general')
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadError, setLeadError] = useState(null)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  const handleLeadSubmit = async (e) => {
    e.preventDefault()
    if (!leadEmail) return

    setLeadLoading(true)
    setLeadError(null)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          business_type: leadBusiness
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar email')
      setLeadSubmitted(true)
    } catch (err) {
      setLeadError(err.message)
    } finally {
      setLeadLoading(false)
    }
  }

  const monthlySavings = (monthlySales * (estimatedLoss / 100))
  const roiMultiplier = ((monthlySavings / 60000) * 100).toFixed(0)

  return (
    <div className={styles.landingContainer}>
      <div className={styles.ambientGlowTop} />

      {/* ── Top Announcement Bar ── */}
      <div className={styles.announcementBar}>
        {isWeekend ? (
          <>
            <span className={`${styles.announcementPill} ${styles.announcementPillSuccess}`}>
              ⚡ Promo Fin de Semana
            </span>
            <span>
              Registrate hoy y obtené <strong>Migración de Stock Gratis</strong> + <strong>15 días de prueba completa</strong> sin cargo.
            </span>
            <a 
              href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola!%20Quiero%20aprovechar%20la%20promo%20del%20fin%20de%20semana%20de%20Migración%20Gratuita%20de%20Excel%20y%2015%20días%20gratis.`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.announcementLink}
            >
              Consultar por WhatsApp ➔
            </a>
          </>
        ) : (
          <>
            <span className={styles.announcementPill}>
              🎁 Catálogo Online Gratis
            </span>
            <span>
              Creá tu Tienda Online con catálogo y pedidos por WhatsApp <strong>100% GRATIS</strong> para siempre.
            </span>
            <Link href="/catalogo-gratis" className={styles.announcementLink}>
              Crear Tienda Gratis ➔
            </Link>
          </>
        )}
      </div>

      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <Link href="/" className={styles.brand}>
          <div className={styles.brandIcon}>SC</div>
          <span className={styles.brandName}>Smart Caja</span>
        </Link>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <span></span><span></span><span></span>
        </button>

        <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksActive : ''}`}>
          <a href="#como-funciona" className={styles.navLink} onClick={() => setMenuOpen(false)}>Cómo funciona</a>
          <a href="#caracteristicas" className={styles.navLink} onClick={() => setMenuOpen(false)}>Funciones</a>
          <a href="#calculadora" className={styles.navLink} onClick={() => setMenuOpen(false)}>Calculadora</a>
          <a href="#planes" className={styles.navLink} onClick={() => setMenuOpen(false)}>Planes</a>
          <a href="#testimonios" className={styles.navLink} onClick={() => setMenuOpen(false)}>Testimonios</a>
          <a href="#faq" className={styles.navLink} onClick={() => setMenuOpen(false)}>FAQ</a>
          <div className={styles.navActionsMobile}>
            <Link href="/login" className={styles.loginLink} onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
            <Link href="/register" className={styles.registerButton} onClick={() => setMenuOpen(false)}>Probar gratis (15 días) ➔</Link>
          </div>
        </div>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginLink}>Iniciar sesión</Link>
          <Link href="/register" className={styles.registerButton}>Probar gratis (15 días) ➔</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroTagBadge}>
          <span className={styles.heroTagBadgeDot}></span>
          <span>Sistema de Cobros, Caja y Stock para Comercios Minoristas</span>
        </div>

        <h1 className={styles.heroTitle}>
          Tu comercio, <span className={styles.gradientText}>bajo control total</span>
        </h1>

        <p className={styles.heroDesc}>
          Kiosco, almacén, fiambrería, ferretería o tienda de ropa. Facturá rápido, controlá tu inventario por kilo o unidad, auditá turnos de cajeros y eliminá los cuadernos de fiados en una sola plataforma profesional.
        </p>

        <div className={styles.heroActions}>
          <Link href="/register?coupon=LANZAMIENTO50" className={styles.heroButton}>
            <span>Empezar prueba gratis (15 días)</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
          <Link href="/catalogo-gratis" className={styles.heroSecondaryButton}>
            <span>🎁 Ver Tienda Online Gratis</span>
          </Link>
        </div>

        <div className={styles.heroTrustRow}>
          <div className={styles.heroTrustItem}>
            <span className={styles.heroTrustCheck}>✓</span>
            <span>15 días de prueba completa</span>
          </div>
          <div className={styles.heroTrustItem}>
            <span className={styles.heroTrustCheck}>✓</span>
            <span>Sin tarjeta de crédito</span>
          </div>
          <div className={styles.heroTrustItem}>
            <span className={styles.heroTrustCheck}>✓</span>
            <span>Migración de Excel incluida</span>
          </div>
          <div className={styles.heroTrustItem}>
            <span className={styles.heroTrustCheck}>✓</span>
            <span>Listo en 2 minutos</span>
          </div>
        </div>
      </section>

      {/* ── Dashboard Mockup Window ── */}
      <div className={styles.mockupWrapper}>
        <div className={styles.mockupWindow}>
          <div className={styles.mockupHeader}>
            <div className={styles.mockupDots}>
              <span className={styles.mockupDot} style={{ background: '#EF4444' }}></span>
              <span className={styles.mockupDot} style={{ background: '#F59E0B' }}></span>
              <span className={styles.mockupDot} style={{ background: '#10B981' }}></span>
            </div>
            <div className={styles.mockupAddressBar}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>app.smartcaja.com/pos — Punto de Venta & Caja</span>
            </div>
            <div className={styles.mockupBadge}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
              Turno Abierto · POS Activo
            </div>
          </div>
          <img src="/hero-dashboard.png" alt="Smart Caja Dashboard POS" className={styles.mockupImage} />
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className={styles.statsStrip}>
        {[
          { value: '+200', label: 'Comercios activos' },
          { value: '+50.000', label: 'Ventas procesadas' },
          { value: '+$200M', label: 'ARS gestionados' },
          { value: '< 2 min', label: 'Puesta en marcha' },
        ].map((s, i) => (
          <div key={i} className={styles.statItem}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Cómo Funciona ── */}
      <section id="como-funciona" className={styles.howSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Flujo de Trabajo</div>
          <h2>Empezás a cobrar y ordenar tu caja en 3 pasos</h2>
          <p>Sin instalaciones difíciles, sin compras obligatorias de equipos y con soporte guiado.</p>
        </div>
        <div className={styles.stepsGrid}>
          {[
            {
              num: '01',
              title: 'Creá tu cuenta gratis',
              desc: 'Te registrás en menos de 2 minutos. Sin tarjeta de crédito. Acceso total a todas las herramientas del sistema por 15 días.',
              icon: '🧑‍💼',
            },
            {
              num: '02',
              title: 'Cargá o importá tu stock',
              desc: 'Escaneá con la cámara de tu celular, usá lectores de código de barra o dejanos importar tu Excel/PDF gratis en 24 horas.',
              icon: '📦',
            },
            {
              num: '03',
              title: 'Abrí turno y cobrá',
              desc: 'Declarás el fondo inicial, registrás cada cobro (efectivo, débito, transferencias, QR o fiados) y cerrás el turno con arqueo exacto.',
              icon: '🏪',
            },
          ].map((step, i) => (
            <div key={i} className={styles.stepCard}>
              <div className={styles.stepNum}>{step.num}</div>
              <div className={styles.stepIcon}>{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Migration Support Promo Section ── */}
      <section style={{
        maxWidth: '920px',
        margin: '0 auto 80px',
        padding: '0 24px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 21, 39, 0.95) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '20px',
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: '2.25rem', marginBottom: '12px', display: 'inline-block' }}>🚚</span>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
            ¿Ya tenés tus productos en Excel u otro sistema?
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '0.95rem', maxWidth: '620px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            ¡No pierdas horas cargando todo a mano! Nuestro equipo migra tu inventario completo a <strong>Smart Caja</strong> completamente gratis y en menos de 24 horas.
          </p>
          <a 
            href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola!%20Vi%20la%20promo%20de%20migración%20gratuita%20de%20Excel%20en%20la%20web%20y%20me%20gustaría%20mudarme%20a%20Smart%20Caja.`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              background: '#10B981', 
              color: '#FFFFFF', 
              border: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.9375rem', 
              fontWeight: 700, 
              padding: '12px 26px', 
              borderRadius: '8px', 
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer'
            }}
          >
            💬 Solicitar Migración Gratuita de Inventario
          </a>
        </div>
      </section>

      {/* ── Savings Calculator Section ── */}
      <section id="calculadora" style={{
        maxWidth: '920px',
        margin: '0 auto 100px',
        padding: '0 24px',
        textAlign: 'center'
      }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Retorno de Inversión</div>
          <h2>Calculá cuánto dinero dejás de perder</h2>
          <p>Estimación basada en pérdidas habituales de comercios minoristas sin control digital (robos hormiga, mermas no registradas y fiados olvidados).</p>
        </div>

        <div style={{
          background: '#0D1527',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '36px 32px',
          textAlign: 'left',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '36px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1875rem', color: '#FFFFFF', fontWeight: 700, marginBottom: '20px' }}>Tus números actuales</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#CBD5E1', marginBottom: '8px', fontWeight: 600 }}>
                <span>Ventas Mensuales Estimadas</span>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>${monthlySales.toLocaleString('es-AR')} ARS</span>
              </div>
              <input 
                type="range" 
                min="100000" 
                max="5000000" 
                step="50000"
                value={monthlySales} 
                onChange={e => setMonthlySales(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#4F46E5', height: '6px', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                <span>$100.000</span>
                <span>$5.000.000</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#CBD5E1', marginBottom: '8px', fontWeight: 600 }}>
                <span>Pérdidas estimadas (descuadres, fiados, mermas)</span>
                <span style={{ color: '#F87171', fontWeight: 700 }}>{estimatedLoss}%</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="15" 
                step="0.5"
                value={estimatedLoss} 
                onChange={e => setEstimatedLoss(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#4F46E5', height: '6px', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                <span>2% (Mínimo habitual)</span>
                <span>15% (Sin ningún control)</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ahorro Mensual Recuperado
            </h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34D399', margin: '10px 0', fontFamily: 'var(--font-headline)' }}>
              ${monthlySavings.toLocaleString('es-AR')} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94A3B8' }}>ARS</span>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '16px' }}>
              Al digitalizar tu arqueo de turnos y stock, tapás las fugas de efectivo y sabés exactamente qué cobra cada cajero.
            </p>
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '10px 0' }} />
            <div style={{ fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700 }}>
              📈 Retorno sobre el Plan Profesional ($60.000/mes): {roiMultiplier}%
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="caracteristicas" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Módulos del Sistema</div>
          <h2>Todo lo que necesitás para gestionar tu negocio</h2>
          <p>Herramientas operativas diseñadas para el mostrador diario, sin rodeos ni complejidades innecesarias.</p>
        </div>
        <div className={styles.featuresGrid}>
          {[
            {
              title: 'Caja Registradora y POS Rápido',
              desc: 'Cobrá por código de barra o nombre en segundos. Venta por peso, kilo o unidad. Ticket físico o comprobante digital.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="14" x2="6" y2="14.01"/><line x1="10" y1="14" x2="10" y2="14.01"/>
                  <line x1="14" y1="14" x2="14" y2="14.01"/><path d="M6 21h12"/>
                </svg>
              ),
            },
            {
              title: 'Arqueo de Turno y Auditoría',
              desc: 'Declarás efectivo inicial y al cerrar el turno el sistema calcula diferencias automáticamente. Separá métricas de Dueño vs Cajeros.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              ),
              exclusive: true,
            },
            {
              title: 'Conciliación POSnet & Tarjetas',
              desc: 'Cargá los cupones de tarjetas al cierre del día y cotejalos con lo reportado por la terminal de cobro. Cero faltantes sin explicación.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              ),
              exclusive: true,
            },
            {
              title: 'Inventario con Escáner Celular',
              desc: 'Usá la cámara de tu celular como lector de barras o conectá tu escáner USB. Alertas automáticas cuando el stock esté por agotarse.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              ),
            },
            {
              title: 'Cuentas Corrientes y Fiados',
              desc: 'Eliminá los cuadernos en papel. Registrá ventas fiadas por cliente con límite de crédito, pagos parciales y balance histórico.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
            },
            {
              title: 'Estadísticas y Rentabilidad Real',
              desc: 'Conocé tu balance neto del día, tus horas pico de mayor afluencia y cuánto margen neto ganás por producto teniendo en cuenta el costo.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
              ),
            },
            {
              title: 'Cobro en Cuotas con Interés',
              desc: 'Configurá tus propios planes de cuotas e interés bancario. El cálculo final se desglosa automáticamente antes de cobrar.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              ),
            },
            {
              title: 'Control de Mermas y Desperdicios',
              desc: 'Registrá mercadería rota, vencida o consumida en el local para que tu stock real coincida siempre con el sistema.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              ),
              exclusive: true,
            },
            {
              title: 'Multi-Sucursal Centralizado',
              desc: 'Conectá dos o más locales a una misma cuenta. Transferencias de mercadería entre sucursales y reportes comparativos.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              ),
            },
          ].map((feat, i) => (
            <div key={i} className={`${styles.featureCard} ${feat.exclusive ? styles.featureCardExclusive : ''}`}>
              {feat.exclusive && <div className={styles.exclusiveBadge}>🏆 Exclusivo Smart Caja</div>}
              <div className={styles.featureIconWrapper}>{feat.icon}</div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Para Quién Es ── */}
      <section className={styles.forWhoSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Rubros Adaptados</div>
          <h2>Diseñado para comercios reales</h2>
          <p>Adaptado para resolver los desafíos operativos del mostrador argentino.</p>
        </div>
        <div className={styles.commerceGrid}>
          {[
            { icon: '🥤', name: 'Kiosco / Drugstore' },
            { icon: '🛒', name: 'Almacén / Minimarket' },
            { icon: '🍖', name: 'Fiambrería / Carnicería' },
            { icon: '👕', name: 'Indumentaria / Calzado' },
            { icon: '🔧', name: 'Ferretería / Bazar' },
            { icon: '🚗', name: 'Lubricentro / Repuestos' },
            { icon: '💊', name: 'Dietética / Perfumería' },
            { icon: '🌿', name: 'Verdulería / Frutería' },
            { icon: '🎁', name: 'Regalería / Librería' },
            { icon: '🏪', name: 'Cualquier comercio' },
          ].map((c, i) => (
            <div key={i} className={styles.commerceItem}>
              <span className={styles.commerceIcon}>{c.icon}</span>
              <span className={styles.commerceName}>{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tienda Online / E-commerce Section ── */}
      <section style={{
        padding: '80px 24px',
        background: '#090E1B',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className={styles.sectionTag}>
              E-commerce Integrado
            </div>
            <h2 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '2.25rem',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.025em',
              lineHeight: 1.2
            }}>
              ¿Seguís pagando mensualidades extra por tu Tienda Online?
            </h2>
            <p style={{
              fontSize: '1.0625rem',
              color: '#94A3B8',
              marginTop: '12px',
              maxWidth: '700px',
              margin: '12px auto 0',
              lineHeight: 1.6
            }}>
              Otras plataformas te cobran costos fijos elevados y comisiones por cada venta. En Smart Caja contás con tu catálogo web con pedidos directos a WhatsApp **100% GRATIS**.
            </p>
          </div>

          {/* Pricing Comparison Anchor Box */}
          <div style={{
            background: '#0D1527',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '40px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Costo habitual de mercado</div>
                <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#EF4444', margin: '8px 0', textDecoration: 'line-through', opacity: 0.85 }}>
                  $35.000 a $85.000 / mes
                </div>
                <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                  Cobrado por plataformas tradicionales más 2% a 5% de comisión por cada transacción cobrada.
                </p>
              </div>

              <div style={{ 
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)', 
                paddingLeft: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Con Smart Caja</div>
                <div style={{ fontSize: '2.75rem', fontWeight: 900, color: '#34D399', margin: '8px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  $0 <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#CBD5E1' }}>Gratis para siempre</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
                  Incluido en todos los planes. Sin comisiones sobre tus ventas. Cero costos de mantenimiento.
                </p>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <Link href="/register?mode=store" className={styles.heroButton} style={{
                  padding: '14px 28px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  width: '100%',
                  textAlign: 'center',
                  textDecoration: 'none'
                }}>
                  Crear Mi Catálogo Gratis
                </Link>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '8px' }}>
                  Listo en menos de 2 minutos · Sin tarjeta
                </div>
              </div>
            </div>
          </div>

          {/* Feature details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            <div style={{
              background: '#0D1527',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '10px' }}>🔌</div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Sincronización con Tiendanube</h4>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '8px', lineHeight: 1.6 }}>
                ¿Ya vendés por Tiendanube? Conectala en 1 clic: stock, precios y fotos sincronizados automáticamente con tu caja física.
              </p>
            </div>

            <div style={{
              background: '#0D1527',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '10px' }}>⏰</div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Control de Horarios y Disponibilidad</h4>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '8px', lineHeight: 1.6 }}>
                Tus clientes ven si estás abierto o cerrado en tiempo real. Decidí si ocultar o marcar productos sin stock automáticamente.
              </p>
            </div>

            <div style={{
              background: '#0D1527',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '10px' }}>💬</div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Pedidos Directos a WhatsApp</h4>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '8px', lineHeight: 1.6 }}>
                El cliente arma el carrito y te envía el pedido listo a tu WhatsApp, registrado también en tu panel de Pedidos de Smart Caja.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── Testimonios ── */}
      <section id="testimonios" className={styles.testimonialsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Experiencias Reales</div>
          <h2>Lo que dicen los comerciantes</h2>
          <p>Negocios que ordenaron su caja y dejaron atrás las pérdidas manuales.</p>
        </div>
        <div className={styles.testimonialsGrid}>
          {[
            {
              quote: "Descubrí que me faltaba mercadería por más de $30.000 al mes. Con el inventario y el arqueo de turnos de Smart Caja ese problema desapareció por completo.",
              author: "Carlos M.",
              role: "Dueño de Minimarket",
              location: "Moreno, Buenos Aires"
            },
            {
              quote: "El sistema de cuentas corrientes cambió todo. Anotaba los fiados en cuadernos que siempre se perdían. Ahora sé el saldo de cada cliente al instante y cobro a tiempo.",
              author: "Patricia L.",
              role: "Almacén La Esperanza",
              location: "La Plata, Buenos Aires"
            },
            {
              quote: "Tengo tres empleados en turnos rotativos. Con el arqueo de turno de Smart Caja, cada centavo queda auditado y sé exactamente qué cobró cada cajero.",
              author: "Martín R.",
              role: "Lubricentro San Martín",
              location: "CABA"
            }
          ].map((test, i) => (
            <div key={i} className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>
                {[...Array(5)].map((_, si) => (
                  <svg key={si} width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p className={styles.testimonialQuote}>&ldquo;{test.quote}&rdquo;</p>
              <div className={styles.testimonialAuthor}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <strong>{test.author}</strong>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', padding: '2px 7px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Verificado
                  </span>
                </div>
                <span>{test.role} · {test.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="planes" className={styles.pricingSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Planes Claros</div>
          <h2>Planes a tu medida, sin letra chica</h2>
          <p>Precios transparentes en pesos argentinos. Todas las herramientas habilitadas en tu prueba gratis de 15 días.</p>
        </div>

        <div className={styles.pricingGrid}>
          {PLANS.map((plan, pi) => (
            <div key={pi} className={plan.highlight ? styles.pricingCardPro : styles.pricingCard}>
              {plan.badge && <div className={styles.popularBadge}>{plan.badge}</div>}
              <div>
                <h3>Plan {plan.name}</h3>
                <p className={styles.planDesc}>{plan.desc}</p>
                <div className={styles.price}>{plan.price}<span className={styles.pricePeriod}>/mes</span></div>
              </div>

              <div className={styles.featuresList}>
                {plan.features.map((f, fi) => (
                  <div key={fi} className={`${styles.featureItem} ${!f.ok ? styles.featureItemDisabled : ''}`}>
                    {f.ok ? <CheckIcon /> : <XIcon />}
                    <span style={{ flex: 1 }}>{f.label}</span>
                    {f.exclusive && f.ok && (
                      <span className={styles.featureExclusivePill}>Exclusivo</span>
                    )}
                    {f.soon && (
                      <span className={styles.featureSoonPill}>Próx.</span>
                    )}
                  </div>
                ))}
              </div>

              <Link
                href="/register?coupon=LANZAMIENTO50"
                className={plan.ctaStyle === 'primary' ? styles.pricingButtonPro : styles.pricingButton}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Payment Methods and Security Logos */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          marginTop: '40px',
          opacity: 0.8,
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8' }}>Pagos seguros y automáticos mediante:</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ background: '#009EE3', color: '#fff', padding: '3px 9px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>Mercado Pago</span>
            <span style={{ background: '#FFFFFF', color: '#1A1A1A', padding: '3px 9px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>VISA</span>
            <span style={{ background: '#FFFFFF', color: '#1A1A1A', padding: '3px 9px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>Mastercard</span>
            <span style={{ background: '#FFFFFF', color: '#1A1A1A', padding: '3px 9px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>Cabal</span>
          </div>
        </div>

        <p className={styles.pricingNote}>
          🔜 <strong>Facturación ARCA</strong> (emisión oficial de facturas electrónicas A, B y C) se integrará próximamente sin costo adicional para usuarios activos.
        </p>
      </section>

      {/* ── Lead Magnet Section ── */}
      <section style={{
        maxWidth: '820px',
        margin: '0 auto 100px',
        padding: '0 24px',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#0D1527',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px 32px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.4)'
        }}>
          <span style={{ fontSize: '2.25rem', marginBottom: '12px', display: 'inline-block' }}>📖</span>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Guía Gratuita: Evitá fugas de dinero en tu negocio
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '0.9375rem', maxWidth: '560px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Descargá el PDF gratuito **"5 formas de dejar de perder plata en tu comercio"** y aprendé las claves de control de stock y auditoría de turnos.
          </p>

          {leadSubmitted ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              padding: '18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.9375rem',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              🎉 ¡Registro exitoso! Te enviamos un correo con el link de descarga directa. Revisá tu bandeja de entrada en unos minutos.
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxWidth: '500px',
              margin: '0 auto',
              textAlign: 'left'
            }}>
              {leadError && (
                <div style={{ color: '#F87171', fontSize: '0.85rem' }}>
                  ❌ {leadError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  className="form-input"
                  placeholder="Tu Nombre"
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  disabled={leadLoading}
                  required
                />
                <select
                  className="form-input"
                  value={leadBusiness}
                  onChange={e => setLeadBusiness(e.target.value)}
                  disabled={leadLoading}
                >
                  <option value="general">Kiosco / Almacén</option>
                  <option value="ropa">Indumentaria</option>
                  <option value="ferreteria">Ferretería</option>
                  <option value="otro">Otro Rubro</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Tu Email (ej: juan@gmail.com)"
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                  disabled={leadLoading}
                  required
                />
                <button
                  type="submit"
                  className={styles.registerButton}
                  disabled={leadLoading}
                  style={{ whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', padding: '0 20px' }}
                >
                  {leadLoading ? 'Enviando...' : 'Descargar PDF 🚀'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Dudas Frecuentes</div>
          <h2>Preguntas frecuentes</h2>
          <p>Todo lo que necesitás saber antes de empezar a usar Smart Caja.</p>
        </div>
        <div className={styles.faqGrid}>
          {[
            {
              q: "¿Qué tiene Smart Caja que otros sistemas no incluyen?",
              a: "Arqueo de caja auditado por turno, conciliación de cupones POSnet de tarjetas, rentabilidad neta por producto y ventas en cuotas con recargo personalizable. Funciones desarrolladas junto a comerciantes reales para resolver problemas diarios del mostrador."
            },
            {
              q: "¿Es necesario instalar algún programa en mi computadora?",
              a: "No. Smart Caja funciona 100% en la nube desde el navegador web de cualquier celular, tablet o computadora, sin descargas ni instalaciones técnicas."
            },
            {
              q: "¿Cómo funciona la prueba gratis de 15 días?",
              a: "Te registrás en menos de 2 minutos sin tarjeta de crédito y accedés de inmediato a todas las funciones de los planes Profesional y Empresa para evaluar el sistema en tu propio comercio por 15 días."
            },
            {
              q: "¿Cómo me ayudan con la carga inicial de mis productos?",
              a: "Ofrecemos asistencia gratuita por WhatsApp para importar tu catálogo desde planillas de Excel, listados de proveedores o fotos de facturas."
            },
            {
              q: "¿Puedo cobrar con Mercado Pago y códigos QR?",
              a: "Sí. Podés vincular tus cobros de Mercado Pago para generar QR y links de pago directamente desde el punto de venta."
            },
            {
              q: "¿Puedo cancelar en cualquier momento?",
              a: "Sí, sin penalidades ni permanencia mínima obligatoria. Cancelás cuando quieras desde tu panel de configuración conservando tu información."
            },
          ].map((faq, i) => (
            <div key={i} className={styles.faqCard}>
              <h4>{faq.q}</h4>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2>Transformá la gestión de tu comercio hoy</h2>
          <p>Sumate a los cientos de negocios que ya controlan sus ventas, evitan diferencias de caja y ahorran tiempo cada día.</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <Link href="/register?coupon=LANZAMIENTO50" className={styles.heroButton} style={{ padding: '16px 36px', fontSize: '1.0625rem' }}>
              Crear cuenta gratis (15 días) →
            </Link>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>
              Setup en 2 minutos · 15 días de prueba completa de todas las funciones · Sin tarjetas
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>Smart Caja</div>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>Política de Privacidad</Link>
          <Link href="/terms" className={styles.footerLink}>Términos de Servicio</Link>
          <a href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola%20Smart%20Caja,%20tengo%20una%20consulta`} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Soporte WhatsApp</a>
        </div>
        <div>© 2026 Smart Caja. Todos los derechos reservados.</div>
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
