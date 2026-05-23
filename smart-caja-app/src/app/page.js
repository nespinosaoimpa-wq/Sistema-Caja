'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.landingContainer}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}></div>
          <span className={styles.brandName}>Smart Caja</span>
        </div>
        
        {/* Toggle Button for mobile */}
        <button 
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ''}`} 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Links */}
        <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksActive : ''}`}>
          <span className={styles.navLink} onClick={() => setMenuOpen(false)}>Características</span>
          <span className={styles.navLink} onClick={() => setMenuOpen(false)}>Precios</span>
          <span className={styles.navLink} onClick={() => setMenuOpen(false)}>Testimonios</span>
          
          {/* Mobile Navigation Actions */}
          <div className={styles.navActionsMobile}>
            <Link href="/login" className={styles.loginLink} onClick={() => setMenuOpen(false)}>Login</Link>
            <Link href="/register" className={styles.registerButton} onClick={() => setMenuOpen(false)}>
              Empezar ahora
            </Link>
          </div>
        </div>

        {/* Actions for Desktop */}
        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginLink}>Login</Link>
          <Link href="/register" className={styles.registerButton}>
            Empezar ahora
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Tu negocio, <span className={styles.gradientText}>digitalizado</span>
        </h1>
        <p className={styles.heroDesc}>
          Kiosco, supermercado, boutique o lubricentro — un solo sistema para gestionar todo con precisión y control.
        </p>
        <Link href="/register" className={styles.heroButton}>
          Empezar ahora
        </Link>
      </section>

      {/* Hero Image / Dashboard Mockup */}
      <div className={styles.mockupWrapper}>
        <div className={styles.mockupBorder}>
          <img 
            src="/hero-dashboard.png" 
            alt="Smart Caja Dashboard" 
            className={styles.mockupImage}
          />
        </div>
      </div>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2>Herramientas para crecer</h2>
          <p>Todo lo que necesitas en una sola plataforma.</p>
        </div>

        <div className={styles.featuresGrid}>
          {[
            { title: 'Caja registradora', desc: 'Ventas rápidas, cierres precisos y control total del flujo de caja.', icon: '💰' },
            { title: 'Inventario con scanner', desc: 'Gestión de stock en tiempo real con integración de códigos de barras.', icon: '📦' },
            { title: 'Estadísticas de ventas', desc: 'Métricas clave para entender el crecimiento de tu negocio.', icon: '📈' },
            { title: 'Plan de cuotas', desc: 'Configura intereses y planes de pago a la medida de tus clientes.', icon: '📋' },
            { title: 'Tickets digitales', desc: 'Envía comprobantes por email o WhatsApp al instante.', icon: '🧾' },
            { title: 'Multi-empleados', desc: 'Control de accesos y registro de ventas por usuario.', icon: '👥' },
          ].map((feat, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                {feat.icon}
              </div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className={styles.pricingSection}>
        <div className={styles.sectionHeader}>
          <h2>Planes a tu medida</h2>
          <p>Transparencia y crecimiento para cada etapa.</p>
        </div>

        <div className={styles.pricingGrid}>
          {/* Basic */}
          <div className={styles.pricingCard}>
            <h3>Básico</h3>
            <p className={styles.planDesc}>Para negocios que recién empiezan.</p>
            <div className={styles.price}>$20.000<span className={styles.pricePeriod}>/mes</span></div>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Caja registradora</div>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Inventario básico</div>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Ticket digital</div>
            </div>
            <Link href="/register" className={styles.pricingButton}>
              Elegir Básico
            </Link>
          </div>

          {/* Pro */}
          <div className={styles.pricingCardPro}>
            <div className={styles.popularBadge}>MÁS POPULAR</div>
            <h3>Profesional</h3>
            <p className={styles.planDesc}>La herramienta completa para crecer.</p>
            <div className={styles.price}>$35.000<span className={styles.pricePeriod}>/mes</span></div>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Todo lo de Básico</div>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Estadísticas avanzadas</div>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Plan de cuotas</div>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Soporte prioritario</div>
            </div>
            <Link href="/register" className={styles.pricingButtonPro}>
              Elegir Profesional
            </Link>
          </div>

          {/* Enterprise */}
          <div className={styles.pricingCard}>
            <h3>Empresa</h3>
            <p className={styles.planDesc}>Múltiples sucursales y control total.</p>
            <div className={styles.price}>$60.000<span className={styles.pricePeriod}>/mes</span></div>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Todo lo de Profesional</div>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Multi-sucursal</div>
              <div className={styles.featureItem}><span className={styles.featureCheck}>✓</span> API de integración</div>
            </div>
            <Link href="/register" className={styles.pricingButton}>
              Elegir Empresa
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2>Transformá tu negocio hoy</h2>
          <p>
            Únete a cientos de comercios argentinos que ya controlan sus ventas y stock desde una sola plataforma.
          </p>
          <Link href="/register" className={styles.heroButton}>
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>Smart Caja</div>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>Política de Privacidad</Link>
          <Link href="/terms" className={styles.footerLink}>Términos de Servicio</Link>
          <a href="mailto:soporte@smartcaja.com.ar" className={styles.footerLink}>Contactar Soporte</a>
        </div>
        <div>© 2026 Smart Caja. All rights reserved.</div>
      </footer>
    </div>
  )
}
