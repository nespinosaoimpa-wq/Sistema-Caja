import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button, Hr } from '@react-email/components'
import * as React from 'react'

export const PaymentFailedEmail = ({ userName }) => {
  return (
    <Html>
      <Head />
      <Preview>Aviso importante sobre tu suscripción en Smart Caja</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={title}>Smart Caja</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>Problema con tu pago</Heading>
            <Text style={text}>
              Hola {userName},
            </Text>
            <Text style={text}>
              Te escribimos para avisarte que <strong>no pudimos procesar el cobro de tu última suscripción</strong>. Esto suele ocurrir si la tarjeta expiró, no tiene fondos suficientes, o fue rechazada por el banco.
            </Text>
            <Text style={text}>
              Para evitar interrupciones en el servicio y seguir usando todas las funciones premium de Smart Caja, te pedimos que actualices tu método de pago lo antes posible.
            </Text>
            
            <Section style={btnContainer}>
              <Button style={button} href="https://smartcaja.vercel.app/settings?tab=billing">
                Actualizar Método de Pago
              </Button>
            </Section>
            
            <Hr style={hr} />
            <Text style={footer}>
              Si ya resolviste este inconveniente o creés que es un error, por favor ignorá este correo.
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
  backgroundColor: '#EF4444', // Red for alert
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
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
}

const text = {
  color: '#9CA3AF',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
}

const btnContainer = {
  textAlign: 'center',
  margin: '32px 0',
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
  margin: '32px 0 16px',
}

const footer = {
  color: '#6B7280',
  fontSize: '14px',
  textAlign: 'center',
}

export default PaymentFailedEmail
