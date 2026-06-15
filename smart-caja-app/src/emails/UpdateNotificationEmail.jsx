import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button, Hr } from '@react-email/components'
import * as React from 'react'

export const UpdateNotificationEmail = ({ userName }) => {
  return (
    <Html>
      <Head />
      <Preview>Novedades en Smart Caja: ¡Escáner móvil y ayuda para cargar tu stock!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={title}>Smart Caja</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>¡Grandes novedades para tu negocio! 🚀</Heading>
            <Text style={text}>
              Hola {userName || 'comerciante'},
            </Text>
            <Text style={text}>
              Queremos contarte que implementamos nuevas herramientas en Smart Caja diseñadas exclusivamente para facilitarte el trabajo diario y ayudarte a vender más:
            </Text>

            <Section style={featureSection}>
              <Text style={featureTitle}>📱 Celular como Lector de Barras</Text>
              <Text style={featureText}>
                Ya no necesitás comprar un lector láser físico. Vinculá la cámara de tu celular al punto de venta (POS) en 10 segundos desde la PC, y cargá tus productos al instante al escanearlos.
              </Text>
            </Section>

            <Section style={featureSection}>
              <Text style={featureTitle}>🤝 Recomendá y Ganá Meses Gratis</Text>
              <Text style={featureText}>
                En tu panel lateral verás la sección de <strong>Referidos</strong>. Compartí tu link amigo con otros comerciantes por WhatsApp: cuando activen su plan, <strong>te regalamos 1 mes gratis de suscripción</strong> a vos y ellos obtienen 30% de descuento.
              </Text>
            </Section>

            <Section style={featureSection}>
              <Text style={featureTitle}>⏰ Período de Prueba Gratis</Text>
              <Text style={featureText}>
                Tu prueba gratuita es de <strong>5 días</strong>. Además, si cargás más de 10 productos y realizás al menos 5 ventas, el sistema te regalará <strong>7 días adicionales</strong> automáticamente.
              </Text>
            </Section>

            <Hr style={hr} />

            <Heading style={h2}>💪 ¿Te da pereza cargar tus productos? ¡Te ayudamos!</Heading>
            <Text style={text}>
              Sabemos que pasar tus productos del papel o de las facturas al sistema lleva tiempo. <strong>Queremos facilitarte las cosas:</strong>
            </Text>
            <Text style={text}>
              Respondé a este correo adjuntando tus planillas de Excel, listas de precios de tus proveedores en PDF o simplemente <strong>fotos de tus facturas de compra</strong>, y nuestro equipo de soporte cargará tu inventario inicial gratis.
            </Text>
            
            <Section style={btnContainer}>
              <Button style={button} href="https://smartcaja.vercel.app/dashboard">
                Ingresar a mi Smart Caja
              </Button>
            </Section>
            
            <Hr style={hr} />
            <Text style={footer}>
              Si necesitás ayuda para subir tu stock, respondé a este correo o escribinos por WhatsApp al soporte oficial.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#0F1115',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 0',
  width: '580px',
}

const header = {
  padding: '20px 30px',
  backgroundColor: '#7C3AED',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center',
}

const title = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  backgroundColor: '#1E232B',
  padding: '40px 30px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #333C4D',
  borderTop: 'none',
}

const h1 = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 20px',
}

const h2 = {
  color: '#10B981',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 12px',
}

const text = {
  color: '#9CA3AF',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const featureSection = {
  marginBottom: '20px',
  paddingLeft: '12px',
  borderLeft: '3px solid #7C3AED',
}

const featureTitle = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px',
}

const featureText = {
  color: '#9CA3AF',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
}

const btnContainer = {
  textAlign: 'center',
  margin: '32px 0 16px',
}

const button = {
  backgroundColor: '#7C3AED',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#333C4D',
  margin: '32px 0 24px',
}

const footer = {
  color: '#6B7280',
  fontSize: '13px',
  textAlign: 'center',
  lineHeight: '20px',
}

export default UpdateNotificationEmail
