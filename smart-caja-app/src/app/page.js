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
      { label: 'Control de Gastos y Desperdicios', ok: false },
      { label: 'Módulo de Pedidos y Preventa', ok: false },
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
      { label: 'Gestión de Pedidos y Preventistas', ok: true },
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

  return (
    <div className={styles.landingContainer}>

      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}></div>
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
      <section className={styles.hero}>
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
          <Link href="/register" className={styles.heroButton}>
            Empezar prueba gratis →
          </Link>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            5 días gratis con acceso a todas las funciones (Plan Empresa) · Sin tarjeta de crédito · Listo en 2 minutos
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
              desc: 'Registrarte tarda 2 minutos. Sin tarjeta de crédito. Accedés de inmediato con 5 días de prueba completa de todas las funciones (Plan Empresa).',
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
                href="/register"
                className={plan.ctaStyle === 'primary' ? styles.pricingButtonPro : styles.pricingButton}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
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
            <Link href="/register" className={styles.heroButton}>Crear cuenta gratis →</Link>
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
