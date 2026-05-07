import type { Metadata } from 'next'
import { Syne, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

/* Syne: geometric, high-impact display — perfect for the Luminary aesthetic */
const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ledger — Financial Intelligence',
  description: 'Track budgets, monitor investments, and own your financial future.',
  robots: 'noindex, nofollow',
  icons: {
    icon:     '/Icon.png',
    apple:    '/Icon.png',
    shortcut: '/Icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${syne.variable} ${dmSans.variable} ${dmMono.variable} font-body antialiased`}
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        {/* Ambient deep-space orbs — rendered once at root so they persist across all pages */}
        <div className="orb-layer" aria-hidden="true">
          <div
            className="orb"
            style={{
              width: '700px', height: '700px',
              background: 'radial-gradient(circle, rgba(67,56,202,0.13) 0%, transparent 70%)',
              top: '-180px', left: '-140px',
              animationDuration: '28s', animationDelay: '0s',
            }}
          />
          <div
            className="orb"
            style={{
              width: '900px', height: '900px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
              top: '20%', right: '-300px',
              animationDuration: '36s', animationDelay: '-6s',
              animationDirection: 'reverse',
            }}
          />
          <div
            className="orb"
            style={{
              width: '600px', height: '600px',
              background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)',
              bottom: '0', left: '15%',
              animationDuration: '22s', animationDelay: '-4s',
            }}
          />
          <div
            className="orb"
            style={{
              width: '500px', height: '500px',
              background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)',
              bottom: '20%', right: '8%',
              animationDuration: '30s', animationDelay: '-10s',
              animationDirection: 'reverse',
            }}
          />
        </div>

        {/* Page content sits above orbs */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
