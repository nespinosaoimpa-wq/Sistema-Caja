'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './page.module.css'
import BrandLogo from '@/components/ui/BrandLogo'

// ── Minimalist Clean SVG Icons (Zero Childish Emojis) ──
const CheckIcon = ({ color = '#2DD4BF', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const PosIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    <line x1="6" y1="14" x2="6" y2="14.01"/><line x1="10" y1="14" x2="10" y2="14.01"/><line x1="14" y1="14" x2="14" y2="14.01"/>
    <path d="M6 21h12"/>
  </svg>
)

const ShiftAuditIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)

const CardTerminalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    <circle cx="6" cy="15" r="1.5"/><circle cx="10" cy="15" r="1.5"/>
  </svg>
)

const BarcodeScanIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v4M21 5v4M3 19v-4M21 19v-4M7 9v6M11 9v6M15 9v6M17 9v6M9 9v6"/>
  </svg>
)

const LedgerBookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    <line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="13" y2="11"/>
  </svg>
)

const AnalyticsProfitIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)

const InstallmentsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const WasteControlIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const MultiBranchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

const DatabaseMigrationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
)

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

// ── Rubro Vector Icons (Linear & Sharp) ──
const KioskVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

const MarketVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)

const ScalesVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M6 8l6-2 6 2M6 8l-3 7h6l-3-7zm12 0l-3 7h6l-3-7z"/>
  </svg>
)

const ApparelVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
  </svg>
)

const HardwareVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
)

const AutomotiveVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)

const HealthVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)

const VeggiesVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)

const RetailVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const StorefrontVector = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h20"/><path d="M21 3v6a4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1-4 4 4 4 0 0 1-4-4V3"/><path d="M4 13v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8"/>
  </svg>
)

