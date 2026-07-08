'use client'

import Link from 'next/link'

export default function CatalogoGratisLanding() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#030816',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative ambient light */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
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
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.875rem',
            color: '#000'
          }}>
            SC
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Smart Caja</span>
        </div>

        <Link href="/login" style={{
          color: 'rgba(255,255,255,0.7)',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          Iniciar sesión
        </Link>
      </nav>

      {/* Hero Section */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '80px 24px 40px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(78, 222, 163, 0.12)',
          color: '#4edea3',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '24px',
          border: '1px solid rgba(78, 222, 163, 0.2)'
        }}>
          🚀 Lanzamiento Especial 100% Gratis
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          margin: 0
        }}>
          Creá tu Catálogo Online con <br/>
          <span style={{
            background: 'linear-gradient(135deg, #4edea3 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Pedidos por WhatsApp</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'rgba(255,255,255,0.6)',
          marginTop: '20px',
          maxWidth: '650px',
          margin: '20px auto 0',
          lineHeight: 1.5
        }}>
          Mostrá tus productos, permití que tus clientes armen su carrito, y recibí los pedidos directo en tu WhatsApp. Listo en 1 minuto.
        </p>

        {/* Big visual anchor pricing cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginTop: '48px',
          textAlign: 'left'
        }}>
          {/* Card A: Other platforms */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.03)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '20px',
            padding: '24px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(239, 68, 68, 0.8)', fontWeight: 700, textTransform: 'uppercase' }}>Otras Plataformas</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', margin: '8px 0', textDecoration: 'line-through' }}>
              $35.000 - $85.000
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
              Al mes, más comisiones por cada venta cobradas por Shopify o Tiendanube.
            </div>
          </div>

          {/* Card B: Smart Caja */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(78, 222, 163, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
            border: '2px solid #4edea3',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(78, 222, 163, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: '#4edea3', fontWeight: 800, textTransform: 'uppercase' }}>Con Smart Caja</span>
              <span style={{ background: '#4edea3', color: '#000', fontSize: '0.65rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>RECOMENDADO</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#4edea3', margin: '4px 0' }}>
              $0
            </div>
            <div style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 700 }}>
              Gratis para siempre. Sin comisiones de venta.
            </div>
          </div>
        </div>

        {/* Main CTA */}
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Link href="/register?mode=store" style={{
            background: 'linear-gradient(135deg, #4edea3, #7C3AED)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.125rem',
            padding: '18px 44px',
            borderRadius: '30px',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(78, 222, 163, 0.3)',
            transition: 'transform 0.1s ease',
            display: 'inline-block'
          }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Crear Mi Catálogo Gratis Ahora ➔
          </Link>
          <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
            Se configura en 1 minuto · No requiere tarjetas de crédito
          </span>
        </div>
      </section>

      {/* Isolated Simple Feature grid - Zero fluff */}
      <section style={{
        maxWidth: '900px',
        margin: '40px auto 80px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { emoji: '📱', title: 'Catálogo con Carrito', desc: 'Tus clientes eligen talles, colores y arman su pedido.' },
            { emoji: '💬', title: 'Pedidos a WhatsApp', desc: 'Recibís el detalle de la venta listo en tu celular.' },
            { emoji: '🔌', title: 'Tiendanube en 1 Clic', desc: 'Sincronizá e importá stock y fotos al instante.' },
            { emoji: '⏰', title: 'Horarios de Atención', desc: 'La tienda avisa a tus clientes si estás abierto o cerrado.' }
          ].map((feat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{feat.emoji}</div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', margin: '0 0 6px 0' }}>{feat.title}</h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '40px 24px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.4)',
        position: 'relative',
        zIndex: 2
      }}>
        Smart Caja © 2026. Todos los derechos reservados.
      </footer>
    </div>
  )
}
