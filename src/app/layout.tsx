import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Super Sky Weather',
  description: 'Get accurate weather information from multiple sources',
  keywords: 'weather, forecast, temperature, conditions, super sky',
  authors: [{ name: 'Super Sky Weather Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Super Sky Weather',
    description: 'Get accurate weather information from multiple sources',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Super Sky Weather',
    description: 'Get accurate weather information from multiple sources',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Super Sky Weather',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body style={{ WebkitFontSmoothing: 'antialiased', backgroundColor: '#f9fafb' }}>
        {children}
      </body>
    </html>
  )
}
