import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', padding: '64px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-card)', padding: '48px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>
          ← Volver al inicio
        </Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '32px', fontFamily: 'var(--font-headline)' }}>Política de Privacidad</h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p>Última actualización: 22 de Mayo de 2026</p>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>1. Información que Recopilamos</h2>
            <p>Recopilamos información personal necesaria para la prestación del servicio, incluyendo pero no limitado a: nombre del comercio, dirección de correo electrónico, nombre del titular y datos de facturación.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>2. Uso de la Información</h2>
            <p>Utilizamos sus datos para: (a) Proporcionar y mantener el Servicio; (b) Procesar sus pagos; (c) Notificarle sobre cambios en la plataforma; (d) Proveer soporte al cliente.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>3. Protección de Datos (Ley 25.326)</h2>
            <p>De conformidad con la Ley Nº 25.326 de Protección de los Datos Personales de la República Argentina, usted tiene derecho a acceder, rectificar o eliminar sus datos personales de nuestra base de datos. Para ejercer estos derechos, puede contactarnos a través de los canales de soporte.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>4. Seguridad de los Datos</h2>
            <p>Nuestra infraestructura (provista por Supabase y Vercel) utiliza cifrado de extremo a extremo y políticas de seguridad estrictas (Row Level Security) para garantizar que los datos de su inventario y ventas no puedan ser accedidos por otros usuarios de la plataforma.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>5. Compartir con Terceros</h2>
            <p>No vendemos ni comercializamos sus datos personales ni los datos de sus clientes. Solamente compartimos información con proveedores de servicios de infraestructura estrictamente necesarios (ej: MercadoPago para el procesamiento de suscripciones).</p>
          </section>
        </div>
      </div>
    </div>
  )
}
