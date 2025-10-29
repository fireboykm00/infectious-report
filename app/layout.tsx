import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IDSR Platform - Infectious Disease Surveillance & Response',
  description: 'Comprehensive platform for national health authorities to detect, report, analyze, and respond to infectious disease outbreaks in real-time.',
  authors: [{ name: 'Ministry of Health' }],
  keywords: 'disease surveillance, outbreak detection, public health, IDSR, epidemiology, health informatics',
  openGraph: {
    title: 'IDSR Platform - Early Detection Saves Lives',
    description: 'Real-time infectious disease surveillance and response system for health authorities',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🏥</text></svg>" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
