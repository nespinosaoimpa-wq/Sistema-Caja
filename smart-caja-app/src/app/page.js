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
          <a href="#caracteristicas" className={styles.navLink} onClick={() => setMenuOpen(false)}>Características</a>
          <a href="#precios" className={styles.navLink} onClick={() => setMenuOpen(false)}>Precios</a>
          <a href="#testimonios" className={styles.navLink} onClick={() => setMenuOpen(false)}>Testimonios</a>
          
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
        <div className={styles.trustBadge}>
          <span className={styles.activeDot}></span>
          Más de 200 comercios activos hoy
        </div>
        <h1 className={styles.heroTitle}>
          Tu negocio, <span className={styles.gradientText}>digitalizado</span>
        </h1>
        <p className={styles.heroDesc}>
          Kiosco, almacén, fiambrería, indumentaria, lubricentro, farmacia, ferretería, bazar, verdulería, dietética o regalería — un solo sistema para gestionar todo con precisión, rapidez y control.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Link href="/register" className={styles.heroButton}>
            Empezar prueba gratis
          </Link>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            5 días gratis · Sin tarjetas de crédito · Listo en 2 minutos
          </span>
        </div>
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
      <section id="caracteristicas" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2>Herramientas para crecer</h2>
          <p>Todo lo que necesitas en una sola plataforma, optimizado y sin rodeos.</p>
        </div>

        <div className={styles.featuresGrid}>
          {[
            { 
              title: 'Caja Registradora', 
              desc: 'Ventas rápidas, cierres precisos, arqueos POSnet y soporte para transferencias bancarias directas.', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="14" x2="6" y2="14.01"/>
                  <line x1="10" y1="14" x2="10" y2="14.01"/>
                  <line x1="14" y1="14" x2="14" y2="14.01"/>
                  <line x1="18" y1="14" x2="18" y2="14.01"/>
                  <path d="M6 21h12"/>
                </svg>
              )
            },
            { 
              title: 'Inventario con Scanner', 
              desc: 'Gestión de stock en tiempo real con escáner de códigos de barras mediante cámara o lector físico.', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              )
            },
            { 
              title: 'Cuentas Corrientes y Fiados', 
              desc: 'Elimina los cuadernos. Registra compras fiadas, saldos de clientes e historial de deudas de forma segura.', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              )
            },
            { 
              title: 'Estadísticas de Ventas', 
              desc: 'Analíticas avanzadas por horas y meses para entender el rendimiento real de tu comercio.', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              )
            },
            { 
              title: 'Facturación y Tickets', 
              desc: 'Listo para emitir comprobantes legales, enviarlos por WhatsApp o imprimirlos al instante.', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
                  <path d="M16 8H8"/>
                  <path d="M16 12H8"/>
                  <path d="M13 16H8"/>
                </svg>
              )
            },
            { 
              title: 'Control Multi-Sucursal', 
              desc: 'Centraliza el stock y los reportes de múltiples sucursales o franquicias desde una sola cuenta.', 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                  <line x1="9" y1="22" x2="9" y2="16"/>
                  <path d="M9 16h6v6"/>
                  <line x1="8" y1="6" x2="8.01" y2="6"/>
                  <line x1="16" y1="6" x2="16.01" y2="6"/>
                  <line x1="8" y1="11" x2="8.01" y2="11"/>
                  <line x1="16" y1="11" x2="16.01" y2="11"/>
                </svg>
              )
            },
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

      {/* Testimonials Section */}
      <section id="testimonios" className={styles.testimonialsSection}>
        <div className={styles.sectionHeader}>
          <h2>Testimonios reales</h2>
          <p>Comercios que ya digitalizaron su gestión y aumentaron su rentabilidad.</p>
        </div>
        <div className={styles.testimonialsGrid}>
          {[
            {
              quote: "Descubrí que me faltaba mercadería por más de $30.000 al mes en el stock. Con el inventario y la conciliación de caja de Smart Caja ese problema desapareció por completo.",
              author: "Carlos M.",
              role: "Dueño de Minimarket",
              location: "Moreno, Buenos Aires"
            },
            {
              quote: "El sistema de cuentas corrientes cambió la vida de mi negocio. Anotaba los fiados en cuadernos que siempre se perdían. Ahora sé el saldo de cada cliente en segundos.",
              author: "Patricia L.",
              role: "Almacén La Esperanza",
              location: "La Plata, Buenos Aires"
            },
            {
              quote: "Tengo tres empleados en turnos rotativos. Con la conciliación de cupones POSnet de Smart Caja, cada centavo cobrado en débito o crédito queda perfectamente auditado.",
              author: "Martín R.",
              role: "Lubricentro San Martín",
              location: "CABA"
            }
          ].map((test, i) => (
            <div key={i} className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>
                {[...Array(5)].map((_, starIndex) => (
                  <svg key={starIndex} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#FFB800' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p className={styles.testimonialQuote}>"{test.quote}"</p>
              <div className={styles.testimonialAuthor}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <strong>{test.author}</strong>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(78, 222, 163, 0.1)', color: 'var(--color-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Comercio Verificado
                  </span>
                </div>
                <span>{test.role} · {test.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className={styles.pricingSection}>
        <div className={styles.sectionHeader}>
          <h2>Planes a tu medida</h2>
          <p>Transparencia y crecimiento para cada etapa de tu comercio.</p>
        </div>

        <div className={styles.pricingGrid}>
          {/* Basic */}
          <div className={styles.pricingCard}>
            <h3>Básico</h3>
            <p className={styles.planDesc}>Para pequeños comercios que recién empiezan.</p>
            <div className={styles.price}>$20.000<span className={styles.pricePeriod}>/mes</span></div>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Caja registradora completa
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Inventario básico
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Ticket digital e impreso
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Soporte estándar
              </div>
            </div>
            <Link href="/register" className={styles.pricingButton}>
              Elegir Básico
            </Link>
          </div>

          {/* Pro */}
          <div className={styles.pricingCardPro}>
            <div className={styles.popularBadge}>MÁS POPULAR</div>
            <h3>Profesional</h3>
            <p className={styles.planDesc}>La herramienta completa para hacer crecer tu negocio.</p>
            <div className={styles.price}>$35.000<span className={styles.pricePeriod}>/mes</span></div>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Todo lo del plan Básico
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Estadísticas de ventas avanzadas
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Cuentas Corrientes y Fiados
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Plan de cuotas e intereses
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Soporte prioritario por WhatsApp
              </div>
            </div>
            <Link href="/register" className={styles.pricingButtonPro}>
              Elegir Profesional
            </Link>
          </div>

          {/* Enterprise */}
          <div className={styles.pricingCard}>
            <h3>Empresa</h3>
            <p className={styles.planDesc}>Múltiples sucursales y control centralizado.</p>
            <div className={styles.price}>$60.000<span className={styles.pricePeriod}>/mes</span></div>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Todo lo del plan Profesional
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Multi-sucursal y Casa Central
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                API de integración y cargas masivas
              </div>
              <div className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Soporte dedicado 24/7
              </div>
            </div>
            <Link href="/register" className={styles.pricingButton}>
              Elegir Empresa
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <h2>Preguntas frecuentes</h2>
          <p>Respuestas rápidas a las dudas comunes.</p>
        </div>
        <div className={styles.faqGrid}>
          {[
            { q: "¿Es necesario instalar algún programa?", a: "No, Smart Caja es un sistema POS en la nube. Funciona desde el navegador de cualquier celular, tablet o computadora sin descargas." },
            { q: "¿Cómo funciona la prueba gratis de 5 días?", a: "Te registras en 2 minutos sin tarjeta de crédito y accedes de inmediato a todas las funciones para validar si es útil para tu negocio." },
            { q: "¿Cómo me ayudan con la carga inicial de stock?", a: "Ofrecemos soporte directo por WhatsApp para ayudarte a importar masivamente tu lista de productos mediante planillas de Excel." },
            { q: "¿Tienen integración con Mercado Pago?", a: "Sí, puedes ingresar tus credenciales en la pestaña de configuración para habilitar cobros integrados." }
          ].map((faq, i) => (
            <div key={i} className={styles.faqCard}>
              <h4>{faq.q}</h4>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2>Transformá tu negocio hoy</h2>
          <p>
            Únete a cientos de comercios que ya controlan sus ventas y stock desde una sola plataforma.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Link href="/register" className={styles.heroButton}>
              Crear cuenta gratis
            </Link>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              Setup en 2 minutos · 5 días de prueba sin tarjetas
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>Smart Caja</div>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>Política de Privacidad</Link>
          <Link href="/terms" className={styles.footerLink}>Términos de Servicio</Link>
          <a href="https://wa.me/5491112345678?text=Hola%20Smart%20Caja,%20tengo%20una%20consulta%20comercial" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Chatear por WhatsApp</a>
        </div>
        <div>© 2026 Smart Caja. Todos los derechos reservados.</div>
      </footer>
    </div>
  )
}
