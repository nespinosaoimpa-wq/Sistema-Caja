'use client'

import { useState, useEffect } from 'react'
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
      { label: 'Tienda Online + Pedidos WhatsApp (¡GRATIS!)', ok: true },
      { label: 'Sincronización con Tiendanube (¡GRATIS!)', ok: true },
      { label: 'Control de Gastos y Desperdicios', ok: false },
      { label: 'Gestión de Preventistas móviles', ok: false },
      { label: 'Roles cajero / admin', ok: false },
      { label: 'Estadísticas avanzadas y rentabilidad', ok: false },
      { label: 'Cuotas e intereses', ok: false },
      { label: 'Exportación CSV para contador', ok: false },
      { label: 'Logo propio en tickets', ok: false },
      { label: 'Módulo de Compras a Proveedores', ok: false },
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
      { label: 'Control de Gastos y Desperdicios', ok: true },
      { label: 'Gestión de Preventistas móviles', ok: true },
      { label: 'Exportación CSV para tu contador', ok: true, exclusive: true },
      { label: 'Logo propio en tickets de venta', ok: true, exclusive: true },
      { label: 'Personalización visual (colores + logo en la app)', ok: true, exclusive: true },
      { label: 'Roles cajero / admin — hasta 5 usuarios', ok: true },
      { label: 'Soporte prioritario WhatsApp ≤ 2hs', ok: true },
      { label: 'Facturación ARCA', ok: false, soon: true },
      { label: 'Módulo de Compras a Proveedores', ok: false },
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
      { label: 'Módulo de Compras a Proveedores', ok: true, exclusive: true },
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
  const roiMultiplier = ((monthlySavings / 20000) * 100).toFixed(0)

  return (
    <div className={styles.landingContainer}>

      {/* ── Top Promo Banner ── */}
      <div style={{
        background: isWeekend ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #7C3AED, #B76DFF)',
        color: '#fff',
        padding: '10px 24px',
        textAlign: 'center',
        fontSize: '0.85rem',
        fontWeight: 700,
        position: 'sticky',
        top: 0,
        zIndex: 1001,
        boxShadow: isWeekend ? '0 4px 12px rgba(16, 185, 129, 0.25)' : '0 4px 12px rgba(124, 58, 237, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        transition: 'all 0.3s ease'
      }}>
        {isWeekend ? (
          <>
            <span>⚡ <strong>PROMO FIN DE SEMANA:</strong> Registrate hoy y obtené <strong>Migración de Stock Gratis</strong> + <strong>15 días de prueba completa</strong> sin cargo.</span>
            <a 
              href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola!%20Quiero%20aprovechar%20la%20promo%20del%20fin%20de%20semana%20de%20Migración%20Gratuita%20de%20Excel%20y%2015%20días%20gratis.`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#fff',
                color: '#059669',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              Reclamar Promo 💬
            </a>
          </>
        ) : (
          <>
            <span>🎁 <strong>NUEVO:</strong> Creá tu Tienda Online con catálogo y pedidos por WhatsApp <strong>100% GRATIS</strong> (ahorrate $45.000+/mes).</span>
            <Link href="/catalogo-gratis" style={{
              background: '#fff',
              color: '#7C3AED',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}>
              Crear Tienda Gratis ➔
            </Link>
          </>
        )}
      </div>

      {/* ── Navbar ── */}
      <nav className={styles.navbar} style={{ top: '38px' }}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>
            SC
          </div>
          <span className={styles.brandName}>Smart Caja</span>
        </div>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <span></span><span></span><span></span>
        </button>

        <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksActive : ''}`}>
          <a href="#como-funciona" className={styles.navLink} onClick={() => setMenuOpen(false)}>Cómo funciona</a>
          <a href="#caracteristicas" className={styles.navLink} onClick={() => setMenuOpen(false)}>Características</a>
          <a href="#calculadora" className={styles.navLink} onClick={() => setMenuOpen(false)}>Calculadora</a>
          <a href="#planes" className={styles.navLink} onClick={() => setMenuOpen(false)}>Planes</a>
          <a href="#testimonios" className={styles.navLink} onClick={() => setMenuOpen(false)}>Testimonios</a>
          <div className={styles.navActionsMobile}>
            <Link href="/login" className={styles.loginLink} onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
            <Link href="/register" className={styles.registerButton} onClick={() => setMenuOpen(false)}>Empezar gratis</Link>
          </div>
        </div>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginLink}>Iniciar sesión</Link>
          <Link href="/register" className={styles.registerButton}>Empezar gratis</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero} style={{ paddingTop: '130px' }}>
        {/* NEW ISOLATED FEATURE PROMO CARD */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(78, 222, 163, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
          border: '1px solid rgba(78, 222, 163, 0.3)',
          borderRadius: '16px',
          padding: '12px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          boxShadow: '0 4px 20px rgba(78, 222, 163, 0.1)',
          maxWidth: '750px',
          margin: '0 auto 24px'
        }}>
          <span style={{ fontSize: '1.25rem' }}>🎁</span>
          <span style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 600 }}>
            <strong style={{ color: '#4edea3', textTransform: 'uppercase' }}>¡Catálogo Online Gratis!</strong> 
            {" "}Creá tu tienda digital y recibí pedidos por WhatsApp. Sin comisiones. Ahorrate los <strong>$35.000 - $85.000/mes</strong>.
          </span>
          <Link href="/catalogo-gratis" style={{
            background: '#4edea3',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.78rem',
            padding: '6px 14px',
            borderRadius: '20px',
            textDecoration: 'none',
            transition: 'transform 0.1s ease',
            display: 'inline-block'
          }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Ver catálogo gratis ➔
          </Link>
        </div>

        <div className={styles.trustBadge}>
          <span className={styles.activeDot}></span>
          Más de 200 comercios activos hoy
        </div>
        <h1 className={styles.heroTitle}>
          Tu comercio, <span className={styles.gradientText}>bajo control total</span>
        </h1>
        <p className={styles.heroDesc}>
          Kiosco, almacén, ferretería, lubricentro, indumentaria o dietética — un solo sistema con caja registradora, inventario, fiados, arqueo de turno y estadísticas reales. Sin cuadernos, sin sorpresas.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Link href="/register?coupon=LANZAMIENTO50" className={styles.heroButton}>
            Empezar prueba gratis (5 días) →
          </Link>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            5 días gratis con acceso completo (Plan Empresa) · Sin tarjeta · Listo en 2 minutos
          </span>
        </div>
      </section>

      {/* ── Dashboard Mockup ── */}
      <div className={styles.mockupWrapper}>
        <div className={styles.mockupBorder}>
          <img src="/hero-dashboard.png" alt="Smart Caja Dashboard" className={styles.mockupImage} />
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className={styles.statsStrip}>
        {[
          { value: '+200', label: 'Comercios activos' },
          { value: '+50.000', label: 'Ventas procesadas' },
          { value: '+$200M', label: 'ARS gestionados' },
          { value: '2 min', label: 'Para estar operativo' },
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
          <div className={styles.sectionTag}>Paso a paso</div>
          <h2>Empezás a vender en minutos</h2>
          <p>Sin instalaciones, sin hardware obligatorio, sin capacitación previa.</p>
        </div>
        <div className={styles.stepsGrid}>
          {[
            {
              num: '01',
              title: 'Creá tu cuenta',
              desc: 'Registrarte tarda 2 minutos. Sin tarjeta de crédito. Accedés de inmediato con 5 días de prueba completa de todas las funciones.',
              icon: '🧑‍💼',
            },
            {
              num: '02',
              title: 'Cargá tus productos',
              desc: 'Escaneá códigos de barra, importá desde Excel o cargalos uno a uno. Te ayudamos con la carga inicial si la necesitás.',
              icon: '📦',
            },
            {
              num: '03',
              title: 'Abrí turno y vendé',
              desc: 'Declarás el efectivo inicial, empezás a cobrar y al cerrar el turno el sistema calcula la diferencia automáticamente.',
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
        maxWidth: '900px',
        margin: '0 auto 80px',
        padding: '0 24px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.15) 0%, rgba(6, 14, 32, 0.6) 100%)',
          border: '1px solid rgba(37, 211, 102, 0.4)',
          borderRadius: '24px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '16px', display: 'inline-block' }}>🚚</span>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
            ¿Ya tenés tu stock en Excel u otro sistema?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            ¡No cargues todo de nuevo! Nosotros nos encargamos de migrar todo tu inventario a <strong>Smart Caja</strong> completamente gratis y en menos de 24 horas.
          </p>
          <a 
            href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola!%20Vi%20la%20promo%20de%20migración%20gratuita%20de%20Excel%20en%20la%20web%20y%20me%20gustaría%20mudarme%20a%20Smart%20Caja.`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ 
              background: '#25D366', 
              color: '#fff', 
              border: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '1rem', 
              fontWeight: 700, 
              padding: '12px 28px', 
              borderRadius: '9999px', 
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
              cursor: 'pointer'
            }}
          >
            💬 Consultar por Migración Gratuita
          </a>
        </div>
      </section>

      {/* ── Savings Calculator Section ── */}
      <section id="calculadora" style={{
        maxWidth: '900px',
        margin: '0 auto 100px',
        padding: '0 24px',
        textAlign: 'center'
      }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>ROI / Retorno</div>
          <h2>Calculá cuánto dinero estás perdiendo</h2>
          <p>Calculadora interactiva basada en pérdidas promedio de comercios minoristas sin control digital.</p>
        </div>

        <div className="card" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '24px',
          padding: '40px 32px',
          textAlign: 'left',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '24px' }}>Tus números</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                <span>Ventas Mensuales Estimadas</span>
                <span style={{ color: 'var(--color-secondary)' }}>${monthlySales.toLocaleString('es-AR')} ARS</span>
              </label>
              <input 
                type="range" 
                min="100000" 
                max="5000000" 
                step="50000"
                value={monthlySales} 
                onChange={e => setMonthlySales(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>$100.000</span>
                <span>$5.000.000</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                <span>Pérdidas estimadas (robo, fiados olvidados, stock vencido)</span>
                <span style={{ color: 'var(--color-error)' }}>{estimatedLoss}%</span>
              </label>
              <input 
                type="range" 
                min="2" 
                max="15" 
                step="0.5"
                value={estimatedLoss} 
                onChange={e => setEstimatedLoss(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>2% (Mínimo)</span>
                <span>15% (Alto)</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ahorro Mensual Estimado
            </h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)', margin: '12px 0', fontFamily: 'var(--font-headline)' }}>
              ${monthlySavings.toLocaleString('es-AR')} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>ARS</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Al digitalizar tu stock con Smart Caja, evitás robos hormiga, recordás cada fiado y liquidás stock vencido a tiempo.
            </p>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />
            <div style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 700 }}>
              📈 Retorno de Inversión (ROI): {roiMultiplier}% del plan Básico ($20.000/mes)
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="caracteristicas" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Características</div>
          <h2>Todo lo que necesitás en una sola plataforma</h2>
          <p>Funciones que la competencia no tiene, incluidas desde el primer plan.</p>
        </div>
        <div className={styles.featuresGrid}>
          {[
            {
              title: 'Caja Registradora',
              desc: 'Buscá productos por nombre o escaneá el código. Cobrá en efectivo, débito, crédito, transferencia o QR. Ticket impreso o digital.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="14" x2="6" y2="14.01"/><line x1="10" y1="14" x2="10" y2="14.01"/>
                  <line x1="14" y1="14" x2="14" y2="14.01"/><path d="M6 21h12"/>
                </svg>
              ),
            },
            {
              title: 'Arqueo de Turno',
              desc: 'Abrís con efectivo declarado y cerrás con la diferencia calculada. Cada turno queda auditado por cajero, detectando faltantes al instante.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              ),
              exclusive: true,
            },
            {
              title: 'Conciliación POSnet',
              desc: 'Registrá los cupones de tarjetas al cerrar el turno y compará con lo que el POS reportó. Cero diferencias sin explicación.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              ),
              exclusive: true,
            },
            {
              title: 'Inventario con Scanner',
              desc: 'Stock en tiempo real actualizado con cada venta. Alertas automáticas de stock crítico. Escáner por cámara o lector USB.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              ),
            },
            {
              title: 'Fiados y Cuentas Corrientes',
              desc: 'Eliminá los cuadernos. Registrá compras fiadas, controlá saldos por cliente, historial de deuda y cobros parciales.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
            },
            {
              title: 'Estadísticas de Ventas',
              desc: 'Cuánto vendiste hoy, cuáles son tus horas pico, qué productos se mueven y cuánto ganás de verdad con precio de costo.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
              ),
            },
            {
              title: 'Cuotas e Intereses',
              desc: 'Vendé en cuotas con el porcentaje de interés que configurás vos. El precio final se calcula y muestra al cliente antes de confirmar.',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              ),
            },
            {
              title: 'Multi-Sucursal',
              desc: 'Panel Casa Central con ventas, stock y turnos consolidados. Transferencias entre sucursales y precios diferenciados por punto.',
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
          <div className={styles.sectionTag}>Comercios</div>
          <h2>¿Para qué tipo de comercio es Smart Caja?</h2>
          <p>Diseñado con dueños de comercios reales. Si vendés, te sirve.</p>
        </div>
        <div className={styles.commerceGrid}>
          {[
            { icon: '🥤', name: 'Kiosco' },
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

      {/* ── Testimonios ── */}
      <section id="testimonios" className={styles.testimonialsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Testimonios</div>
          <h2>Lo que dicen los comerciantes</h2>
          <p>Negocios reales que digitalizaron su gestión y recuperaron el control.</p>
        </div>
        <div className={styles.testimonialsGrid}>
          {[
            {
              quote: "Descubrí que me faltaba mercadería por más de $30.000 al mes. Con el inventario y la conciliación de cupones de Smart Caja ese problema desapareció por completo.",
              author: "Carlos M.",
              role: "Dueño de Minimarket",
              location: "Moreno, Buenos Aires"
            },
            {
              quote: "El sistema de cuentas corrientes cambió todo. Anotaba los fiados en cuadernos que siempre se perdían. Ahora sé el saldo de cada cliente en segundos y cobro más rápido.",
              author: "Patricia L.",
              role: "Almacén La Esperanza",
              location: "La Plata, Buenos Aires"
            },
            {
              quote: "Tengo tres empleados en turnos rotativos. Con el arqueo de turno de Smart Caja, cada centavo queda auditado y sé exactamente qué pasó en cada caja.",
              author: "Martín R.",
              role: "Lubricentro San Martín",
              location: "CABA"
            }
          ].map((test, i) => (
            <div key={i} className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>
                {[...Array(5)].map((_, si) => (
                  <svg key={si} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#FFB800' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p className={styles.testimonialQuote}>&ldquo;{test.quote}&rdquo;</p>
              <div className={styles.testimonialAuthor}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <strong>{test.author}</strong>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(78, 222, 163, 0.1)', color: 'var(--color-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
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

      {/* ── Lead Magnet Section ── */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto 100px',
        padding: '0 24px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(6, 14, 32, 0.5) 100%)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '24px',
          padding: '48px 32px',
          boxShadow: '0 20px 45px rgba(124,58,237,0.1)'
        }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '16px', display: 'inline-block' }}>📖</span>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Guía Gratuita: Evitá fugas de dinero en tu negocio
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '550px', margin: '0 auto 28px', lineHeight: 1.5 }}>
            Descargá el PDF gratuito **"5 formas de dejar de perder plata en tu comercio"** y aprendé las mejores prácticas de control de stock y auditoría de turnos.
          </p>

          {leadSubmitted ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              padding: '20px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '1rem',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              🎉 ¡Registro exitoso! Te enviamos un correo con el link de descarga directa. Revisá tu bandeja de entrada en unos minutos.
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxWidth: '500px',
              margin: '0 auto',
              textAlign: 'left'
            }}>
              {leadError && (
                <div style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>
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
                  style={{ whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', padding: '0 24px' }}
                >
                  {leadLoading ? 'Registrando...' : 'Descargar PDF 🚀'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ── Tienda Online / Tiendanube Section (High Anchor Pricing) ── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 14, 32, 0.8) 100%)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative ambient light */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(124, 58, 237, 0.15)',
              color: 'var(--color-primary)',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '16px'
            }}>
              Módulo de Ventas Online
            </div>
            <h2 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '2.25rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              ¿Seguís pagando de más por tu Tienda Online?
            </h2>
            <p style={{
              fontSize: '1.0625rem',
              color: 'var(--text-muted)',
              marginTop: '12px',
              maxWidth: '700px',
              margin: '12px auto 0',
              lineHeight: 1.5
            }}>
              Otras plataformas te cobran costosas mensualidades fijas y comisiones abusivas por cada venta. En Smart Caja te damos un e-commerce y catálogo WhatsApp profesional **100% GRATIS**.
            </p>
          </div>

          {/* Pricing Comparison Anchor Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '24px',
            padding: '32px',
            marginBottom: '48px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Costo promedio en el mercado</div>
                <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#ef4444', margin: '8px 0', textDecoration: 'line-through', opacity: 0.8 }}>
                  $35.000 a $85.000 / mes
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Cobrado por plataformas tradicionales + 2% a 5% de comisión por cada transacción.
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
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Con Smart Caja</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#4edea3', margin: '8px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  $0 <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Gratis para siempre</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
                  Disponible en todos los planes. Sin comisiones por venta. Cero costos de mantenimiento.
                </p>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <Link href="/register" className={styles.registerButton} style={{
                  padding: '16px 32px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'inline-block',
                  width: '100%',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(221, 183, 255, 0.3)',
                  textDecoration: 'none'
                }}>
                  Crear Mi Catálogo Gratis
                </Link>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Listo en menos de 2 minutos · Sin tarjeta
                </div>
              </div>
            </div>
          </div>

          {/* Feature details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              transition: 'transform 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔌</div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#fff', margin: 0 }}>Sincronización con Tiendanube</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                ¿Ya vendés por Tiendanube? Conectala a Smart Caja en 1 clic e importá tu catálogo completo. El stock físico e imágenes se actualizan solos, centralizando tu control sin duplicar trabajo.
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              transition: 'transform 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏰</div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#fff', margin: 0 }}>Control de Horarios y Stock</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                Tus clientes ven si estás abierto o cerrado en tiempo real. Además, decidís si preferís mostrar productos sin stock con la etiqueta de "Sin stock" o si querés que se oculten automáticamente.
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              transition: 'transform 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💬</div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#fff', margin: 0 }}>Pedidos Directos a WhatsApp</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                Tus clientes cargan sus carritos y te envían el pedido detallado directo a tu WhatsApp y se registra en tu panel de Pedidos de Smart Caja. Coordinás cobro y entrega sin intermediarios.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="planes" className={styles.pricingSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Precios</div>
          <h2>Planes a tu medida</h2>
          <p>Más completo que la competencia en cada nivel. Precios transparentes, sin sorpresas.</p>
        </div>

        <div className={styles.pricingGrid}>
          {PLANS.map((plan, pi) => (
            <div key={pi} className={plan.highlight ? styles.pricingCardPro : styles.pricingCard}>
              {plan.badge && <div className={styles.popularBadge}>{plan.badge}</div>}
              <div>
                <h3>{plan.name}</h3>
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
          gap: '24px',
          marginTop: '40px',
          opacity: 0.6,
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pagá de forma segura con:</span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ background: '#009EE3', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>Mercado Pago</span>
            <span style={{ background: '#fff', color: '#1A1A1A', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>VISA</span>
            <span style={{ background: '#fff', color: '#1A1A1A', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>Mastercard</span>
            <span style={{ background: '#fff', color: '#1A1A1A', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>Cabal</span>
          </div>
        </div>

        <p className={styles.pricingNote}>
          🔜 <strong>Facturación ARCA</strong> (emisión de facturas electrónicas) estará disponible próximamente en todos los planes sin costo adicional.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>FAQ</div>
          <h2>Preguntas frecuentes</h2>
          <p>Todo lo que necesitás saber antes de empezar.</p>
        </div>
        <div className={styles.faqGrid}>
          {[
            {
              q: "¿Qué tiene Smart Caja que otras plataformas no incluyen?",
              a: "Arqueo de caja por turno, conciliación de cupones POSnet, rentabilidad real por producto y ventas en cuotas con intereses configurables. Son funciones que desarrollamos escuchando a comerciantes reales y que no encontrarás completas en la mayoría de los sistemas del mercado."
            },
            {
              q: "¿Es necesario instalar algún programa?",
              a: "No. Smart Caja funciona 100% desde el navegador de cualquier celular, tablet o computadora, sin descargas ni instalaciones."
            },
            {
              q: "¿Cómo funciona la prueba gratis de 5 días?",
              a: "Te registrás en 2 minutos sin tarjeta de crédito y accedés de inmediato a todas las funciones de todos los planes (incluyendo funciones del plan Profesional y Empresa) para que evalúes el potencial completo de Smart Caja en tu negocio."
            },
            {
              q: "¿Cómo me ayudan con la carga inicial de stock?",
              a: "Ofrecemos soporte directo por WhatsApp para ayudarte a importar masivamente tu lista de productos desde planillas de Excel, fotos o PDF."
            },
            {
              q: "¿Tienen integración con Mercado Pago?",
              a: "Sí. Podés ingresar tus credenciales de Mercado Pago en la configuración para habilitar cobros integrados con QR y link de pago."
            },
            {
              q: "¿Puedo cancelar en cualquier momento?",
              a: "Sí. Sin penalidades ni permanencia mínima. Cancelás desde tu cuenta y conservás el acceso hasta el fin del período ya abonado."
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
          <h2>Transformá tu negocio hoy</h2>
          <p>Únete a cientos de comercios que ya controlan sus ventas y stock desde una sola plataforma.</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Link href="/register?coupon=LANZAMIENTO50" className={styles.heroButton}>Crear cuenta gratis →</Link>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              Setup en 2 minutos · 5 días de prueba completa de todas las funciones · Sin tarjetas
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
          <a href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola%20Smart%20Caja,%20tengo%20una%20consulta`} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Chatear por WhatsApp</a>
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
