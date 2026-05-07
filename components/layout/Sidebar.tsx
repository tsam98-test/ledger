'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Receipt, Target, LogOut,
  ChevronRight, Wallet, BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard-home', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/expenses',       label: 'Expenses',    icon: Receipt         },
  { href: '/income',         label: 'Income',      icon: Wallet          },
  { href: '/investments',    label: 'Investments', icon: BarChart2       },
  { href: '/budgets',        label: 'Budgets',     icon: Target          },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  /* Avatar initials from email */
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'LG'

  return (
    <aside
      className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 z-30"
      style={{
        background:   'rgba(2,5,9,0.95)',
        borderRight:  '1px solid rgba(99,102,241,0.08)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* ── Logo ── */}
      <div
        className="px-5 py-6"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
      >
        <div className="flex items-center gap-3">
          {/* Gem icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-bold animate-gem-pulse"
            style={{
              background: 'linear-gradient(135deg, #4338CA, #22D3EE)',
              boxShadow: '0 0 24px rgba(99,102,241,0.45), 0 0 48px rgba(34,211,238,0.12)',
            }}
          >
            ◈
          </div>
          <div>
            <p className="font-display text-xl leading-none" style={{ color: 'var(--text-primary)' }}>
              Ledger
            </p>
            <p
              className="text-[10px] mt-0.5 uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Financial Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p
          className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Main
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'text-white'
                  : 'hover:text-[var(--text-primary)] border border-transparent'
              )}
              style={
                active
                  ? {
                      background:   'rgba(99,102,241,0.14)',
                      border:       '1px solid rgba(99,102,241,0.22)',
                      color:        '#fff',
                      boxShadow:    '0 0 16px rgba(99,102,241,0.12)',
                    }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {/* Icon wrapper */}
              <span
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: active
                    ? 'rgba(99,102,241,0.25)'
                    : 'rgba(255,255,255,0.04)',
                }}
              >
                <Icon size={15} />
              </span>

              {label}

              {active && (
                <ChevronRight
                  className="ml-auto w-3.5 h-3.5"
                  style={{ color: 'rgba(99,102,241,0.6)' }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Footer: user + sign-out ── */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}
      >
        {/* User chip */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-default"
          style={{ background: 'rgba(99,102,241,0.06)' }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #4338CA, #22D3EE)',
              color: '#fff',
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {userEmail}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Pro Plan · Active
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.08)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#F43F5E'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
          }}
        >
          <span
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <LogOut size={14} />
          </span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
