import { Inter, Plus_Jakarta_Sans, Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/hooks/useAuth'
import { ToastProvider } from '@/lib/hooks/useToast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata = {
  title: 'Smart Caja — Sistema POS Inteligente',
  description: 'Sistema de gestión de caja, stock y ventas para cualquier tipo de negocio. Fácil, rápido y potente.',
  manifest: '/manifest.json',
  themeColor: '#7C3AED',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Smart Caja',
  },
}

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
