'use client'

import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  ShoppingBag,
  MessageCircle,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react'

export default function CatalogoGratisLanding() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080E1A',
      color: '#F8FAFC',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Decorative ambient light */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Header */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
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
          href="/login"
          style={{
            color: '#94A3B8',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'color 0.2s'
          }}
        >
          Iniciar sesión
        </Link>
      </nav>

      {/* Hero Section */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '70px 24px 40px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(20, 184, 166, 0.12)',
          color: '#2DD4BF',
          padding: '6px 16px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '24px',
          border: '1px solid rgba(45, 212, 191, 0.3)'
        }}>
          <Sparkles size={14} /> Tienda Web 100% Bonificada
        </div>

        <h1 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          margin: 0,
          color: '#FFFFFF'
        }}>
          Creá tu Catálogo Online con <br />
          <span style={{ color: '#F6EAC2' }}>Pedidos Directos a WhatsApp</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: '#94A3B8',
          maxWidth: '650px',
          margin: '20px auto 0',
          lineHeight: 1.6
        }}>
          Mostrá tus productos con fotos, precios y stock. Permití que tus clientes armen su carrito y recibí la orden armada en tu celular. Listo en 1 minuto.
        </p>

        {/* Comparison Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginTop: '48px',
          textAlign: 'left'
        }}>
          {/* Card A: Other platforms */}
          <div style={{
            background: '#0E1727',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Plataformas Tradicionales
            </div>
            <div style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '2rem',
              fontWeight: 700,
              color: '#F87171',
              margin: '8px 0',
              textDecoration: 'line-through'
            }}>
              $35.000 – $85.000
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.4 }}>
              Costo fijo por mes, sumado a un 2% a 5% de comisión obligatoria sobre cada venta cobrada.
            </div>
          </div>

          {/* Card B: Smart Caja */}
          <div style={{
            background: 'rgba(15, 118, 110, 0.12)',
            border: '2px solid #2DD4BF',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 12px 30px -10px rgba(45, 212, 191, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#2DD4BF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Con Smart Caja
              </span>
              <span style={{
                background: '#2DD4BF',
                color: '#080E1A',
                fontSize: '0.65rem',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.04em'
              }}>
                INCLUIDO
              </span>
            </div>
            <div style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '2.4rem',
              fontWeight: 700,
              color: '#F6EAC2',
              margin: '4px 0'
            }}>
              $0 / Gratis
            </div>
            <div style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
              Gratis para siempre. Cero comisiones sobre tus ventas.
            </div>
          </div>
        </div>

        {/* Main CTA */}
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/register?mode=store"
            style={{
              background: '#0D9488',
              color: '#FFFFFF',
              fontFamily: 'var(--font-headline)',
              fontWeight: 700,
              fontSize: '1.1rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '16px 40px',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(13, 148, 136, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.1s ease'
            }}
          >
            Crear Mi Catálogo Gratis Ahora <ArrowRight size={18} />
          </Link>
          <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Se configura en 1 minuto · Sin tarjetas de crédito ni contratos
          </span>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{
        maxWidth: '900px',
        margin: '40px auto 80px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            {
              icon: ShoppingBag,
              title: 'Catálogo con Carrito',
              desc: 'Tus clientes seleccionan talles, kilos o variantes y arman su pedido.'
            },
            {
              icon: MessageCircle,
              title: 'Pedidos a WhatsApp',
              desc: 'Recibís la lista con los artículos, total y dirección directo en tu chat.'
            },
            {
              icon: RefreshCw,
              title: 'Stock Sincronizado',
              desc: 'Si vendés en tu caja o en el catálogo, el inventario se actualiza solo.'
            },
            {
              icon: Clock,
              title: 'Horarios de Atención',
              desc: 'El catálogo avisa a tus clientes si tu comercio está abierto o cerrado.'
            }
          ].map((feat, i) => {
            const Icon = feat.icon
            return (
              <div
                key={i}
                style={{
                  background: '#0E1727',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(20, 184, 166, 0.12)',
                  color: '#2DD4BF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: '0 0 6px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                  {feat.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '30px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '0.8125rem',
        color: '#64748B',
        position: 'relative',
        zIndex: 2
      }}>
        Smart Caja © 2026. Todos los derechos reservados.
      </footer>
    </div>
  )
}
