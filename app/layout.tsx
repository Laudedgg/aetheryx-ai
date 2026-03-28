import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { IframeLoggerInit } from '@/components/IframeLoggerInit'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AgentInterceptorProvider } from '@/components/AgentInterceptorProvider'
import { HydrationGuard } from '@/components/HydrationGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aetheryx AI — The Intelligence Layer for Modern Sales',
  description: 'Real-time call transcription, prospect research, AI-powered objection handling, auto summaries and CRM sync.',
  icons: {
    icon: '/lyzr.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isPaidUser = process.env.IS_PAID_USER === 'true'
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
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
