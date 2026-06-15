'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../page.module.css'

export default function PromoPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 22, seconds: 45 })
  const [monthlySales, setMonthlySales] = useState(800000)
  const [estimatedLoss, setEstimatedLoss] = useState(6)

  // Countdown timer logic
  useEffect(() => {
    // Set target date (e.g. end of current month)
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 23, 59, 59)

    const timer = setInterval(() => {
      const difference = target.getTime() - new Date().getTime()
      if (difference <= 0) {
        clearInterval(timer)
        return
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24))
      const h = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const m = Math.floor((difference / 1000 / 60) % 60)
      const s = Math.floor((difference / 1000) % 60)

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const monthlySavings = (monthlySales * (estimatedLoss / 100))
  const roiMultiplier = ((monthlySavings / 20000) * 100).toFixed(0)

  return (
    <div className={styles.landingContainer} style={{ background: '#030816' }}>
      {/* Promo Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
        color: '#000',
        padding: '12px 24px',
        textAlign: 'center',
        fontSize: '0.9rem',
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
      }}>
        <span>⚠️ ¡Últimos 14 lugares con descuento de lanzamiento de este mes!</span>
      </div>

      {/* Header */}
      <nav className={styles.navbar} style={{ background: 'rgba(3, 8, 22, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}></div>
          <span className={styles.brandName}>Smart Caja</span>
        </div>
        <Link href="/register?coupon=LANZAMIENTO50" className={styles.registerButton}>
          Reclamar Mi Lugar Gratis
        </Link>
      </nav>

      {/* Hero */}
      <section className={styles.hero} style={{ paddingTop: '100px', paddingBottom: '40px' }}>
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          color: '#F59E0B',
          padding: '8px 20px',
          borderRadius: '9999px',
          fontSize: '0.8125rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '24px'
        }}>
          🎁 Oferta Especial Exclusiva
        </div>

        <h1 className={styles.heroTitle} style={{ fontSize: '3.5rem', maxWidth: '800px' }}>
          Digitalizá tu comercio y ahorrá <span className={styles.gradientText}>50% en tu primer mes</span>
        </h1>
        
        <p className={styles.heroDesc} style={{ maxWidth: '650px' }}>
          Dejá los cuadernos y las planillas manuales. Smart Caja te da control de inventario, arqueos auditados, fiados y cuotas en una sola pantalla. ¡Probá 5 días gratis hoy!
        </p>

        {/* Countdown */}
        <div style={{
          display: 'flex',
          gap: '16px',
          margin: '12px 0 32px',
          justifyContent: 'center'
        }}>
          {[
            { label: 'Días', val: timeLeft.days },
            { label: 'Horas', val: timeLeft.hours },
            { label: 'Minutos', val: timeLeft.minutes },
            { label: 'Segundos', val: timeLeft.seconds },
          ].map((t, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '12px 18px',
              minWidth: '70px',
              textAlign: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
                {t.val.toString().padStart(2, '0')}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px', fontWeight: 600 }}>
                {t.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Link href="/register?coupon=LANZAMIENTO50" className={styles.heroButton} style={{ background: 'var(--color-primary)', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)' }}>
            Registrarme con 50% OFF (Código: LANZAMIENTO50)
          </Link>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Cupón pre-aplicado en el checkout · 5 días de prueba completa gratis · Sin tarjetas
          </span>
        </div>
      </section>

      {/* Calculator Section */}
      <section style={{ maxWidth: '850px', margin: '40px auto 100px', padding: '0 24px' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '20px' }}>
              Calculá tus pérdidas mensuales
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                <span>Ventas Estimadas</span>
                <span style={{ color: 'var(--color-secondary)' }}>${monthlySales.toLocaleString('es-AR')}</span>
              </label>
              <input 
                type="range" 
                min="100000" 
                max="3000000" 
                step="50000"
                value={monthlySales} 
                onChange={e => setMonthlySales(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                <span>Pérdidas estimadas (Fugas)</span>
                <span style={{ color: '#EF4444' }}>{estimatedLoss}%</span>
              </label>
              <input 
                type="range" 
                min="2" 
                max="12" 
                step="0.5"
                value={estimatedLoss} 
                onChange={e => setEstimatedLoss(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ahorro Potencial</span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-secondary)', margin: '8px 0' }}>
              ${monthlySavings.toLocaleString('es-AR')} ARS
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '16px' }}>
              El plan Básico cuesta solo $20.000/mes ($10.000 el primer mes). La app se paga sola desde la primera semana.
            </p>
            <div style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 700 }}>
              📈 Retorno de Inversión (ROI): {roiMultiplier}%
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: '900px', margin: '0 auto 80px', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '40px' }}>
          Lo que dicen otros dueños de negocios
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', textAlign: 'left' }}>
          <div className="card" style={{ padding: '28px', background: 'var(--bg-card)' }}>
            <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '16px' }}>
              &ldquo;Tenía miedo de que el sistema fuera difícil de usar, pero lo configuramos con el celular en 10 minutos. Llevo 3 meses usando Smart Caja y el arqueo de caja me ahorró muchísimos dolores de cabeza.&rdquo;
            </p>
            <strong style={{ color: '#fff', fontSize: '0.875rem' }}>Patricia L. - Kiosco La Esperanza</strong>
          </div>
          <div className="card" style={{ padding: '28px', background: 'var(--bg-card)' }}>
            <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '16px' }}>
              &ldquo;Antes anotaba los fiados en cuadernos que siempre se perdían o los clientes se olvidaban. Con las Cuentas Corrientes cobro en el acto y sé exactamente quién me debe y cuánto.&rdquo;
            </p>
            <strong style={{ color: '#fff', fontSize: '0.875rem' }}>Carlos M. - Almacén Moreno</strong>
          </div>
        </div>
      </section>

      {/* Final Action */}
      <section className={styles.ctaSection} style={{ marginBottom: '80px' }}>
        <div className={styles.ctaBox}>
          <h2>Reclamá tu cupón de 50% OFF</h2>
          <p>La oferta expira al finalizar el contador o agotarse los 14 cupos disponibles.</p>
          <Link href="/register?coupon=LANZAMIENTO50" className={styles.heroButton} style={{ background: '#F59E0B', border: 'none', color: '#000 !important', fontWeight: 800 }}>
            Registrarme Gratis Ahora →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer} style={{ background: 'rgba(3,8,22,0.8)' }}>
        <div>Smart Caja © 2026. Todos los derechos reservados.</div>
        <div className={styles.footerLinks}>
          <Link href="/terms" className={styles.footerLink}>Términos</Link>
          <Link href="/privacy" className={styles.footerLink}>Privacidad</Link>
        </div>
      </footer>
    </div>
  )
}
