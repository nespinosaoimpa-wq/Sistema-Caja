import Link from 'next/link'

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', padding: '64px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-card)', padding: '48px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>
          ← Volver al inicio
        </Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '32px', fontFamily: 'var(--font-headline)' }}>Términos y Condiciones</h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p>Última actualización: 22 de Mayo de 2026</p>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar el software Smart Caja (&quot;el Servicio&quot;), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de los términos, no podrá utilizar nuestro Servicio.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>2. Descripción del Servicio</h2>
            <p>Smart Caja es una plataforma de Software as a Service (SaaS) diseñada para la gestión de puntos de venta (POS), inventario, turnos y estadísticas orientada a comercios minoristas y mayoristas en la República Argentina.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>3. Suscripciones y Pagos</h2>
            <p>El Servicio se ofrece mediante planes de suscripción mensual (Básico, Profesional, Empresa). Los pagos se procesan a través de MercadoPago. La falta de pago resultará en la limitación de acceso a las funcionalidades Premium correspondientes a cada plan.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>4. Disponibilidad y Garantías</h2>
            <p>Nos esforzamos por mantener una disponibilidad del 99.9%. Sin embargo, el Servicio se provee &quot;tal cual&quot; (as is), sin garantías expresas o implícitas sobre interrupciones temporales debido a mantenimientos o fallas de servidores externos (ej: Vercel, Supabase).</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '12px' }}>5. Limitación de Responsabilidad</h2>
            <p>Smart Caja no será responsable por la pérdida de datos, lucro cesante o cálculos erróneos que puedan surgir del mal uso de la plataforma por parte del usuario o fallas técnicas imprevistas. El usuario es responsable de verificar la correcta facturación y arqueo de caja.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
