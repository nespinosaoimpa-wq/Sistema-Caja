'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react'

export default function PromoPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 22, seconds: 45 })
  const [monthlySales, setMonthlySales] = useState(800000)
  const [estimatedLoss, setEstimatedLoss] = useState(6)

  useEffect(() => {
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
  const roiMultiplier = ((monthlySavings / 60000) * 100).toFixed(0)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080E1A',
      color: '#F8FAFC',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #0F766E 0%, #0D9488 50%, #0369A1 100%)',
        color: '#FFFFFF',
        padding: '10px 20px',
        textAlign: 'center',
        fontSize: '0.8125rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        letterSpacing: '0.02em',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
      }}>
        <Clock size={16} />
        <span>CUPOS LIMITADOS: 14 LUGARES RESTANTES CON 50% OFF DE LANZAMIENTO</span>
      </div>

      {/* Nav */}
      <nav style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #0F766E, #0284C7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 900,
            fontFamily: 'var(--font-headline)',
            fontSize: '1rem'
          }}>
            SC
          </div>
          <span style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.35rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#FFFFFF',
            textTransform: 'uppercase'
          }}>
            Smart <span style={{ color: '#2DD4BF' }}>Caja</span>
          </span>
        </div>

        <Link
          href="/register?coupon=LANZAMIENTO50"
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: '#0D9488',
            color: '#FFFFFF',
            fontFamily: 'var(--font-headline)',
            fontSize: '0.875rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
          }}
        >
          Reclamar Lugar
        </Link>
      </nav>

      {/* Hero Section */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '70px 24px 40px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(20, 184, 166, 0.12)',
          border: '1px solid rgba(45, 212, 191, 0.3)',
          color: '#2DD4BF',
          fontSize: '0.75rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '24px'
        }}>
          <Sparkles size={14} /> Oferta Especial de Lanzamiento
        </div>

        <h1 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          margin: '0 0 20px 0',
          color: '#FFFFFF'
        }}>
          Digitalizá tu comercio y ahorrá <br />
          <span style={{ color: '#F6EAC2' }}>50% en tu primer mes</span>
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
          color: '#94A3B8',
          maxWidth: '680px',
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          Control de inventario, arqueos de caja auditados, cuentas corrientes y catálogo web para WhatsApp en una sola plataforma. Comenzá con <strong>15 días de prueba gratis</strong>.
        </p>

        {/* Countdown */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '36px'
        }}>
          {[
            { label: 'Días', val: timeLeft.days },
            { label: 'Horas', val: timeLeft.hours },
            { label: 'Minutos', val: timeLeft.minutes },
            { label: 'Segundos', val: timeLeft.seconds },
          ].map((t, i) => (
            <div key={i} style={{
              background: '#0E1727',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 18px',
              minWidth: '76px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.85rem',
                fontWeight: 700,
                color: '#2DD4BF',
                lineHeight: 1
              }}>
                {t.val.toString().padStart(2, '0')}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#64748B',
                textTransform: 'uppercase',
                marginTop: '4px',
                fontWeight: 700,
                letterSpacing: '0.06em'
              }}>
                {t.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/register?coupon=LANZAMIENTO50"
            style={{
              padding: '16px 36px',
              borderRadius: '12px',
              background: '#0D9488',
              color: '#FFFFFF',
              fontFamily: 'var(--font-headline)',
              fontSize: '1.05rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(13, 148, 136, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Reclamar 50% OFF (Código: LANZAMIENTO50) <ArrowRight size={18} />
          </Link>
          <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Cupón pre-aplicado · 15 días de prueba completa sin cargo · Sin tarjetas
          </span>
        </div>
      </section>

      {/* Loss & ROI Calculator */}
      <section style={{ maxWidth: '850px', margin: '40px auto 80px', padding: '0 24px' }}>
        <div style={{
          background: '#0E1727',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px'
        }}>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>
              Calculá tu Ahorro Mensual
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94A3B8', marginBottom: '8px', fontWeight: 600 }}>
                <span>Ventas Mensuales Estimadas</span>
                <span style={{ color: '#2DD4BF', fontWeight: 700 }}>${monthlySales.toLocaleString('es-AR')} ARS</span>
              </div>
              <input
                type="range"
                min="100000"
                max="3000000"
                step="50000"
                value={monthlySales}
                onChange={e => setMonthlySales(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0D9488', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94A3B8', marginBottom: '8px', fontWeight: 600 }}>
                <span>Pérdidas no registradas (Fugas / Errores)</span>
                <span style={{ color: '#F87171', fontWeight: 700 }}>{estimatedLoss}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="0.5"
                value={estimatedLoss}
                onChange={e => setEstimatedLoss(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0D9488', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{
            background: '#0B1322',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
              Dinero Recuperable por Mes
            </span>
            <div style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#F6EAC2',
              margin: '8px 0'
            }}>
              ${monthlySavings.toLocaleString('es-AR')}
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.8125rem', lineHeight: 1.5, marginBottom: '14px' }}>
              El plan Profesional cuesta solo $60.000/mes ($30.000 el 1er mes con descuento). La plataforma se paga sola desde la primera semana.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              color: '#2DD4BF',
              fontWeight: 700
            }}>
              <TrendingUp size={16} /> Retorno de Inversión (ROI): {roiMultiplier}%
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: '900px', margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#FFFFFF',
          textAlign: 'center',
          marginBottom: '32px',
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          Casos de Éxito en Comercios Reales
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{
            background: '#0E1727',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <p style={{ color: '#CBD5E1', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '16px', fontStyle: 'italic' }}>
              &ldquo;Tenía miedo de que el sistema fuera complejo de usar, pero lo configuramos con el celular en 10 minutos. Llevo 3 meses usando Smart Caja y el arqueo de caja me ahorró muchísimos dolores de cabeza.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: '#2DD4BF' }} />
              <div>
                <strong style={{ color: '#FFFFFF', fontSize: '0.85rem', display: 'block' }}>Patricia L.</strong>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Kiosco La Esperanza</span>
              </div>
            </div>
          </div>

          <div style={{
            background: '#0E1727',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <p style={{ color: '#CBD5E1', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '16px', fontStyle: 'italic' }}>
              &ldquo;Antes anotaba los fiados en cuadernos que siempre se perdían o los clientes se olvidaban. Con las Cuentas Corrientes cobro en el acto y sé exactamente quién me debe y cuánto.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: '#2DD4BF' }} />
              <div>
                <strong style={{ color: '#FFFFFF', fontSize: '0.85rem', display: 'block' }}>Carlos M.</strong>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Almacén Moreno</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ maxWidth: '850px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0B1322 0%, #0E1727 100%)',
          border: '1px solid rgba(45, 212, 191, 0.3)',
          borderRadius: '20px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.85rem',
            fontWeight: 700,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            margin: '0 0 10px 0'
          }}>
            Reclamá tu cupón de 50% OFF
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9375rem', maxWidth: '540px', margin: '0 auto 24px' }}>
            La promoción expira al finalizar el contador o agotarse los 14 cupos restantes.
          </p>
          <Link
            href="/register?coupon=LANZAMIENTO50"
            style={{
              padding: '16px 36px',
              borderRadius: '12px',
              background: '#0D9488',
              color: '#FFFFFF',
              fontFamily: 'var(--font-headline)',
              fontSize: '1.05rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(13, 148, 136, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Registrarme Gratis Ahora <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '30px 24px',
        textAlign: 'center',
        fontSize: '0.8125rem',
        color: '#64748B'
      }}>
        Smart Caja © 2026. Todos los derechos reservados.
      </footer>
    </div>
  )
}
