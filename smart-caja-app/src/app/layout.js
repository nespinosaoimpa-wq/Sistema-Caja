import { Inter, Plus_Jakarta_Sans, Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/hooks/useAuth'
import { ToastProvider } from '@/lib/hooks/useToast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://smartcaja.com'),
  title: 'Smart Caja — Sistema POS Inteligente',
  description: 'Sistema de gestión de caja, stock y ventas para cualquier tipo de negocio. Fácil, rápido y potente.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Smart Caja',
  },
  openGraph: {
    title: 'Smart Caja — Sistema POS Inteligente',
    description: 'Gestioná tu stock, turnos, ventas y tienda online en tiempo real. ¡Probá 5 días gratis!',
    url: 'https://smartcaja.com',
    siteName: 'Smart Caja',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Smart Caja — Sistema POS Inteligente',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Caja — Sistema POS Inteligente',
    description: 'Gestioná tu stock, turnos, ventas y tienda online en tiempo real. ¡Probá 5 días gratis!',
    images: ['/og-image.png'],
  },
}


export const generateViewport = () => ({
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#7C3AED',
})

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
