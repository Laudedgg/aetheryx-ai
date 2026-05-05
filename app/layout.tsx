import type { Metadata, Viewport } from 'next'
import { Inter, Manrope, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { IframeLoggerInit } from '@/components/IframeLoggerInit'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AgentInterceptorProvider } from '@/components/AgentInterceptorProvider'
import { HydrationGuard } from '@/components/HydrationGuard'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['300', '400', '500', '600', '700'], display: 'swap' })
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], variable: '--font-instrument-serif', weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Aetheryx AI — The Intelligence Layer for Modern Sales',
  description: 'Real-time call transcription, prospect research, AI-powered objection handling, auto summaries and CRM sync.',
  icons: {
    icon: '/favicon.jpeg',
  },
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#05060A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${instrumentSerif.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <IframeLoggerInit />
        <ErrorBoundary>
          <AgentInterceptorProvider>
            <HydrationGuard>
              {children}
            </HydrationGuard>
          </AgentInterceptorProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