const PLANS = [
  {
    name: 'Profesional',
    price: '$60.000',
    desc: 'Todo lo que necesita tu comercio para operar rápido, auditar turnos de cajeros y controlar stock sin pérdidas.',
    highlight: true,
    badge: 'PLAN RECOMENDADO',
    features: [
      { label: 'Punto de Venta (POS) ultrarrápido y venta por peso / kilo / unidad', ok: true },
      { label: 'Productos ilimitados (códigos de barra y códigos internos)', ok: true },
      { label: 'Efectivo, tarjetas de débito/crédito, transferencias y cobros QR', ok: true },
      { label: 'Arqueo de caja por turno auditado (Diferencia Dueño vs Cajeros)', ok: true, exclusive: true },
      { label: 'Control de Mermas, Desperdicios y Mercadería Dañada', ok: true, exclusive: true },
      { label: 'Cuentas Corrientes y Fiados con alertas de límite de deuda', ok: true, exclusive: true },
      { label: 'Estadísticas avanzadas de facturación diaria, semanal y mensual', ok: true, exclusive: true },
      { label: 'Cálculo de rentabilidad neta real por producto y margen comercial', ok: true, exclusive: true },
      { label: 'Cobro en cuotas con interés bancario personalizable', ok: true, exclusive: true },
      { label: 'Permisos y roles de cajero vs administrador (hasta 5 usuarios)', ok: true },
      { label: 'Personalización de tickets impresos con datos y logo propio', ok: true, exclusive: true },
      { label: 'Exportación de balances y cierres contables en Excel / CSV', ok: true },
      { label: 'Catálogo Online y pedidos directos a WhatsApp (100% GRATIS)', ok: true },
      { label: 'Soporte prioritario directo por WhatsApp ≤ 2hs', ok: true },
      { label: 'Facturación oficial ARCA', ok: false, soon: true },
      { label: 'Multi-sucursal centralizado', ok: false },
    ],
    cta: 'Comenzar prueba gratis de 15 días',
    ctaStyle: 'primary',
  },
  {
    name: 'Empresa',
    price: '$100.000',
    desc: 'Para cadenas, franquicias y comercios con múltiples sucursales o depósitos centralizados.',
    highlight: false,
    badge: 'CASA CENTRAL',
    features: [
      { label: 'Todo lo incluido en el Plan Profesional', ok: true },
      { label: 'Multi-sucursal ilimitado con panel Casa Central unificado', ok: true, exclusive: true },
      { label: 'Transferencia de mercadería entre sucursales y depósitos', ok: true, exclusive: true },
      { label: 'Reportes comparativos de rendimiento entre locales', ok: true, exclusive: true },
      { label: 'Listas de precios diferenciadas por punto de venta', ok: true, exclusive: true },
      { label: 'Módulo de Compras y Órdenes a Proveedores', ok: true, exclusive: true },
      { label: 'Usuarios y roles ilimitados con control por sucursal', ok: true },
      { label: 'Importación masiva continua de catálogo en Excel', ok: true },
      { label: 'Integración y sincronización de datos con sistemas externos', ok: true },
      { label: 'Puesta en marcha y capacitación personalizada para el equipo', ok: true },
      { label: 'Soporte prioritario 24/7 con canal de guardia dedicado', ok: true },
      { label: 'Facturación oficial ARCA', ok: false, soon: true },
    ],
    cta: 'Probar Plan Empresa (15 días gratis)',
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
  const [estimatedLoss, setEstimatedLoss] = useState(6)

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
      <div className={styles.ambientGlowMid} />

      {/* ── Top Announcement Bar (Executive Style) ── */}
      <div className={styles.announcementBar}>
        {isWeekend ? (
          <>
            <span className={styles.announcementPill}>
              PROMO EXCLUSIVA
            </span>
            <span>
              Registrate hoy y obtené <strong>Migración de Stock Bonificada</strong> + <strong>15 días de prueba completa</strong> sin cargo.
            </span>
            <a 
              href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola!%20Quiero%20aprovechar%20la%20promo%20de%20Migración%20Gratuita%20de%20Excel%20y%2015%20días%20gratis.`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.announcementLink}
            >
              Consultar por WhatsApp
            </a>
          </>
        ) : (
          <>
            <span className={styles.announcementPill}>
              CATÁLOGO WEB SIN COSTO
            </span>
            <span>
              Creá tu Tienda Online con catálogo sincronizado y pedidos a WhatsApp <strong>100% GRATIS</strong> sin comisiones.
            </span>
            <Link href="/catalogo-gratis" className={styles.announcementLink}>
              Activar Tienda Online
            </Link>
          </>
        )}
      </div>

      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <Link href="/" className={styles.brand}>
          <BrandLogo size={36} textSize="1.35rem" />
        </Link>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <span></span><span></span><span></span>
        </button>

        <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksActive : ''}`}>
          <a href="#sistema" className={styles.navLink} onClick={() => setMenuOpen(false)}>Módulos</a>
          <a href="#rubros" className={styles.navLink} onClick={() => setMenuOpen(false)}>Rubros</a>
          <a href="#como-funciona" className={styles.navLink} onClick={() => setMenuOpen(false)}>Cómo Funciona</a>
          <a href="#calculadora" className={styles.navLink} onClick={() => setMenuOpen(false)}>Calculadora ROI</a>
          <a href="#planes" className={styles.navLink} onClick={() => setMenuOpen(false)}>Planes</a>
          <a href="#faq" className={styles.navLink} onClick={() => setMenuOpen(false)}>Preguntas</a>
          <div className={styles.navActionsMobile}>
            <Link href="/login" className={styles.loginLink} onClick={() => setMenuOpen(false)}>Acceso Clientes</Link>
            <Link href="/register" className={styles.registerButton} onClick={() => setMenuOpen(false)}>Prueba Gratis 15 Días</Link>
          </div>
        </div>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginLink}>Acceso Clientes</Link>
          <Link href="/register" className={styles.registerButton}>Prueba Gratis 15 Días</Link>
        </div>
      </nav>

      {/* ── Hero (Strong Editorial Authority) ── */}
      <section className={styles.hero}>
        <div className={styles.heroTagBadge}>
          <span className={styles.heroTagBadgeDot}></span>
          <span>SISTEMA DE COBROS & GESTIÓN DE CAJA COMERCIAL</span>
        </div>

        <h1 className={styles.heroTitle}>
          SISTEMA DE COBROS <br />
          <span className={styles.heroTitleCream}>Y CONTROL DE CAJA</span> <br />
          <span className={styles.heroTitleTeal}>BAJO CONTROL TOTAL</span>
        </h1>

        <p className={styles.heroDesc}>
          Diseñado para el ritmo real del mostrador: <strong>Punto de venta de alta velocidad</strong>, arqueos de turno auditados, control de inventario por kilo o unidad y <strong>cuentas corrientes sin cuadernos ni pérdidas</strong>.
        </p>

        <div className={styles.heroActions}>
          <Link href="/register?coupon=LANZAMIENTO50" className={styles.heroButton}>
            <span>Comenzar prueba gratis de 15 días</span>
            <ArrowRight />
          </Link>
          <Link href="/catalogo-gratis" className={styles.heroSecondaryButton}>
            <span>Ver Catálogo Online Gratis</span>
          </Link>
        </div>

        <div className={styles.heroTrustRow}>
          <div className={styles.heroTrustItem}>
            <span className={styles.heroTrustCheck}>✓</span>
            <span>15 días de acceso irrestricto</span>
          </div>
          <div className={styles.heroTrustItem}>
            <span className={styles.heroTrustCheck}>✓</span>
            <span>Sin datos de tarjeta de crédito</span>
          </div>
          <div className={styles.heroTrustItem}>
            <span className={styles.heroTrustCheck}>✓</span>
            <span>Migración técnica de Excel incluida</span>
          </div>
          <div className={styles.heroTrustItem}>
            <span className={styles.heroTrustCheck}>✓</span>
            <span>Operativo en 2 minutos</span>
          </div>
        </div>
      </section>

      {/* ── Realistic Cashier POS Screen Mockup ── */}
      <div className={styles.mockupWrapper}>
        <div className={styles.mockupWindow}>
          <div className={styles.mockupHeader}>
            <div className={styles.mockupDots}>
              <span className={styles.mockupDot} style={{ background: '#EF4444' }}></span>
              <span className={styles.mockupDot} style={{ background: '#F59E0B' }}></span>
              <span className={styles.mockupDot} style={{ background: '#10B981' }}></span>
            </div>
            <div className={styles.mockupAddressBar}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>app.smartcaja.com/pos — Terminal de Caja Activa</span>
            </div>
            <div className={styles.mockupBadge}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2DD4BF' }}></span>
              TURNO #104 AUDITADO
            </div>
          </div>

          <div className={styles.mockupBody}>
            {/* POS Main Screen */}
            <div className={styles.mockupMainPos}>
              <div className={styles.mockupSearchBar}>
                <BarcodeScanIcon />
                <span>Escanear código de barras o presionar F2 para buscar producto...</span>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                  Productos Frecuentes en Caja
                </div>
                <div className={styles.mockupGridProducts}>
                  <div className={`${styles.mockupProductTile} ${styles.mockupProductTileActive}`}>
                    <span className={styles.mockupProductCategory}>Bebidas</span>
                    <strong className={styles.mockupProductTitle}>Coca-Cola 1.5 L</strong>
                    <span className={styles.mockupProductPrice}>$2.400,00</span>
                    <span style={{ fontSize: '0.65rem', color: '#2DD4BF', fontWeight: 600 }}>Stock: 48 un.</span>
                  </div>

                  <div className={styles.mockupProductTile}>
                    <span className={styles.mockupProductCategory}>Fiambrería</span>
                    <strong className={styles.mockupProductTitle}>Queso Cremoso (kg)</strong>
                    <span className={styles.mockupProductPrice}>$7.500,00</span>
                    <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Balanza conectada</span>
                  </div>

                  <div className={styles.mockupProductTile}>
                    <span className={styles.mockupProductCategory}>Almacén</span>
                    <strong className={styles.mockupProductTitle}>Pan Francés (kg)</strong>
                    <span className={styles.mockupProductPrice}>$2.200,00</span>
                    <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Venta por peso</span>
                  </div>
                </div>
              </div>

              {/* Status Pills Row */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 'auto' }}>
                <div style={{ background: 'rgba(45, 212, 191, 0.08)', border: '1px solid rgba(45, 212, 191, 0.25)', borderRadius: '8px', padding: '8px 14px', fontSize: '0.75rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckIcon size={14} />
                  <span><strong>Arqueo en tiempo real:</strong> Diferencia $0,00</span>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '8px 14px', fontSize: '0.75rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CardTerminalIcon />
                  <span><strong>POSnet Conciliado:</strong> 18 cupones validados</span>
                </div>
              </div>
            </div>

            {/* Receipt Summary Sidebar */}
            <div className={styles.mockupSidebarReceipt}>
              <div>
                <div className={styles.mockupReceiptHeader}>
                  <h4>Ticket de Venta #00284</h4>
                  <span style={{ fontSize: '0.7rem', color: '#2DD4BF', background: 'rgba(45, 212, 191, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Cobro Rápido</span>
                </div>

                <div className={styles.mockupCartItems}>
                  <div className={styles.mockupCartItem}>
                    <div>
                      <div>Coca-Cola 1.5 L</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>1 un. x $2.400,00</span>
                    </div>
                    <strong>$2.400,00</strong>
                  </div>

                  <div className={styles.mockupCartItem}>
                    <div>
                      <div>Queso Cremoso La Paulina</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>0,650 kg x $7.500,00</span>
                    </div>
                    <strong>$4.875,00</strong>
                  </div>

                  <div className={styles.mockupCartItem}>
                    <div>
                      <div>Pan Francés</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>1,000 kg x $2.200,00</span>
                    </div>
                    <strong>$2.200,00</strong>
                  </div>
                </div>
              </div>

              <div className={styles.mockupCartTotalBox}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '6px' }}>
                  Cobro mixto: Efectivo $5.000 + QR $4.475
                </div>
                <div className={styles.mockupTotalRow}>
                  <span className={styles.mockupTotalLabel}>Total a Cobrar</span>
                  <span className={styles.mockupTotalAmount}>$9.475,00</span>
                </div>
                <button className={styles.mockupChargeButton} type="button">
                  <span>Confirmar e Imprimir Ticket</span>
                  <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.statValueTeal}`}>+200</div>
          <div className={styles.statLabel}>Comercios Activos Diarios</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>+50.000</div>
          <div className={styles.statLabel}>Ventas Registradas al Mes</div>
        </div>
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.statValueTeal}`}>+$200M</div>
          <div className={styles.statLabel}>ARS Transaccionados sin Fugas</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>&lt; 2 min</div>
          <div className={styles.statLabel}>Tiempo de Puesta en Marcha</div>
        </div>
      </div>

      {/* ── Soluciones por Rubro (Clean Vectors - No Childish Emojis) ── */}
      <section id="rubros" className={styles.forWhoSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Especialización Comercial</div>
          <h2>Especialmente diseñado para tu mostrador</h2>
          <p>Cada rubro minorista tiene desafíos distintos. Smart Caja se adapta a las reglas operativas de tu negocio.</p>
        </div>
        <div className={styles.commerceGrid}>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><KioskVector /></div>
            <span className={styles.commerceName}>Kioscos & Drugstores</span>
            <span className={styles.commerceSubtitle}>Velocidad extrema de cobro y combos</span>
          </div>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><MarketVector /></div>
            <span className={styles.commerceName}>Almacenes & Minimarkets</span>
            <span className={styles.commerceSubtitle}>Control de fiados y reposición</span>
          </div>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><ScalesVector /></div>
            <span className={styles.commerceName}>Fiambrerías & Carnicerías</span>
            <span className={styles.commerceSubtitle}>Venta por peso y control de mermas</span>
          </div>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><VeggiesVector /></div>
            <span className={styles.commerceName}>Verdulerías & Fruterías</span>
            <span className={styles.commerceSubtitle}>Pesaje rápido con tara de balanza</span>
          </div>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><HardwareVector /></div>
            <span className={styles.commerceName}>Ferreterías & Bazares</span>
            <span className={styles.commerceSubtitle}>Búsqueda de códigos y presupuestos</span>
          </div>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><ApparelVector /></div>
            <span className={styles.commerceName}>Indumentaria & Calzado</span>
            <span className={styles.commerceSubtitle}>Talle, color y catálogo visual</span>
          </div>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><AutomotiveVector /></div>
            <span className={styles.commerceName}>Lubricentros & Repuestos</span>
            <span className={styles.commerceSubtitle}>Venta suelta y cuenta corriente</span>
          </div>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><HealthVector /></div>
            <span className={styles.commerceName}>Dietéticas & Perfumerías</span>
            <span className={styles.commerceSubtitle}>Venta fraccionada por gramo</span>
          </div>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><RetailVector /></div>
            <span className={styles.commerceName}>Librerías & Regalerías</span>
            <span className={styles.commerceSubtitle}>Lectura de códigos y cuotas</span>
          </div>
          <div className={styles.commerceItem}>
            <div className={styles.commerceIconWrapper}><StorefrontVector /></div>
            <span className={styles.commerceName}>Todo Comercio Minorista</span>
            <span className={styles.commerceSubtitle}>Punto de venta y auditoría de caja</span>
          </div>
        </div>
      </section>

      {/* ── Módulos del Sistema (Features) ── */}
      <section id="sistema" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>ARQUITECTURA DEL SISTEMA</div>
          <h2>Módulos operativos de alta precisión</h2>
          <p>Herramientas desarrolladas para garantizar rapidez en la atención y control estricto de cada peso recaudado.</p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><PosIcon /></div>
            <h3>Punto de Venta y Cobro Mixto</h3>
            <p>Facturación ultra veloz con escáner USB o cámara de celular. Cobros fraccionados en efectivo, tarjetas, transferencias y QR en una sola operación.</p>
          </div>

          <div className={`${styles.featureCard} ${styles.featureCardExclusive}`}>
            <span className={styles.exclusiveBadge}>Módulo Auditoría</span>
            <div className={styles.featureIconWrapper}><ShiftAuditIcon /></div>
            <h3>Arqueo de Turno por Cajero</h3>
            <p>Apertura con fondo declarado y cierre ciego con cálculo automático de sobrantes o faltantes. El dueño audita cada turno con métricas independientes.</p>
          </div>

          <div className={`${styles.featureCard} ${styles.featureCardExclusive}`}>
            <span className={styles.exclusiveBadge}>Conciliación Financiera</span>
            <div className={styles.featureIconWrapper}><CardTerminalIcon /></div>
            <h3>Conciliación de Cupones POSnet</h3>
            <p>Verificación cruzada de cupones de tarjetas contra el cierre de turno. Detección inmediata de transacciones duplicadas o cupones faltantes.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><LedgerBookIcon /></div>
            <h3>Cuentas Corrientes y Fiados Digitales</h3>
            <p>Eliminá el cuaderno de almacén. Asigná límites de crédito a clientes de confianza, registrá entregas a cuenta y enviá balances por WhatsApp.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><BarcodeScanIcon /></div>
            <h3>Inventario Inteligente con Escáner</h3>
            <p>Descuento automático de stock con cada venta. Alertas tempranas de productos próximos a agotarse y compatibilidad con lectores industriales.</p>
          </div>

          <div className={`${styles.featureCard} ${styles.featureCardExclusive}`}>
            <span className={styles.exclusiveBadge}>Prevención de Fugas</span>
            <div className={styles.featureIconWrapper}><WasteControlIcon /></div>
            <h3>Control de Mermas y Desperdicios</h3>
            <p>Registro auditado de productos rotos, vencidos o consumos internos del local, garantizando que el stock físico cuadre exactamente con el sistema.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><AnalyticsProfitIcon /></div>
            <h3>Rentabilidad Neta por Producto</h3>
            <p>Conocé el margen de ganancia real descontando el costo de compra actualizado. Reportes de horas pico y productos con mayor rotación comercial.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><InstallmentsIcon /></div>
            <h3>Planes de Cuotas con Interés</h3>
            <p>Personalizá tus propios recargos por financiación en 3, 6 o 12 cuotas. El sistema calcula y exhibe el importe exacto al cliente antes de confirmar.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}><MultiBranchIcon /></div>
            <h3>Multi-Sucursal & Casa Central</h3>
            <p>Consolidación de ventas y stock de dos o más locales desde una Casa Central. Transferencias de mercadería entre depósitos y precios por zona.</p>
          </div>
        </div>
      </section>

      {/* ── Workflow (Cómo Funciona) ── */}
      <section id="como-funciona" className={styles.howSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Implementación Rápida</div>
          <h2>Operativo en tu mostrador en 3 pasos</h2>
          <p>Sin instalaciones engorrosas, sin compras obligatorias de equipamiento y con soporte guiado.</p>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepHeaderRow}>
              <span className={styles.stepNum}>PASO 01</span>
              <div className={styles.stepIconContainer}><StorefrontVector /></div>
            </div>
            <h3>Registro Inmediato</h3>
            <p>Creás tu cuenta en menos de 2 minutos sin ingresar tarjetas de crédito. Acceso total a todas las herramientas durante 15 días.</p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepHeaderRow}>
              <span className={styles.stepNum}>PASO 02</span>
              <div className={styles.stepIconContainer}><BarcodeScanIcon /></div>
            </div>
            <h3>Carga de Inventario</h3>
            <p>Escaneá con la cámara de tu celular, usá pistolas lectoras de barras o envianos tu Excel para que nuestro equipo técnico lo importe gratis.</p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepHeaderRow}>
              <span className={styles.stepNum}>PASO 03</span>
              <div className={styles.stepIconContainer}><PosIcon /></div>
            </div>
            <h3>Abrí Turno y Cobrá</h3>
            <p>Declarás tu efectivo inicial, cobrás con cualquier medio de pago y al terminar la jornada cerrás turno con arqueo exacto y auditado.</p>
          </div>
        </div>
      </section>

      {/* ── Migration Banner (Technical Authority) ── */}
      <section style={{ maxWidth: '960px', margin: '0 auto 90px', padding: '0 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, #0E1727 100%)',
          border: '1px solid rgba(45, 212, 191, 0.35)',
          borderRadius: '20px',
          padding: '36px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', maxWidth: '620px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DatabaseMigrationIcon />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                ¿Tenés tu stock en Excel u otro sistema anterior?
              </h3>
              <p style={{ color: '#CBD5E1', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
                No cargues todo a mano. Nuestro equipo técnico migra tu inventario completo con precios y códigos a Smart Caja <strong>100% bonificado en menos de 24 horas</strong>.
              </p>
            </div>
          </div>

          <a 
            href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola!%20Vi%20la%20migración%20gratuita%20de%20Excel%20en%20Smart%20Caja%20y%20me%20gustaría%20mudar%20mi%20catálogo.`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.heroButton}
            style={{ padding: '12px 24px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
          >
            <span>Solicitar Migración sin Costo</span>
            <ArrowRight />
          </a>
        </div>
      </section>

      {/* ── Tienda Online Integrada (Ancla de Valor) ── */}
      <section className={styles.tiendaComparisonSection}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className={styles.sectionTag}>E-Commerce para Comercios</div>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '2.5rem', fontWeight: 700, textTransform: 'uppercase', color: '#FFFFFF', letterSpacing: '0.02em', margin: '0 0 12px 0' }}>
              ¿Por qué pagar mensualidades extras por tu tienda online?
            </h2>
            <p style={{ fontSize: '1.0625rem', color: '#94A3B8', maxWidth: '720px', margin: '0 auto', lineHeight: 1.6 }}>
              Otras plataformas te cobran costos mensuales elevados más comisión por cada venta. En Smart Caja contás con tu catálogo web sincronizado al stock del local <strong>100% GRATIS para siempre</strong>.
            </p>
          </div>

          <div className={styles.tiendaComparisonBox}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '28px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costo promedio de mercado</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#EF4444', margin: '6px 0', textDecoration: 'line-through', opacity: 0.85, fontFamily: 'Oswald, sans-serif' }}>
                  $35.000 a $85.000 / mes
                </div>
                <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                  Aranceles fijos de plataformas tradicionales más 2% a 5% de comisión por cada transacción cobrada.
                </p>
              </div>

              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '0.75rem', color: '#2DD4BF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Con Smart Caja</div>
                <div style={{ fontSize: '2.75rem', fontWeight: 800, color: '#2DD4BF', margin: '6px 0', display: 'flex', alignItems: 'baseline', gap: '8px', fontFamily: 'Oswald, sans-serif' }}>
                  $0 <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#E2E8F0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Gratis para siempre</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
                  Incluido en todos los planes. Sin comisiones por venta. Actualización automática de precios y stock.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Link href="/register?mode=store" className={styles.heroButton} style={{ width: '100%', textAlign: 'center' }}>
                  <span>Activar Catálogo Web Gratis</span>
                  <ArrowRight />
                </Link>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '8px' }}>
                  Listo en 2 minutos · Sin tarjeta requerida
                </div>
              </div>
            </div>
          </div>

          {/* Details Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#0E1727', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '24px' }}>
              <div style={{ color: '#2DD4BF', marginBottom: '12px' }}><StorefrontVector /></div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>Sincronización con Tiendanube</h4>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
                Si ya vendés por Tiendanube, podés vincularla con 1 clic: stock, precios y fotos sincronizados con tu caja física.
              </p>
            </div>

            <div style={{ background: '#0E1727', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '24px' }}>
              <div style={{ color: '#2DD4BF', marginBottom: '12px' }}><InstallmentsIcon /></div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>Horarios Comerciales y Stock</h4>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
                Tus clientes ven si el local está abierto o cerrado en tiempo real, evitando pedidos fuera de horario.
              </p>
            </div>

            <div style={{ background: '#0E1727', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '24px' }}>
              <div style={{ color: '#2DD4BF', marginBottom: '12px' }}><CardTerminalIcon /></div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>Pedidos Directos a WhatsApp</h4>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
                El cliente arma su carrito y te envía el pedido ordenado y totalizado a tu WhatsApp, registrado en tu panel de pedidos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Calculadora ROI / Retorno Financiero ── */}
      <section id="calculadora" style={{ maxWidth: '960px', margin: '0 auto 100px', padding: '0 24px', textAlign: 'center' }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Auditoría de Pérdidas</div>
          <h2>Calculá cuánto dinero dejás de perder cada mes</h2>
          <p>Herramienta interactiva basada en pérdidas promedio no registradas en comercios minoristas (errores de cobro, fiados no cobrados y descuadres de caja).</p>
        </div>

        <div style={{
          background: '#0E1727',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '36px 36px',
          textAlign: 'left',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '36px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 700, marginBottom: '22px', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Variables de tu Comercio</h3>
            
            <div style={{ marginBottom: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#CBD5E1', marginBottom: '8px', fontWeight: 600 }}>
                <span>Ventas Mensuales Estimadas</span>
                <span style={{ color: '#2DD4BF', fontWeight: 700 }}>${monthlySales.toLocaleString('es-AR')} ARS</span>
              </div>
              <input 
                type="range" 
                min="100000" 
                max="5000000" 
                step="50000"
                value={monthlySales} 
                onChange={e => setMonthlySales(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0D9488', height: '6px', cursor: 'pointer' }}
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
                style={{ width: '100%', accentColor: '#0D9488', height: '6px', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                <span>2% (Mínimo habitual)</span>
                <span>15% (Sin ningún control)</span>
              </div>
            </div>
          </div>

          <div style={{
            background: '#111D31',
            border: '1px solid rgba(45, 212, 191, 0.25)',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              Dinero Recuperado por Control de Caja
            </h4>
            <div style={{ fontSize: '2.75rem', fontWeight: 800, color: '#2DD4BF', margin: '10px 0', fontFamily: 'Oswald, sans-serif' }}>
              ${monthlySavings.toLocaleString('es-AR')} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ARS / mes</span>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Al auditar cada turno y digitalizar los fiados, evitás las fugas hormiga y el software se amortiza solo en los primeros días.
            </p>
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '8px 0' }} />
            <div style={{ fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700 }}>
              Retorno sobre el Plan Profesional ($60.000/mes): {roiMultiplier}%
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonios ── */}
      <section id="testimonios" className={styles.testimonialsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Experiencias Comerciales</div>
          <h2>Validado por comerciantes reales</h2>
          <p>Negocios que profesionalizaron su cobranza diaria y eliminaron las pérdidas de caja.</p>
        </div>
        <div className={styles.testimonialsGrid}>
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars}>
              {[...Array(5)].map((_, si) => (
                <svg key={si} width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
            <p className={styles.testimonialQuote}>
              &ldquo;Antes cerrábamos el turno contando billetes a ojo y siempre faltaba plata. Desde que implementamos el arqueo auditado de Smart Caja, las diferencias desaparecieron por completo.&rdquo;
            </p>
            <div className={styles.testimonialAuthor}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Carlos M.</strong>
                <span style={{ background: 'rgba(20, 184, 166, 0.12)', color: '#2DD4BF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>Verificado</span>
              </div>
              <span>Minimarket San Jorge · Moreno, Buenos Aires</span>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars}>
              {[...Array(5)].map((_, si) => (
                <svg key={si} width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
            <p className={styles.testimonialQuote}>
              &ldquo;El cuaderno de fiados era un desastre: hojas rotas y clientes que se olvidaban de pagar. Hoy tengo las cuentas corrientes con límites en el sistema y cobro en fecha.&rdquo;
            </p>
            <div className={styles.testimonialAuthor}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Patricia L.</strong>
                <span style={{ background: 'rgba(20, 184, 166, 0.12)', color: '#2DD4BF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>Verificada</span>
              </div>
              <span>Almacén La Esperanza · La Plata</span>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars}>
              {[...Array(5)].map((_, si) => (
                <svg key={si} width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
            <p className={styles.testimonialQuote}>
              &ldquo;Tengo tres cajeros en horarios rotativos. Con la conciliación POSnet y el arqueo de Smart Caja cada turno queda firmado y cerrado sin discusiones.&rdquo;
            </p>
            <div className={styles.testimonialAuthor}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Martín R.</strong>
                <span style={{ background: 'rgba(20, 184, 166, 0.12)', color: '#2DD4BF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>Verificado</span>
              </div>
              <span>Lubricentro San Martín · CABA</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="planes" className={styles.pricingSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Transparencia Absoluta</div>
          <h2>Planes a tu medida en pesos argentinos</h2>
          <p>Sin costos ocultos ni permanencia obligatoria. Todas las herramientas habilitadas en tu período de prueba.</p>
        </div>

        <div className={styles.pricingGrid}>
          {PLANS.map((plan, pi) => (
            <div key={pi} className={plan.highlight ? styles.pricingCardPro : styles.pricingCard}>
              {plan.badge && <div className={styles.popularBadge}>{plan.badge}</div>}
              <div>
                <h3>Plan {plan.name}</h3>
                <p className={styles.planDesc}>{plan.desc}</p>
                <div className={styles.price}>{plan.price}<span className={styles.pricePeriod}>/ mes</span></div>
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
                      <span className={styles.featureSoonPill}>Próximamente</span>
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

        {/* Security and Payment Logos */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          marginTop: '40px',
          opacity: 0.85,
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8' }}>Cobranzas y suscripciones gestionadas por:</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ background: '#009EE3', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>Mercado Pago</span>
            <span style={{ background: '#FFFFFF', color: '#1A1A1A', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>VISA</span>
            <span style={{ background: '#FFFFFF', color: '#1A1A1A', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>Mastercard</span>
            <span style={{ background: '#FFFFFF', color: '#1A1A1A', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>Cabal</span>
          </div>
        </div>

        <p className={styles.pricingNote}>
          <strong>Facturación oficial ARCA</strong> (comprobantes electrónicos A, B y C) estará habilitada próximamente para todos los usuarios activos sin cargos adicionales.
        </p>
      </section>

      {/* ── Lead Magnet Section (Corporate Guide) ── */}
      <section style={{ maxWidth: '840px', margin: '0 auto 100px', padding: '0 24px', textAlign: 'center' }}>
        <div style={{
          background: '#0E1727',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px 32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)'
        }}>
          <div style={{ color: '#2DD4BF', display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <LedgerBookIcon />
          </div>
          <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#fff', marginBottom: '8px', letterSpacing: '0.02em' }}>
            Guía Profesional: 5 Claves para Evitar Fugas de Caja
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '0.9375rem', maxWidth: '580px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Descargá el manual técnico en PDF con los procedimientos recomendados para auditar turnos de cajeros y controlar mercadería sin pérdidas.
          </p>

          {leadSubmitted ? (
            <div style={{
              background: 'rgba(20, 184, 166, 0.12)',
              border: '1px solid rgba(45, 212, 191, 0.35)',
              color: '#2DD4BF',
              padding: '18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.9375rem',
              maxWidth: '520px',
              margin: '0 auto'
            }}>
              Registro confirmado. Te enviamos el enlace de descarga directa a tu casilla de correo.
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxWidth: '520px',
              margin: '0 auto',
              textAlign: 'left'
            }}>
              {leadError && (
                <div style={{ color: '#F87171', fontSize: '0.85rem' }}>
                  {leadError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  className="form-input"
                  placeholder="Tu Nombre Completo"
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
                  <option value="ropa">Indumentaria / Calzado</option>
                  <option value="ferreteria">Ferretería / Bazar</option>
                  <option value="otro">Otro Rubro Comercial</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Tu Correo Electrónico"
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
                  {leadLoading ? 'Enviando...' : 'Descargar PDF'}
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
          <h2>Preguntas Frecuentes de Comerciantes</h2>
          <p>Respuestas claras sobre la puesta en marcha, medios de pago y compatibilidad.</p>
        </div>
        <div className={styles.faqGrid}>
          <div className={styles.faqCard}>
            <h4>¿Qué diferencia a Smart Caja de una planilla o software tradicional?</h4>
            <p>Smart Caja fue concebido en el mostrador: arqueos de caja ciegos por turno, conciliación de cupones POSnet de tarjetas, fiados con alertas de límite y rentabilidad real calculada por costo de reposición.</p>
          </div>
          <div className={styles.faqCard}>
            <h4>¿Tengo que comprar lectores o computadoras especiales?</h4>
            <p>No. Smart Caja funciona 100% en la nube desde el navegador web de cualquier PC, tablet o celular. Podés usar la cámara del teléfono como escáner de barras o conectar cualquier lector USB estándar.</p>
          </div>
          <div className={styles.faqCard}>
            <h4>¿Cómo funciona la prueba gratuita de 15 días?</h4>
            <p>Comenzás inmediatamente sin ingresar tarjetas de crédito ni firmar contratos. Tenés 15 días completos con acceso irrestricto a todas las funciones del sistema en tu negocio.</p>
          </div>
          <div className={styles.faqCard}>
            <h4>¿Cómo nos asisten con la carga inicial de productos?</h4>
            <p>Brindamos servicio de migración técnica bonificado por WhatsApp: nos enviás tus planillas de Excel, listas de precios en PDF o facturas de proveedores y cargamos tu catálogo en 24 horas.</p>
          </div>
          <div className={styles.faqCard}>
            <h4>¿Puedo cobrar con Mercado Pago y QR en el mostrador?</h4>
            <p>Sí. Podés vincular tu cuenta de cobros para generar códigos QR y links de pago automáticos directamente integrados al ticket del punto de venta.</p>
          </div>
          <div className={styles.faqCard}>
            <h4>¿Existe algún plazo de permanencia obligatoria?</h4>
            <p>No. Podés dar de baja tu suscripción en cualquier momento desde tu panel de configuración con un solo clic y sin penalidades.</p>
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2>BLINDÁ LA CAJA Y EL STOCK DE TU NEGOCIO</h2>
          <p>Unite a los cientos de comercios que operan con velocidad, evitan faltantes de dinero y tienen control total cada día.</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <Link href="/register?coupon=LANZAMIENTO50" className={styles.heroButton} style={{ padding: '16px 40px', fontSize: '1.0625rem' }}>
              <span>Comenzar prueba gratis de 15 días</span>
              <ArrowRight />
            </Link>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>
              Puesta en marcha en 2 minutos · 15 días de acceso total · Sin tarjetas
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <BrandLogo size={28} textSize="1.15rem" />
        </div>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>Privacidad</Link>
          <Link href="/terms" className={styles.footerLink}>Términos del Servicio</Link>
          <a href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola%20Smart%20Caja,%20tengo%20una%20consulta`} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Soporte Oficial WhatsApp</a>
        </div>
        <div>© 2026 Smart Caja. Sistema de Gestión Comercial.</div>
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
