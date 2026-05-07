'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// Each nav item gets its own color identity
const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    // Teal/cyan — the "home base" feel
    color: '#60d4b4',
    bg: 'rgba(96,212,180,0.15)',
    border: 'rgba(96,212,180,0.3)',
    glow: 'rgba(96,212,180,0.1)',
    icon: (
      // Grid / layout icon
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
      </svg>
    ),
  },
  {
    href: '/expenses',
    label: 'Expenses',
    // Rose/red — money going out
    color: '#fb7185',
    bg: 'rgba(251,113,133,0.15)',
    border: 'rgba(251,113,133,0.3)',
    glow: 'rgba(251,113,133,0.1)',
    icon: (
      // Receipt icon
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="currentColor" d="M4 2h16v20l-2-1.5L16 22l-2-1.5L12 22l-2-1.5L8 22l-2-1.5L4 22V2z" />
        <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" />
        <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" />
        <line x1="9" y1="17" x2="12" y2="17" stroke="currentColor" />
      </svg>
    ),
  },
  {
    href: '/income',
    label: 'Income',
    // Emerald/green — money coming in
    color: '#34d399',
    bg: 'rgba(52,211,153,0.15)',
    border: 'rgba(52,211,153,0.3)',
    glow: 'rgba(52,211,153,0.1)',
    icon: (
      // Wallet icon
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="currentColor" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path stroke="currentColor" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <circle cx="16" cy="14" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/investments',
    label: 'Investments',
    // Amber/gold — wealth building
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.15)',
    border: 'rgba(251,191,36,0.3)',
    glow: 'rgba(251,191,36,0.1)',
    icon: (
      // Trending up / bar chart
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline stroke="currentColor" points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline stroke="currentColor" points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    href: '/budgets',
    label: 'Budgets',
    // Violet/purple — planning & control
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.15)',
    border: 'rgba(167,139,250,0.3)',
    glow: 'rgba(167,139,250,0.1)',
    icon: (
      // Target / bullseye icon
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" stroke="currentColor" />
        <circle cx="12" cy="12" r="6" stroke="currentColor" />
        <circle cx="12" cy="12" r="2" stroke="currentColor" />
      </svg>
    ),
  },
]

export default function Sidebar({
  userEmail,
  onSignOut,
}: {
  userEmail?: string
  onSignOut?: () => void
}) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-64 border-r border-white/8 bg-[var(--bg-sidebar,#0d1117)]">

      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #60d4b4, #00a896)' }}>
            <span className="text-white font-black text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-base tracking-tight leading-none">Spendora</p>
            <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mt-0.5">
              Track. Budget. Grow.
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, color, bg, border, glow, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'text-white'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/5'
              )}
              style={isActive ? {
                background: bg,
                border: `1px solid ${border}`,
                boxShadow: `0 0 20px ${glow}`,
              } : {}}
            >
              {/* Icon wrapper */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={isActive
                  ? { color, background: `${color}22` }
                  : { color: 'rgba(255,255,255,0.3)' }
                }
              >
                {icon}
              </div>

              {/* Label */}
              <span className="flex-1">{label}</span>

              {/* Active indicator arrow */}
              {isActive && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
                  <polyline stroke="currentColor" points="9 18 15 12 9 6" />
                </svg>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 pt-3 border-t border-white/8 space-y-2">
        {/* User email */}
        {userEmail && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.03]">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #60d4b4, #a78bfa)' }}>
              {userEmail[0].toUpperCase()}
            </div>
            <span className="text-xs text-white/45 font-medium truncate flex-1">{userEmail}</span>
          </div>
        )}

        {/* Sign out */}
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold
              text-white/35 hover:text-rose-400 hover:bg-rose-400/8 transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path stroke="currentColor" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline stroke="currentColor" points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" />
            </svg>
            Sign out
          </button>
        )}
      </div>
    </aside>
  )
}
