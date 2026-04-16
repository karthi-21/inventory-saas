import type { Metadata, Viewport } from 'next'
import '@fontsource/geist'
import '@fontsource/geist-mono'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { ServiceWorkerRegistration } from '@/components/providers/sw-registration'

export const metadata: Metadata = {
  title: 'Ezvento - Smart POS & Billing',
  description: 'Simple, powerful POS & Billing for Indian retailers',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ezvento',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <QueryProvider>
          <ServiceWorkerRegistration />
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
